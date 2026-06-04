import type { PrismaClient } from '@prisma/client';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function upsertGenres(prisma: PrismaClient, names: string[] = []) {
  const uniqueNames = [...new Set(names.map((name) => String(name).trim()).filter(Boolean))];

  return Promise.all(
    uniqueNames.map((name) =>
      prisma.genre.upsert({
        where: { slug: slugify(name) },
        update: { name },
        create: { name, slug: slugify(name) },
      })
    )
  );
}

export async function setArtistGenres(prisma: PrismaClient, artistId: string, genres: string[] = []) {
  const records = await upsertGenres(prisma, genres);
  if (!records.length) return;

  await prisma.artistGenre.createMany({
    data: records.map((genre) => ({ artistId, genreId: genre.id })),
    skipDuplicates: true,
  });
}

export async function setAlbumGenres(prisma: PrismaClient, albumId: string, genres: string[] = []) {
  const records = await upsertGenres(prisma, genres);
  if (!records.length) return;

  await prisma.albumGenre.createMany({
    data: records.map((genre) => ({ albumId, genreId: genre.id })),
    skipDuplicates: true,
  });
}

export async function setTrackGenres(prisma: PrismaClient, trackId: string, genres: string[] = []) {
  const records = await upsertGenres(prisma, genres);
  if (!records.length) return;

  await prisma.trackGenre.createMany({
    data: records.map((genre) => ({ trackId, genreId: genre.id })),
    skipDuplicates: true,
  });
}

export function genreFilter(genre?: string | null) {
  if (!genre) return undefined;

  return {
    some: {
      genre: {
        slug: slugify(genre),
      },
    },
  };
}
