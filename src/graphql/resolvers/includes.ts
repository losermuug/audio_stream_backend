export function includeTrack() {
  return {
    artist: true,
    album: { include: { artist: true, genres: { include: { genre: true } } } },
    genres: { include: { genre: true } },
  };
}
