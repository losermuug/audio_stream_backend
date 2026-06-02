const express = require('express');
const searchController = require('../controllers/searchController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(searchController.search));

module.exports = router;
