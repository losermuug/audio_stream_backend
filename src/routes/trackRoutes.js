const express = require('express');
const trackController = require('../controllers/trackController');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalUser, requireRole, requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(trackController.listTracks));
router.post('/', requireUser, requireRole('artist', 'admin'), asyncHandler(trackController.createTrack));
router.get('/:id', asyncHandler(trackController.getTrack));
router.patch('/:id', requireUser, requireRole('artist', 'admin'), asyncHandler(trackController.updateTrack));
router.get('/:id/stream', asyncHandler(trackController.streamTrack));
router.post('/:id/play', optionalUser, asyncHandler(trackController.recordPlay));

module.exports = router;
