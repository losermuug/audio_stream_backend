const fs = require('fs');
const path = require('path');
const Album = require('../models/Album');
const PlayHistory = require('../models/PlayHistory');
const Track = require('../models/Track');
const { getPagination, pagedResponse } = require('../utils/pagination');

function buildTrackFilter(query) {
  const filter = {};

  if (query.artist) {
    filter.artist = query.artist;
  }

  if (query.album) {
    filter.album = query.album;
  }

  if (query.genre) {
    filter.genres = query.genre.toLowerCase();
  }

  if (query.published !== 'false') {
    filter.isPublished = true;
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return filter;
}

async function listTracks(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildTrackFilter(req.query);
  const sort = req.query.sort === 'new' ? { createdAt: -1 } : { playCount: -1, createdAt: -1 };

  const [tracks, total] = await Promise.all([
    Track.find(filter)
      .populate('artist', 'name avatarUrl verified')
      .populate('album', 'title coverUrl')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Track.countDocuments(filter),
  ]);

  res.json(pagedResponse(tracks, page, limit, total));
}

async function createTrack(req, res) {
  const track = await Track.create(req.body);

  if (track.album) {
    await Album.findByIdAndUpdate(track.album, { $inc: { trackCount: 1 } });
  }

  res.status(201).json(track);
}

async function getTrack(req, res) {
  const track = await Track.findById(req.params.id)
    .populate('artist', 'name avatarUrl verified')
    .populate('album', 'title coverUrl')
    .populate('featuringArtists', 'name avatarUrl verified');

  if (!track) {
    return res.status(404).json({ message: 'Track not found' });
  }

  res.json(track);
}

async function updateTrack(req, res) {
  const track = await Track.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!track) {
    return res.status(404).json({ message: 'Track not found' });
  }

  res.json(track);
}

async function streamTrack(req, res) {
  const track = await Track.findById(req.params.id);

  if (!track || !track.isPublished) {
    return res.status(404).json({ message: 'Track not found' });
  }

  if (track.storageProvider !== 'local') {
    return res.redirect(track.audioUrl);
  }

  const publicRoot = path.resolve(process.cwd(), 'public');
  const audioPath = path.resolve(publicRoot, track.audioUrl.replace(/^\/+/, ''));

  if (!audioPath.startsWith(publicRoot) || !fs.existsSync(audioPath)) {
    return res.status(404).json({ message: 'Audio file not found' });
  }

  const stat = fs.statSync(audioPath);
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': track.mimeType,
    });
    return fs.createReadStream(audioPath).pipe(res);
  }

  const [startRaw, endRaw] = range.replace('bytes=', '').split('-');
  const start = Number.parseInt(startRaw, 10);
  const end = endRaw ? Number.parseInt(endRaw, 10) : stat.size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
    return res.status(416).json({ message: 'Requested range not satisfiable' });
  }

  const chunkSize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': track.mimeType,
  });

  fs.createReadStream(audioPath, { start, end }).pipe(res);
}

async function recordPlay(req, res) {
  const track = await Track.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } }, { new: true });

  if (!track) {
    return res.status(404).json({ message: 'Track not found' });
  }

  await PlayHistory.create({
    user: req.user?.id,
    track: track.id,
    playedMs: req.body.playedMs,
    completed: req.body.completed,
    source: req.body.source,
    deviceId: req.body.deviceId,
    ipAddress: req.ip,
  });

  res.status(201).json({ trackId: track.id, playCount: track.playCount });
}

module.exports = {
  listTracks,
  createTrack,
  getTrack,
  updateTrack,
  streamTrack,
  recordPlay,
};
