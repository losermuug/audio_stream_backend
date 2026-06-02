# Audio Streaming Backend API

Base URL: `/api`

MongoDB Atlas stores app metadata and user activity. Do not store large audio files directly in MongoDB for production. Store audio in S3, GCS, Cloudinary, or another object storage service, then save the playable URL or object key in `tracks.audioUrl` / `tracks.storageKey`.

Authenticated endpoints use `Authorization: Bearer <accessToken>`. Flutter should store `accessToken` and `refreshToken` in secure storage, not in regular shared preferences.

## Core Models

### User

- `displayName`
- `email`
- `passwordHash`
- `avatarUrl`
- `role`: `listener | artist | admin`
- `isActive`

### Artist

- `name`
- `bio`
- `avatarUrl`
- `coverUrl`
- `genres`
- `socials`
- `verified`
- `ownerUser`
- `followerCount`

### Album

- `title`
- `artist`
- `type`: `album | single | ep | compilation`
- `coverUrl`
- `releaseDate`
- `genres`
- `trackCount`
- `isPublished`

### Track

- `title`
- `artist`
- `album`
- `featuringArtists`
- `genres`
- `durationSec`
- `trackNumber`
- `coverUrl`
- `audioUrl`
- `storageProvider`: `url | local | s3 | gcs | cloudinary`
- `storageKey`
- `mimeType`
- `bitrateKbps`
- `explicit`
- `isPublished`
- `playCount`
- `likeCount`

### Playlist

- `name`
- `description`
- `owner`
- `coverUrl`
- `visibility`: `private | public | unlisted`
- `tracks[]`: `{ track, addedAt, position }`
- `likeCount`

### Session, Like, Follow, PlayHistory

- `Session`: refresh token hash, device metadata, expiry, revocation state
- `Like`: user liked `track | album | playlist`
- `Follow`: user followed artist
- `PlayHistory`: user/device play events for analytics and recents

## API Gateway Map

### Health

- `GET /health`

### Auth

- `POST /auth/register`, body `{ "displayName": "...", "email": "...", "password": "...", "role": "listener|artist" }`
- `POST /auth/login`, body `{ "email": "...", "password": "...", "deviceId": "optional-device-id" }`
- `POST /auth/refresh`, body `{ "refreshToken": "...", "deviceId": "optional-device-id" }`
- `POST /auth/logout`, body `{ "refreshToken": "..." }`

Auth responses return `accessToken`, `refreshToken`, `sessionId`, and `user`.

### Users

- `GET /users/me` with bearer access token

### Artists

- `GET /artists?q=&genre=&page=&limit=`
- `POST /artists` with artist/admin bearer access token
- `GET /artists/:id`
- `GET /artists/:id/albums`
- `GET /artists/:id/tracks`

### Albums

- `GET /albums?q=&artist=&genre=&page=&limit=`
- `POST /albums` with artist/admin bearer access token
- `GET /albums/:id`
- `GET /albums/:id/tracks`

### Tracks

- `GET /tracks?q=&artist=&album=&genre=&sort=popular|new&page=&limit=`
- `POST /tracks` with artist/admin bearer access token
- `GET /tracks/:id`
- `PATCH /tracks/:id` with artist/admin bearer access token
- `GET /tracks/:id/stream`
- `POST /tracks/:id/play`

### Playlists

- `GET /playlists?q=&mine=true&page=&limit=`
- `POST /playlists` with bearer access token
- `GET /playlists/:id`
- `PATCH /playlists/:id` with bearer access token
- `POST /playlists/:id/tracks` with bearer access token, body `{ "trackId": "..." }`
- `DELETE /playlists/:id/tracks/:trackId` with bearer access token

### Library

- `GET /library/likes?targetType=track` with bearer access token
- `POST /library/likes` with bearer access token, body `{ "targetType": "track", "targetId": "..." }`
- `DELETE /library/likes/:targetType/:targetId` with bearer access token
- `GET /library/history` with bearer access token
- `GET /library/artists` with bearer access token
- `POST /library/artists` with bearer access token, body `{ "artistId": "..." }`
- `DELETE /library/artists/:artistId` with bearer access token

### Search

- `GET /search?q=`
