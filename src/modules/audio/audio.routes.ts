import fs from 'node:fs';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { getAccessTokenUser } from '../auth/token.service.js';
import { setTrackGenres } from '../genre/genre.service.js';
import { createRangeResponse, removeLocalAudio, resolveLocalAudioPath, saveAudioFile } from './audio.service.js';

type HttpError = Error & { status?: number };

function jsonSafe(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item)));
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function errorStatus(error: unknown): number {
  return typeof (error as HttpError)?.status === 'number' ? (error as HttpError).status! : 400;
}

function readUser(c: Context) {
  try {
    return getAccessTokenUser(c.req.raw);
  } catch (_error) {
    return null;
  }
}

function requireArtistOrAdmin(c: Context) {
  const user = readUser(c);

  if (!user) return { response: c.json({ message: 'Unauthorized' }, 401) };
  if (!['artist', 'admin'].includes(user.role)) return { response: c.json({ message: 'Forbidden' }, 403) };

  return { user };
}

function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (value === null || value === undefined || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return Number(value);
}

function parseStringArray(value: unknown): string[] {
  if (!value) return [];

  const text = String(value).trim();
  if (!text) return [];

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
    } catch (_error) {
      return [];
    }
  }

  return text.split(',').map((item) => item.trim()).filter(Boolean);
}

function durationMsFromForm(form: FormData): number | undefined {
  const durationMs = parseNumber(form.get('durationMs'));
  if (durationMs) return durationMs;

  const durationSec = parseNumber(form.get('durationSec'));
  return durationSec ? durationSec * 1000 : undefined;
}

function audioFileFromForm(form: FormData): File | null {
  const audio = form.get('audio');
  return !audio || typeof audio === 'string' ? null : audio;
}

export function createAudioRoutes({ prisma }: { prisma: PrismaClient }) {
  const routes = new Hono();

  routes.post('/upload', async (c) => {
    const auth = requireArtistOrAdmin(c);
    if (auth.response) return auth.response;

    const form = await c.req.raw.formData();
    const audio = audioFileFromForm(form);
    const durationMs = durationMsFromForm(form);
    const artistId = form.get('artistId') || form.get('artist');
    const title = form.get('title');

    if (!audio) return c.json({ message: 'Audio file is required. Use multipart field name "audio".' }, 400);
    if (!durationMs) return c.json({ message: 'durationMs is required' }, 400);
    if (!artistId) return c.json({ message: 'artistId is required' }, 400);
    if (!title) return c.json({ message: 'title is required' }, 400);

    let savedAudio;

    try {
      savedAudio = await saveAudioFile(audio);
      const track = await prisma.track.create({
        data: {
          artistId: String(artistId),
          albumId: form.get('albumId') ? String(form.get('albumId')) : undefined,
          title: String(title),
          durationMs,
          trackNumber: parseNumber(form.get('trackNumber')),
          coverUrl: form.get('coverUrl') ? String(form.get('coverUrl')) : undefined,
          audioUrl: savedAudio.audioUrl,
          storageProvider: 'local',
          storageKey: savedAudio.filename,
          mimeType: savedAudio.mimeType,
          bitrateKbps: parseNumber(form.get('bitrateKbps')),
          explicit: parseBoolean(form.get('explicit')),
          isPublished: parseBoolean(form.get('isPublished')),
        },
        include: {
          artist: true,
          album: true,
          genres: { include: { genre: true } },
        },
      });

      await setTrackGenres(prisma, track.id, parseStringArray(form.get('genres')));

      if (track.albumId) {
        await prisma.album.update({
          where: { id: track.albumId },
          data: { trackCount: { increment: 1 } },
        });
      }

      return c.json(jsonSafe({ ...track, streamUrl: `/tracks/${track.id}/stream` }), 201);
    } catch (error) {
      if (savedAudio?.audioUrl) await removeLocalAudio(savedAudio.audioUrl).catch(() => null);
      return c.json({ message: errorMessage(error, 'Audio upload failed') }, errorStatus(error) as any);
    }
  });

  routes.patch('/:id/audio', async (c) => {
    const auth = requireArtistOrAdmin(c);
    if (auth.response) return auth.response;

    const track = await prisma.track.findUnique({ where: { id: c.req.param('id') } });
    if (!track) return c.json({ message: 'Track not found' }, 404);

    const form = await c.req.raw.formData();
    const audio = audioFileFromForm(form);
    if (!audio) return c.json({ message: 'Audio file is required. Use multipart field name "audio".' }, 400);

    let savedAudio;

    try {
      savedAudio = await saveAudioFile(audio);
      const updatedTrack = await prisma.track.update({
        where: { id: track.id },
        data: {
          audioUrl: savedAudio.audioUrl,
          storageProvider: 'local',
          storageKey: savedAudio.filename,
          mimeType: savedAudio.mimeType,
          bitrateKbps: parseNumber(form.get('bitrateKbps')),
        },
      });

      if (track.storageProvider === 'local') await removeLocalAudio(track.audioUrl).catch(() => null);

      return c.json(jsonSafe({ ...updatedTrack, streamUrl: `/tracks/${updatedTrack.id}/stream` }));
    } catch (error) {
      if (savedAudio?.audioUrl) await removeLocalAudio(savedAudio.audioUrl).catch(() => null);
      return c.json({ message: errorMessage(error, 'Audio replacement failed') }, errorStatus(error) as any);
    }
  });

  routes.get('/:id/stream', async (c) => {
    const track = await prisma.track.findUnique({ where: { id: c.req.param('id') } });

    if (!track || !track.isPublished) return c.json({ message: 'Track not found' }, 404);
    if (track.storageProvider !== 'local') return c.redirect(track.audioUrl);

    const audioPath = resolveLocalAudioPath(track.audioUrl);
    if (!audioPath || !fs.existsSync(audioPath)) return c.json({ message: 'Audio file not found' }, 404);

    return createRangeResponse(audioPath, track.mimeType, c.req.header('range'));
  });

  return routes;
}
