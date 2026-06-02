const express = require('express');
const albumRoutes = require('./albumRoutes');
const artistRoutes = require('./artistRoutes');
const authRoutes = require('./authRoutes');
const libraryRoutes = require('./libraryRoutes');
const playlistRoutes = require('./playlistRoutes');
const searchRoutes = require('./searchRoutes');
const trackRoutes = require('./trackRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'streaming-app-backend',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/artists', artistRoutes);
router.use('/albums', albumRoutes);
router.use('/tracks', trackRoutes);
router.use('/playlists', playlistRoutes);
router.use('/library', libraryRoutes);
router.use('/search', searchRoutes);

module.exports = router;
