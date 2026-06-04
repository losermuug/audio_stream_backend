import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export const audioUploadDir = path.resolve(process.cwd(), 'public', 'audio');

const maxAudioUploadMb = Number.parseInt(process.env.MAX_AUDIO_UPLOAD_MB || '100', 10);
const allowedAudioMimeTypes = new Set([
  'audio/aac',
  'audio/flac',
  'audio/m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
  'audio/x-wav',
]);
const allowedExtensions = new Set(['.aac', '.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.oga', '.ogg', '.wav', '.webm']);

type HttpError = Error & { status?: number };

export function assertAudioFile(file: File): void {
  const extension = path.extname(file.name || '').toLowerCase();

  if (!allowedAudioMimeTypes.has(file.type) || !allowedExtensions.has(extension)) {
    const error: HttpError = new Error('Only audio files are allowed');
    error.status = 415;
    throw error;
  }

  if (file.size > maxAudioUploadMb * 1024 * 1024) {
    const error: HttpError = new Error('Audio file is too large');
    error.status = 413;
    throw error;
  }
}

function sanitizeFilename(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  const baseName =
    path
      .basename(filename, extension)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'audio';

  return `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
}

export async function saveAudioFile(file: File): Promise<{ filename: string; audioUrl: string; mimeType: string; path: string }> {
  assertAudioFile(file);
  fs.mkdirSync(audioUploadDir, { recursive: true });

  const filename = sanitizeFilename(file.name);
  const destination = path.resolve(audioUploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.promises.writeFile(destination, bytes);

  return {
    filename,
    audioUrl: `/audio/${filename}`,
    mimeType: file.type || 'audio/mpeg',
    path: destination,
  };
}

export async function removeLocalAudio(audioUrl: string): Promise<void> {
  const filePath = resolveLocalAudioPath(audioUrl);

  if (filePath && fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}

export function resolveLocalAudioPath(audioUrl: string): string | null {
  const publicRoot = path.resolve(process.cwd(), 'public');
  const audioPath = path.resolve(publicRoot, String(audioUrl || '').replace(/^\/+/, ''));

  return audioPath.startsWith(audioUploadDir) ? audioPath : null;
}

function streamBody(filePath: string, options?: { start: number; end: number }): BodyInit {
  return Readable.toWeb(fs.createReadStream(filePath, options)) as unknown as BodyInit;
}

export function createRangeResponse(filePath: string, mimeType: string, rangeHeader?: string): Response {
  const stat = fs.statSync(filePath);

  if (!rangeHeader) {
    return new Response(streamBody(filePath), {
      status: 200,
      headers: {
        'Content-Length': String(stat.size),
        'Content-Type': mimeType,
      },
    });
  }

  const [startRaw, endRaw] = rangeHeader.replace('bytes=', '').split('-');
  const start = Number.parseInt(startRaw, 10);
  const end = endRaw ? Number.parseInt(endRaw, 10) : stat.size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
    return Response.json({ message: 'Requested range not satisfiable' }, { status: 416 });
  }

  return new Response(streamBody(filePath, { start, end }), {
    status: 206,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Type': mimeType,
    },
  });
}
