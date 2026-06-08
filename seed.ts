import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './src/prisma/client.js';

async function main() {
  console.log("Starting database seed...");

  // 1. Create dummy audio file
  const publicAudioDir = path.resolve(process.cwd(), 'public', 'audio');
  fs.mkdirSync(publicAudioDir, { recursive: true });

  const dummyFilePath = path.resolve(publicAudioDir, 'test-track.mp3');
  // Write a 1MB dummy file (zeros) to simulate an audio file
  const dummyFileSize = 1 * 1024 * 1024; // 1MB
  const buffer = Buffer.alloc(dummyFileSize);
  fs.writeFileSync(dummyFilePath, buffer);
  console.log(`Created dummy audio file at: ${dummyFilePath} (${dummyFileSize} bytes)`);

  // 2. Find or create dummy artist
  let artist = await prisma.artist.findFirst();
  if (!artist) {
    artist = await prisma.artist.create({
      data: {
        name: "Test Artist",
        bio: "This is a seed test artist",
      },
    });
    console.log(`Created dummy artist: ${artist.name} (${artist.id})`);
  } else {
    console.log(`Using existing artist: ${artist.name} (${artist.id})`);
  }

  // 3. Create dummy published track
  const track = await prisma.track.create({
    data: {
      artistId: artist.id,
      title: "Test Seed Track",
      durationMs: 180000,
      audioUrl: "/audio/test-track.mp3",
      storageProvider: "local",
      storageKey: "test-track.mp3",
      mimeType: "audio/mpeg",
      isPublished: true,
    },
  });

  console.log("\nSuccessfully seeded track!");
  console.log(`Track ID: ${track.id}`);
  console.log(`Track Title: ${track.title}`);
  console.log(`Audio File: ${track.audioUrl}`);
  console.log("\n--- COPY AND RUN THE FOLLOWING COMMAND TO TEST STREAMING ---");
  console.log(`curl -i -H "Range: bytes=0-499999" "http://localhost:${process.env.PORT || '8080'}/tracks/${track.id}/stream"`);
  console.log("------------------------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
