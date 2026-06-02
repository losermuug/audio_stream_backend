const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Track = require('../models/Track');

async function search(req, res) {
  const q = (req.query.q || '').trim();

  if (!q) {
    return res.json({ tracks: [], artists: [], albums: [] });
  }

  const [tracks, artists, albums] = await Promise.all([
    Track.find({ $text: { $search: q }, isPublished: true })
      .populate('artist', 'name avatarUrl verified')
      .populate('album', 'title coverUrl')
      .limit(10),
    Artist.find({ $text: { $search: q } }).limit(10),
    Album.find({ $text: { $search: q }, isPublished: true })
      .populate('artist', 'name avatarUrl verified')
      .limit(10),
  ]);

  res.json({ tracks, artists, albums });
}

module.exports = {
  search,
};
