const Artist = require('../models/Artist');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const PlayHistory = require('../models/PlayHistory');
const Track = require('../models/Track');

async function listLikes(req, res) {
  const filter = { user: req.user.id };

  if (req.query.targetType) {
    filter.targetType = req.query.targetType;
  }

  const likes = await Like.find(filter).sort({ createdAt: -1 });
  res.json({ data: likes });
}

async function likeTarget(req, res) {
  const filter = {
    user: req.user.id,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
  };
  let like = await Like.findOne(filter);

  if (like) {
    return res.json(like);
  }

  like = await Like.create(filter);

  if (like.targetType === 'track') {
    await Track.findByIdAndUpdate(req.body.targetId, { $inc: { likeCount: 1 } });
  }

  res.status(201).json(like);
}

async function unlikeTarget(req, res) {
  const like = await Like.findOneAndDelete({
    user: req.user.id,
    targetType: req.params.targetType,
    targetId: req.params.targetId,
  });

  if (like && req.params.targetType === 'track') {
    await Track.findByIdAndUpdate(req.params.targetId, { $inc: { likeCount: -1 } });
  }

  res.status(204).send();
}

async function listHistory(req, res) {
  const history = await PlayHistory.find({ user: req.user.id })
    .populate({
      path: 'track',
      populate: [
        { path: 'artist', select: 'name avatarUrl verified' },
        { path: 'album', select: 'title coverUrl' },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ data: history });
}

async function followArtist(req, res) {
  const filter = { user: req.user.id, artist: req.body.artistId };
  let follow = await Follow.findOne(filter);

  if (follow) {
    return res.json(follow);
  }

  follow = await Follow.create(filter);

  await Artist.findByIdAndUpdate(req.body.artistId, { $inc: { followerCount: 1 } });

  res.status(201).json(follow);
}

async function unfollowArtist(req, res) {
  const follow = await Follow.findOneAndDelete({
    user: req.user.id,
    artist: req.params.artistId,
  });

  if (follow) {
    await Artist.findByIdAndUpdate(req.params.artistId, { $inc: { followerCount: -1 } });
  }

  res.status(204).send();
}

async function listFollowedArtists(req, res) {
  const follows = await Follow.find({ user: req.user.id })
    .populate('artist', 'name avatarUrl coverUrl verified genres followerCount')
    .sort({ createdAt: -1 });

  res.json({ data: follows });
}

module.exports = {
  listLikes,
  likeTarget,
  unlikeTarget,
  listHistory,
  followArtist,
  unfollowArtist,
  listFollowedArtists,
};
