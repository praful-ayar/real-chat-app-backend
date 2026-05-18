const express = require('express');
const router = express.Router();
const { getAllGifs, createGif, deleteGif } = require('../controllers/gifController');
const authMiddleware = require('../middleware/auth');

// @route   GET api/gifs
// @desc    Get all GIFs
router.get('/', getAllGifs);

// @route   POST api/gifs
// @desc    Add a new GIF (Protected)
router.post('/', authMiddleware, createGif);

// @route   DELETE api/gifs/:id
// @desc    Delete a GIF (Protected)
router.delete('/:id', authMiddleware, deleteGif);

module.exports = router;
