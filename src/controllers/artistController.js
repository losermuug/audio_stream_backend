const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Track = require('../models/Track');
const { getPagination, pagedResponse } = require('../utils/pagination');

async function listArtists(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  if (req.query.genre) {
    filter.genres = req.query.genre.toLowerCase();
  }

  const [artists, total] = await Promise.all([
    Artist.find(filter).sort({ verified: -1, followerCount: -1, name: 1 }).skip(skip).limit(limit),
    Artist.countDocuments(filter),
  ]);

  res.json(pagedResponse(artists, page, limit, total));
}

async function createArtist(req, res) {
  const artist = await Artist.create(req.body);
  res.status(201).json(artist);
}

async function getArtist(req, res) {
  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    return res.status(404).json({ message: 'Artist not found' });
  }

  res.json(artist);
}

async function getArtistAlbums(req, res) {
  const albums = await Album.find({ artist: req.params.id, isPublished: true }).sort({ releaseDate: -1 });
  res.json({ data: albums });
}

async function getArtistTracks(req, res) {
  const tracks = await Track.find({ artist: req.params.id, isPublished: true })
    .populate('artist', 'name avatarUrl verified')
    .populate('album', 'title coverUrl')
    .sort({ playCount: -1 })
    .limit(50);

  res.json({ data: tracks });
}

module.exports = {
  listArtists,
  createArtist,
  getArtist,
  getArtistAlbums,
  getArtistTracks,
};
