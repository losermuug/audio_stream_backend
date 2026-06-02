const Playlist = require('../models/Playlist');
const { getPagination, pagedResponse } = require('../utils/pagination');

async function listPlaylists(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.mine === 'true' && req.user ? { owner: req.user.id } : { visibility: 'public' };

  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  const [playlists, total] = await Promise.all([
    Playlist.find(filter)
      .populate('owner', 'displayName avatarUrl')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Playlist.countDocuments(filter),
  ]);

  res.json(pagedResponse(playlists, page, limit, total));
}

async function createPlaylist(req, res) {
  const playlist = await Playlist.create({
    ...req.body,
    owner: req.user.id,
  });

  res.status(201).json(playlist);
}

async function getPlaylist(req, res) {
  const playlist = await Playlist.findById(req.params.id)
    .populate('owner', 'displayName avatarUrl')
    .populate({
      path: 'tracks.track',
      populate: [
        { path: 'artist', select: 'name avatarUrl verified' },
        { path: 'album', select: 'title coverUrl' },
      ],
    });

  if (!playlist) {
    return res.status(404).json({ message: 'Playlist not found' });
  }

  const isOwner = req.user?.id === playlist.owner.id;
  if (playlist.visibility === 'private' && !isOwner) {
    return res.status(404).json({ message: 'Playlist not found' });
  }

  res.json(playlist);
}

async function updatePlaylist(req, res) {
  const playlist = await Playlist.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!playlist) {
    return res.status(404).json({ message: 'Playlist not found' });
  }

  res.json(playlist);
}

async function addTrackToPlaylist(req, res) {
  const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user.id });

  if (!playlist) {
    return res.status(404).json({ message: 'Playlist not found' });
  }

  playlist.tracks.push({
    track: req.body.trackId,
    position: playlist.tracks.length,
  });

  await playlist.save();
  res.status(201).json(playlist);
}

async function removeTrackFromPlaylist(req, res) {
  const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user.id });

  if (!playlist) {
    return res.status(404).json({ message: 'Playlist not found' });
  }

  playlist.tracks = playlist.tracks.filter((item) => item.track.toString() !== req.params.trackId);
  playlist.tracks.forEach((item, index) => {
    item.position = index;
  });

  await playlist.save();
  res.json(playlist);
}

module.exports = {
  listPlaylists,
  createPlaylist,
  getPlaylist,
  updatePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
};
