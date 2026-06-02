const express = require('express');
const albumController = require('../controllers/albumController');
const asyncHandler = require('../middleware/asyncHandler');
const { requireRole, requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(albumController.listAlbums));
router.post('/', requireUser, requireRole('artist', 'admin'), asyncHandler(albumController.createAlbum));
router.get('/:id', asyncHandler(albumController.getAlbum));
router.get('/:id/tracks', asyncHandler(albumController.getAlbumTracks));

module.exports = router;
