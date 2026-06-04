export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    displayName: String!
    email: String!
    avatarUrl: String
    role: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Artist {
    id: ID!
    ownerUserId: ID
    name: String!
    bio: String
    avatarUrl: String
    coverUrl: String
    verified: Boolean!
    followerCount: Int!
    genres: [Genre!]!
    createdAt: String!
    updatedAt: String!
  }

  type Genre {
    id: ID!
    name: String!
    slug: String!
  }

  type Album {
    id: ID!
    artistId: ID!
    artist: Artist!
    title: String!
    type: String!
    coverUrl: String
    releaseDate: String
    trackCount: Int!
    isPublished: Boolean!
    genres: [Genre!]!
    createdAt: String!
    updatedAt: String!
  }

  type Track {
    id: ID!
    artistId: ID!
    albumId: ID
    artist: Artist!
    album: Album
    title: String!
    durationMs: Int!
    trackNumber: Int
    coverUrl: String
    audioUrl: String!
    streamUrl: String!
    storageProvider: String!
    storageKey: String
    mimeType: String!
    bitrateKbps: Int
    explicit: Boolean!
    isPublished: Boolean!
    playCount: String!
    likeCount: String!
    genres: [Genre!]!
    createdAt: String!
    updatedAt: String!
  }

  type PlaylistTrack {
    id: ID!
    track: Track!
    position: Int!
    addedAt: String!
  }

  type Playlist {
    id: ID!
    ownerUserId: ID!
    owner: User!
    name: String!
    description: String
    coverUrl: String
    visibility: String!
    likeCount: String!
    tracks: [PlaylistTrack!]!
    createdAt: String!
    updatedAt: String!
  }

  type PlayHistory {
    id: ID!
    userId: ID
    track: Track!
    playedMs: Int!
    completed: Boolean!
    source: String!
    deviceId: String
    ipAddress: String
    createdAt: String!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    sessionId: ID!
    user: User!
  }

  type SearchResult {
    tracks: [Track!]!
    artists: [Artist!]!
    albums: [Album!]!
  }

  input RegisterInput {
    displayName: String!
    email: String!
    password: String!
    role: String
    avatarUrl: String
    deviceId: String
  }

  input LoginInput {
    email: String!
    password: String!
    deviceId: String
  }

  input ArtistInput {
    name: String!
    bio: String
    avatarUrl: String
    coverUrl: String
    genres: [String!]
  }

  input AlbumInput {
    artistId: ID!
    title: String!
    type: String
    coverUrl: String
    releaseDate: String
    genres: [String!]
    isPublished: Boolean
  }

  input TrackUrlInput {
    artistId: ID!
    albumId: ID
    title: String!
    durationMs: Int!
    trackNumber: Int
    coverUrl: String
    audioUrl: String!
    storageProvider: String
    storageKey: String
    mimeType: String
    bitrateKbps: Int
    explicit: Boolean
    isPublished: Boolean
    genres: [String!]
  }

  input PlaylistInput {
    name: String!
    description: String
    coverUrl: String
    visibility: String
  }

  input RecordPlayInput {
    trackId: ID!
    playedMs: Int
    completed: Boolean
    source: String
    deviceId: String
  }

  type Query {
    health: String!
    me: User
    artists(q: String, genre: String, limit: Int = 20, offset: Int = 0): [Artist!]!
    artist(id: ID!): Artist
    albums(artistId: ID, genre: String, limit: Int = 20, offset: Int = 0): [Album!]!
    album(id: ID!): Album
    tracks(artistId: ID, albumId: ID, genre: String, limit: Int = 20, offset: Int = 0): [Track!]!
    track(id: ID!): Track
    playlists(mine: Boolean = false, limit: Int = 20, offset: Int = 0): [Playlist!]!
    search(q: String!): SearchResult!
    playHistory(limit: Int = 50): [PlayHistory!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refresh(refreshToken: String!, deviceId: String): AuthPayload!
    logout(refreshToken: String): Boolean!
    createArtist(input: ArtistInput!): Artist!
    createAlbum(input: AlbumInput!): Album!
    createTrackUrl(input: TrackUrlInput!): Track!
    createPlaylist(input: PlaylistInput!): Playlist!
    addTrackToPlaylist(playlistId: ID!, trackId: ID!, position: Int): Playlist!
    likeTrack(trackId: ID!): Boolean!
    unlikeTrack(trackId: ID!): Boolean!
    followArtist(artistId: ID!): Boolean!
    unfollowArtist(artistId: ID!): Boolean!
    recordPlay(input: RecordPlayInput!): PlayHistory!
  }
`;
