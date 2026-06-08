import { hashPassword, verifyPassword } from '../../modules/auth/password.service.js';
import {
  issueTokens,
  normalizeRole,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../../modules/auth/auth.service.js';
import { setAlbumGenres, setArtistGenres, setTrackGenres, genreFilter } from '../../modules/genre/genre.service.js';
import { includeTrack } from './includes.js';
import { requireRole, requireUser } from './guards.js';
import { dateToString, mapAlbum, mapArtist, mapPlayHistory, mapPlaylist, mapTrack, mapUser } from './mappers.js';

export const resolvers: Record<string, any> = {
  Artist: {
    genres: (artist) => artist.genres?.map((item) => item.genre) || [],
  },
  Album: {
    genres: (album) => album.genres?.map((item) => item.genre) || [],
  },
  Track: {
    genres: (track) => track.genres?.map((item) => item.genre) || [],
  },
  Playlist: {
    owner: (playlist) => mapUser(playlist.owner),
    tracks: (playlist) =>
      (playlist.tracks || []).map((item) => ({
        ...item,
        track: mapTrack(item.track),
        addedAt: dateToString(item.addedAt),
      })),
  },
  PlayHistory: {
    track: (item) => mapTrack(item.track),
  },
  Query: {
    health: () => 'ok',
    me: async (_root, _args, context) => {
      if (!context.user) return null;

      return mapUser(await context.prisma.user.findUnique({ where: { id: context.user.id } }));
    },
    artists: async (_root, args, context) => {
      const rows = await context.prisma.artist.findMany({
        where: {
          name: args.q ? { contains: args.q, mode: 'insensitive' } : undefined,
          genres: genreFilter(args.genre),
        },
        include: { genres: { include: { genre: true } } },
        orderBy: [{ verified: 'desc' }, { followerCount: 'desc' }, { name: 'asc' }],
        take: args.limit,
        skip: args.offset,
      });

      return rows.map(mapArtist);
    },
    artist: async (_root, args, context) =>
      mapArtist(
        await context.prisma.artist.findUnique({
          where: { id: args.id },
          include: { genres: { include: { genre: true } } },
        })
      ),
    albums: async (_root, args, context) => {
      const rows = await context.prisma.album.findMany({
        where: {
          artistId: args.artistId || undefined,
          genres: genreFilter(args.genre),
          isPublished: true,
        },
        include: { artist: true, genres: { include: { genre: true } } },
        orderBy: [{ releaseDate: 'desc' }, { createdAt: 'desc' }],
        take: args.limit,
        skip: args.offset,
      });

      return rows.map(mapAlbum);
    },
    album: async (_root, args, context) =>
      mapAlbum(
        await context.prisma.album.findUnique({
          where: { id: args.id },
          include: { artist: true, genres: { include: { genre: true } } },
        })
      ),
    tracks: async (_root, args, context) => {
      const rows = await context.prisma.track.findMany({
        where: {
          artistId: args.artistId || undefined,
          albumId: args.albumId || undefined,
          genres: genreFilter(args.genre),
          isPublished: true,
        },
        include: includeTrack(),
        orderBy: [{ playCount: 'desc' }, { createdAt: 'desc' }],
        take: args.limit,
        skip: args.offset,
      });

      return rows.map(mapTrack);
    },
    track: async (_root, args, context) =>
      mapTrack(await context.prisma.track.findUnique({ where: { id: args.id }, include: includeTrack() })),
    playlists: async (_root, args, context) => {
      const where = args.mine ? { ownerUserId: requireUser(context).id } : { visibility: 'public' };
      const rows = await context.prisma.playlist.findMany({
        where,
        include: {
          owner: true,
          tracks: { include: { track: { include: includeTrack() } }, orderBy: { position: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
        take: args.limit,
        skip: args.offset,
      });

      return rows.map(mapPlaylist);
    },
    search: async (_root, args, context) => {
      const [tracks, artists, albums] = await Promise.all([
        context.prisma.track.findMany({
          where: { title: { contains: args.q, mode: 'insensitive' }, isPublished: true },
          include: includeTrack(),
          take: 10,
        }),
        context.prisma.artist.findMany({
          where: { name: { contains: args.q, mode: 'insensitive' } },
          include: { genres: { include: { genre: true } } },
          take: 10,
        }),
        context.prisma.album.findMany({
          where: { title: { contains: args.q, mode: 'insensitive' }, isPublished: true },
          include: { artist: true, genres: { include: { genre: true } } },
          take: 10,
        }),
      ]);

      return {
        tracks: tracks.map(mapTrack),
        artists: artists.map(mapArtist),
        albums: albums.map(mapAlbum),
      };
    },
    playHistory: async (_root, args, context) => {
      const user = requireUser(context);
      const rows = await context.prisma.playHistory.findMany({
        where: { userId: user.id },
        include: { track: { include: includeTrack() } },
        orderBy: { createdAt: 'desc' },
        take: args.limit,
      });

      return rows.map(mapPlayHistory);
    },
  },
  Mutation: {
    register: async (_root, args, context) => {
      const { input } = args;

      if (input.password.length < 8) throw new Error('Password must be at least 8 characters');

      const user = await context.prisma.user.create({
        data: {
          userName: input.userName,
          email: input.email.toLowerCase().trim(),
          passwordHash: hashPassword(input.password),
          avatarUrl: input.avatarUrl,
          role: normalizeRole(input.role),
        },
      });

      return issueTokens(context.prisma, user, { ...context.meta, deviceId: input.deviceId });
    },
    login: async (_root, args, context) => {
      const user = await context.prisma.user.findFirst({
        where: { email: args.input.email.toLowerCase().trim(), isActive: true },
      });

      if (!user || !verifyPassword(args.input.password, user.passwordHash)) {
        throw new Error('Invalid email or password');
      }

      return issueTokens(context.prisma, user, { ...context.meta, deviceId: args.input.deviceId });
    },
    refresh: async (_root, args, context) =>
      rotateRefreshToken(context.prisma, args.refreshToken, {
        ...context.meta,
        deviceId: args.deviceId,
      }),
    logout: async (_root, args, context) => revokeRefreshToken(context.prisma, args.refreshToken),
    createArtist: async (_root, args, context) => {
      const user = requireRole(context, ['artist', 'admin']);
      const artist = await context.prisma.artist.create({
        data: {
          ownerUserId: user.id,
          name: args.input.name,
          bio: args.input.bio,
          avatarUrl: args.input.avatarUrl,
          coverUrl: args.input.coverUrl,
        },
      });
      await setArtistGenres(context.prisma, artist.id, args.input.genres);

      return mapArtist(
        await context.prisma.artist.findUnique({
          where: { id: artist.id },
          include: { genres: { include: { genre: true } } },
        })
      );
    },
    createAlbum: async (_root, args, context) => {
      requireRole(context, ['artist', 'admin']);
      const album = await context.prisma.album.create({
        data: {
          artistId: args.input.artistId,
          title: args.input.title,
          type: args.input.type || 'album',
          coverUrl: args.input.coverUrl,
          releaseDate: args.input.releaseDate ? new Date(args.input.releaseDate) : undefined,
          isPublished: args.input.isPublished ?? false,
        },
      });
      await setAlbumGenres(context.prisma, album.id, args.input.genres);

      return mapAlbum(
        await context.prisma.album.findUnique({
          where: { id: album.id },
          include: { artist: true, genres: { include: { genre: true } } },
        })
      );
    },
    createTrackUrl: async (_root, args, context) => {
      requireRole(context, ['artist', 'admin']);
      const track = await context.prisma.track.create({
        data: {
          artistId: args.input.artistId,
          albumId: args.input.albumId,
          title: args.input.title,
          durationMs: args.input.durationMs,
          trackNumber: args.input.trackNumber,
          coverUrl: args.input.coverUrl,
          audioUrl: args.input.audioUrl,
          storageProvider: args.input.storageProvider || 'url',
          storageKey: args.input.storageKey,
          mimeType: args.input.mimeType || 'audio/mpeg',
          bitrateKbps: args.input.bitrateKbps,
          explicit: args.input.explicit ?? false,
          isPublished: args.input.isPublished ?? false,
        },
      });
      await setTrackGenres(context.prisma, track.id, args.input.genres);

      if (track.albumId) {
        await context.prisma.album.update({
          where: { id: track.albumId },
          data: { trackCount: { increment: 1 } },
        });
      }

      return mapTrack(await context.prisma.track.findUnique({ where: { id: track.id }, include: includeTrack() }));
    },
    createPlaylist: async (_root, args, context) => {
      const user = requireUser(context);
      return mapPlaylist(
        await context.prisma.playlist.create({
          data: {
            ownerUserId: user.id,
            name: args.input.name,
            description: args.input.description,
            coverUrl: args.input.coverUrl,
            visibility: args.input.visibility || 'private',
          },
          include: { owner: true, tracks: true },
        })
      );
    },
    addTrackToPlaylist: async (_root, args, context) => {
      const user = requireUser(context);
      const playlist = await context.prisma.playlist.findFirst({
        where: { id: args.playlistId, ownerUserId: user.id },
        include: { tracks: true },
      });

      if (!playlist) throw new Error('Playlist not found');

      await context.prisma.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          trackId: args.trackId,
          position: args.position ?? playlist.tracks.length,
        },
      });

      return mapPlaylist(
        await context.prisma.playlist.findUnique({
          where: { id: playlist.id },
          include: {
            owner: true,
            tracks: { include: { track: { include: includeTrack() } }, orderBy: { position: 'asc' } },
          },
        })
      );
    },
    likeTrack: async (_root, args, context) => {
      const user = requireUser(context);
      const existing = await context.prisma.likedTrack.findUnique({
        where: { userId_trackId: { userId: user.id, trackId: args.trackId } },
      });

      if (!existing) {
        await context.prisma.likedTrack.create({ data: { userId: user.id, trackId: args.trackId } });
        await context.prisma.track.update({ where: { id: args.trackId }, data: { likeCount: { increment: 1 } } });
      }

      return true;
    },
    unlikeTrack: async (_root, args, context) => {
      const user = requireUser(context);
      const existing = await context.prisma.likedTrack.findUnique({
        where: { userId_trackId: { userId: user.id, trackId: args.trackId } },
      });

      if (existing) {
        await context.prisma.likedTrack.delete({
          where: { userId_trackId: { userId: user.id, trackId: args.trackId } },
        });
        await context.prisma.track.update({ where: { id: args.trackId }, data: { likeCount: { decrement: 1 } } });
      }

      return true;
    },
    followArtist: async (_root, args, context) => {
      const user = requireUser(context);
      const existing = await context.prisma.follow.findUnique({
        where: { userId_artistId: { userId: user.id, artistId: args.artistId } },
      });

      if (!existing) {
        await context.prisma.follow.create({ data: { userId: user.id, artistId: args.artistId } });
        await context.prisma.artist.update({ where: { id: args.artistId }, data: { followerCount: { increment: 1 } } });
      }

      return true;
    },
    unfollowArtist: async (_root, args, context) => {
      const user = requireUser(context);
      const existing = await context.prisma.follow.findUnique({
        where: { userId_artistId: { userId: user.id, artistId: args.artistId } },
      });

      if (existing) {
        await context.prisma.follow.delete({
          where: { userId_artistId: { userId: user.id, artistId: args.artistId } },
        });
        await context.prisma.artist.update({ where: { id: args.artistId }, data: { followerCount: { decrement: 1 } } });
      }

      return true;
    },
    recordPlay: async (_root, args, context) => {
      const userId = context.user?.id;
      await context.prisma.track.update({
        where: { id: args.input.trackId },
        data: { playCount: { increment: 1 } },
      });

      return mapPlayHistory(
        await context.prisma.playHistory.create({
          data: {
            userId,
            trackId: args.input.trackId,
            playedMs: args.input.playedMs ?? 0,
            completed: args.input.completed ?? false,
            source: args.input.source || 'direct',
            deviceId: args.input.deviceId,
            ipAddress: context.meta.ipAddress,
          },
          include: { track: { include: includeTrack() } },
        })
      );
    },
  },
};
