const Album = require('../models/Album');
const Track = require('../models/Track');
const { getPagination, pagedResponse } = require('../utils/pagination');

async function listAlbums(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.artist) {
    filter.artist = req.query.artist;
  }

  if (req.query.genre) {
    filter.genres = req.query.genre.toLowerCase();
  }

  if (req.query.published !== 'false') {
    filter.isPublished = true;
  }

  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  const [albums, total] = await Promise.all([
    Album.find(filter).populate('artist', 'name avatarUrl verified').sort({ releaseDate: -1 }).skip(skip).limit(limit),
    Album.countDocuments(filter),
  ]);

  res.json(pagedResponse(albums, page, limit, total));
}

async function createAlbum(req, res) {
  const album = await Album.create(req.body);
  res.status(201).json(album);
}

async function getAlbum(req, res) {
  const album = await Album.findById(req.params.id).populate('artist', 'name avatarUrl verified');

  if (!album) {
    return res.status(404).json({ message: 'Album not found' });
  }

  res.json(album);
}

async function getAlbumTracks(req, res) {
  const tracks = await Track.find({ album: req.params.id, isPublished: true })
    .populate('artist', 'name avatarUrl verified')
    .sort({ trackNumber: 1, createdAt: 1 });

  res.json({ data: tracks });
}

module.exports = {
  listAlbums,
  createAlbum,
  getAlbum,
  getAlbumTracks,
};
