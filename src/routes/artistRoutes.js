const express = require('express');
const artistController = require('../controllers/artistController');
const asyncHandler = require('../middleware/asyncHandler');
const { requireRole, requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(artistController.listArtists));
router.post('/', requireUser, requireRole('artist', 'admin'), asyncHandler(artistController.createArtist));
router.get('/:id', asyncHandler(artistController.getArtist));
router.get('/:id/albums', asyncHandler(artistController.getArtistAlbums));
router.get('/:id/tracks', asyncHandler(artistController.getArtistTracks));

module.exports = router;
