const express = require('express');
const libraryController = require('../controllers/libraryController');
const asyncHandler = require('../middleware/asyncHandler');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

router.use(requireUser);

router.get('/likes', asyncHandler(libraryController.listLikes));
router.post('/likes', asyncHandler(libraryController.likeTarget));
router.delete('/likes/:targetType/:targetId', asyncHandler(libraryController.unlikeTarget));
router.get('/history', asyncHandler(libraryController.listHistory));
router.get('/artists', asyncHandler(libraryController.listFollowedArtists));
router.post('/artists', asyncHandler(libraryController.followArtist));
router.delete('/artists/:artistId', asyncHandler(libraryController.unfollowArtist));

module.exports = router;
