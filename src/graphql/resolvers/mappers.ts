type AnyRecord = Record<string, any>;

export function dateToString(value: Date | string | null | undefined): string | null {
  if (typeof value === 'string') return value;
  return value ? value.toISOString() : null;
}

export function mapUser(user: AnyRecord | null | undefined): AnyRecord | null {
  if (!user) return null;

  return {
    ...user,
    createdAt: dateToString(user.createdAt),
    updatedAt: dateToString(user.updatedAt),
  };
}

export function mapArtist(artist: AnyRecord | null | undefined): AnyRecord | null {
  if (!artist) return null;

  return {
    ...artist,
    createdAt: dateToString(artist.createdAt),
    updatedAt: dateToString(artist.updatedAt),
  };
}

export function mapAlbum(album: AnyRecord | null | undefined): AnyRecord | null {
  if (!album) return null;

  return {
    ...album,
    releaseDate: album.releaseDate ? album.releaseDate.toISOString().slice(0, 10) : null,
    createdAt: dateToString(album.createdAt),
    updatedAt: dateToString(album.updatedAt),
  };
}

export function mapTrack(track: AnyRecord | null | undefined): AnyRecord | null {
  if (!track) return null;

  return {
    ...track,
    streamUrl: `/tracks/${track.id}/stream`,
    storageProvider: track.storageProvider,
    playCount: String(track.playCount ?? 0),
    likeCount: String(track.likeCount ?? 0),
    createdAt: dateToString(track.createdAt),
    updatedAt: dateToString(track.updatedAt),
  };
}

export function mapPlaylist(playlist: AnyRecord | null | undefined): AnyRecord | null {
  if (!playlist) return null;

  return {
    ...playlist,
    likeCount: String(playlist.likeCount ?? 0),
    createdAt: dateToString(playlist.createdAt),
    updatedAt: dateToString(playlist.updatedAt),
  };
}

export function mapPlayHistory(item: AnyRecord | null | undefined): AnyRecord | null {
  if (!item) return null;

  return {
    ...item,
    createdAt: dateToString(item.createdAt),
  };
}
