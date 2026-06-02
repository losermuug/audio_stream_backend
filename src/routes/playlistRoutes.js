const express = require('express');
const playlistController = require('../controllers/playlistController');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalUser, requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalUser, asyncHandler(playlistController.listPlaylists));
router.post('/', requireUser, asyncHandler(playlistController.createPlaylist));
router.get('/:id', optionalUser, asyncHandler(playlistController.getPlaylist));
router.patch('/:id', requireUser, asyncHandler(playlistController.updatePlaylist));
router.post('/:id/tracks', requireUser, asyncHandler(playlistController.addTrackToPlaylist));
router.delete('/:id/tracks/:trackId', requireUser, asyncHandler(playlistController.removeTrackFromPlaylist));

module.exports = router;
