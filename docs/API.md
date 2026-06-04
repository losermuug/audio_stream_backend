# Streaming App Backend API

Current stack: Hono + Prisma + PostgreSQL + GraphQL Yoga.

GraphQL endpoint:

```text
POST /graphql
GET /graphql
```

REST endpoints are kept only where HTTP streaming or binary upload is the better protocol fit.

## REST Endpoints

### Health

```http
GET /health
```

### Audio upload

```http
POST /tracks/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Required form fields:

- `audio`: audio file
- `title`
- `artistId`
- `durationMs`

Optional form fields:

- `albumId`
- `trackNumber`
- `coverUrl`
- `genres`: comma-separated list
- `bitrateKbps`
- `explicit`
- `isPublished`

### Replace track audio

```http
PATCH /tracks/:id/audio
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Required form field:

- `audio`

### Stream audio

```http
GET /tracks/:id/stream
Range: bytes=0-
```

Behavior:

- Local audio returns `200 OK` or `206 Partial Content`.
- External audio redirects to `tracks.audio_url`.
- Flutter audio players should use this endpoint as their playable URL.

## GraphQL Operations

### Auth

- `register(input)`
- `login(input)`
- `refresh(refreshToken, deviceId)`
- `logout(refreshToken)`
- `me`

### Catalog

- `artists(q, genre, limit, offset)`
- `artist(id)`
- `albums(artistId, genre, limit, offset)`
- `album(id)`
- `tracks(artistId, albumId, genre, limit, offset)`
- `track(id)`
- `search(q)`

### Library

- `playlists(mine, limit, offset)`
- `createPlaylist(input)`
- `addTrackToPlaylist(playlistId, trackId, position)`
- `likeTrack(trackId)`
- `unlikeTrack(trackId)`
- `followArtist(artistId)`
- `unfollowArtist(artistId)`
- `recordPlay(input)`
- `playHistory(limit)`

### Artist content management

- `createArtist(input)`
- `createAlbum(input)`
- `createTrackUrl(input)`

For setup and examples, see [HONO_PRISMA_GRAPHQL.md](./HONO_PRISMA_GRAPHQL.md).
