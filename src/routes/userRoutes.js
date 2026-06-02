const express = require('express');
const userController = require('../controllers/userController');
const asyncHandler = require('../middleware/asyncHandler');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireUser, asyncHandler(userController.getMe));

module.exports = router;
