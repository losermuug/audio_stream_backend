# Hono + Prisma + GraphQL Yoga Backend

Энэ хувилбар нь PostgreSQL schema дээр ажиллах шинэ backend stack юм.

## Stack

- Hono: HTTP server/router
- Prisma 7: PostgreSQL ORM
- GraphQL Yoga: GraphQL endpoint
- PostgreSQL: relational database
- REST route: audio upload болон Range streaming

## Environment

```env
PORT=5050
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/streaming_app?schema=public
JWT_ACCESS_SECRET=replace_with_a_long_random_access_secret
JWT_REFRESH_SECRET=replace_with_a_long_random_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
MAX_AUDIO_UPLOAD_MB=100
```

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Source Structure

```text
src/
  app.ts
  server.ts
  prisma/
    client.ts
  graphql/
    schema.ts
    typeDefs.ts
    context.ts
    resolvers/
      index.ts
      guards.ts
      includes.ts
      mappers.ts
  modules/
    auth/
      auth.service.ts
      password.service.ts
      token.service.ts
    audio/
      audio.routes.ts
      audio.service.ts
    genre/
      genre.service.ts
```

`server.ts` only starts the HTTP server. `app.ts` wires Hono, GraphQL Yoga, and REST audio routes. Domain logic lives under `modules/`.

Health:

```bash
curl http://localhost:5050/health
```

GraphQL:

```text
http://localhost:5050/graphql
```

## GraphQL Auth Example

```graphql
mutation Register {
  register(input: {
    displayName: "Muugii"
    email: "muugii@example.com"
    password: "testpass123"
    role: "artist"
  }) {
    accessToken
    refreshToken
    user {
      id
      role
    }
  }
}
```

Protected GraphQL request header:

```http
Authorization: Bearer <accessToken>
```

## GraphQL Catalog Example

```graphql
query Tracks {
  tracks(limit: 20) {
    id
    title
    durationMs
    streamUrl
    artist {
      name
    }
  }
}
```

## Create Track From External URL

Use GraphQL when audio already exists in S3, Cloudinary, GCS, or another URL.

```graphql
mutation CreateTrackUrl {
  createTrackUrl(input: {
    artistId: "<artistId>"
    title: "First Song"
    durationMs: 180000
    audioUrl: "https://example.com/song.mp3"
    storageProvider: "url"
    mimeType: "audio/mpeg"
    isPublished: true
    genres: ["pop", "rnb"]
  }) {
    id
    streamUrl
  }
}
```

## Audio Upload REST Route

Audio upload is intentionally REST, not GraphQL. Multipart binary upload is simpler and more reliable through Hono route.

```bash
curl -X POST http://localhost:5050/tracks/upload \
  -H "Authorization: Bearer <accessToken>" \
  -F "audio=@/path/to/song.mp3;type=audio/mpeg" \
  -F "title=First Song" \
  -F "artistId=<artistId>" \
  -F "durationMs=180000" \
  -F "genres=pop,rnb" \
  -F "isPublished=true"
```

Response includes:

```json
{
  "id": "...",
  "audioUrl": "/audio/song-...",
  "storageProvider": "local",
  "streamUrl": "/tracks/<trackId>/stream"
}
```

## Replace Audio REST Route

```bash
curl -X PATCH http://localhost:5050/tracks/<trackId>/audio \
  -H "Authorization: Bearer <accessToken>" \
  -F "audio=@/path/to/new-song.mp3;type=audio/mpeg"
```

## Audio Streaming REST Route

```http
GET /tracks/:id/stream
Range: bytes=0-
```

Behavior:

- `storageProvider = local`: backend reads from `public/audio` and returns `206 Partial Content` for Range requests.
- `storageProvider != local`: backend redirects to `audioUrl`.
- Flutter audio players such as `just_audio` can use this URL directly.

Flutter URL examples:

- Android emulator: `http://10.0.2.2:5050/tracks/<trackId>/stream`
- iOS simulator: `http://localhost:5050/tracks/<trackId>/stream`
- Physical phone: `http://<LAN-IP>:5050/tracks/<trackId>/stream`
