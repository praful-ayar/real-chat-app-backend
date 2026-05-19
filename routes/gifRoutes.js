const express = require('express');
const router = express.Router();
const { getAllGifs, createGif, deleteGif, getGiphyTrending, searchGiphy } = require('../controllers/gifController');
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

// @route   GET api/gifs/giphy/trending
router.get('/trending', getGiphyTrending);

// @route   GET api/gifs/giphy/search
router.get('/search', searchGiphy);

module.exports = router;
