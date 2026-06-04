-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('listener', 'artist', 'admin');

-- CreateEnum
CREATE TYPE "album_type" AS ENUM ('album', 'single', 'ep', 'compilation');

-- CreateEnum
CREATE TYPE "storage_provider" AS ENUM ('url', 'local', 's3', 'gcs', 'cloudinary');

-- CreateEnum
CREATE TYPE "playlist_visibility" AS ENUM ('private', 'public', 'unlisted');

-- CreateEnum
CREATE TYPE "play_source" AS ENUM ('album', 'playlist', 'search', 'radio', 'direct');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "display_name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'listener',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "device_id" VARCHAR(255),
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_socials" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "platform" VARCHAR(80) NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "artist_socials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_genres" (
    "artist_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "artist_genres_pkey" PRIMARY KEY ("artist_id","genre_id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" "album_type" NOT NULL DEFAULT 'album',
    "cover_url" TEXT,
    "release_date" DATE,
    "track_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_genres" (
    "album_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "album_genres_pkey" PRIMARY KEY ("album_id","genre_id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "album_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "track_number" INTEGER,
    "cover_url" TEXT,
    "audio_url" TEXT NOT NULL,
    "storage_provider" "storage_provider" NOT NULL DEFAULT 'url',
    "storage_key" TEXT,
    "mime_type" VARCHAR(100) NOT NULL DEFAULT 'audio/mpeg',
    "bitrate_kbps" INTEGER,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "play_count" BIGINT NOT NULL DEFAULT 0,
    "like_count" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_genres" (
    "track_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "track_genres_pkey" PRIMARY KEY ("track_id","genre_id")
);

-- CreateTable
CREATE TABLE "track_featured_artists" (
    "track_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,

    CONSTRAINT "track_featured_artists_pkey" PRIMARY KEY ("track_id","artist_id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "visibility" "playlist_visibility" NOT NULL DEFAULT 'private',
    "like_count" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" UUID NOT NULL,
    "playlist_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liked_tracks" (
    "user_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liked_tracks_pkey" PRIMARY KEY ("user_id","track_id")
);

-- CreateTable
CREATE TABLE "liked_albums" (
    "user_id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liked_albums_pkey" PRIMARY KEY ("user_id","album_id")
);

-- CreateTable
CREATE TABLE "liked_playlists" (
    "user_id" UUID NOT NULL,
    "playlist_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liked_playlists_pkey" PRIMARY KEY ("user_id","playlist_id")
);

-- CreateTable
CREATE TABLE "follows" (
    "user_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("user_id","artist_id")
);

-- CreateTable
CREATE TABLE "play_history" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "track_id" UUID NOT NULL,
    "played_ms" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "source" "play_source" NOT NULL DEFAULT 'direct',
    "device_id" VARCHAR(255),
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "play_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "artists_name_idx" ON "artists"("name");

-- CreateIndex
CREATE INDEX "artists_owner_user_id_idx" ON "artists"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_socials_artist_id_platform_key" ON "artist_socials"("artist_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE INDEX "albums_artist_id_idx" ON "albums"("artist_id");

-- CreateIndex
CREATE INDEX "albums_is_published_idx" ON "albums"("is_published");

-- CreateIndex
CREATE INDEX "tracks_artist_id_idx" ON "tracks"("artist_id");

-- CreateIndex
CREATE INDEX "tracks_album_id_idx" ON "tracks"("album_id");

-- CreateIndex
CREATE INDEX "tracks_is_published_play_count_idx" ON "tracks"("is_published", "play_count");

-- CreateIndex
CREATE INDEX "playlists_owner_user_id_idx" ON "playlists"("owner_user_id");

-- CreateIndex
CREATE INDEX "playlists_visibility_idx" ON "playlists"("visibility");

-- CreateIndex
CREATE INDEX "playlist_tracks_track_id_idx" ON "playlist_tracks"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_playlist_id_position_key" ON "playlist_tracks"("playlist_id", "position");

-- CreateIndex
CREATE INDEX "play_history_user_id_created_at_idx" ON "play_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "play_history_track_id_created_at_idx" ON "play_history"("track_id", "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_socials" ADD CONSTRAINT "artist_socials_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_genres" ADD CONSTRAINT "artist_genres_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_genres" ADD CONSTRAINT "artist_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_genres" ADD CONSTRAINT "album_genres_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_genres" ADD CONSTRAINT "album_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_featured_artists" ADD CONSTRAINT "track_featured_artists_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_featured_artists" ADD CONSTRAINT "track_featured_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_tracks" ADD CONSTRAINT "liked_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_tracks" ADD CONSTRAINT "liked_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_albums" ADD CONSTRAINT "liked_albums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_albums" ADD CONSTRAINT "liked_albums_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_playlists" ADD CONSTRAINT "liked_playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_playlists" ADD CONSTRAINT "liked_playlists_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
