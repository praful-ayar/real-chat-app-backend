const Gif = require('../models/gif');

// @route   GET api/gifs
// @desc    Get all GIFs
exports.getAllGifs = async (req, res) => {
    try {
        const gifs = await Gif.find().sort({ createdAt: -1 });
        res.json(gifs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/gifs
// @desc    Add a new GIF
exports.createGif = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }
    try {
        const newGif = new Gif({ url });
        await newGif.save();
        res.status(201).json(newGif);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/gifs/:id
// @desc    Delete a GIF
exports.deleteGif = async (req, res) => {
    try {
        const gif = await Gif.findById(req.params.id);
        if (!gif) {
            return res.status(404).json({ message: 'GIF not found' });
        }
        await gif.deleteOne();
        res.json({ message: 'GIF removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/gifs/giphy/trending
exports.getGiphyTrending = async (req, res) => {
    try {
        const apiKey = process.env.GIPHY_API_KEY;
        // Fetch from Giphy (Requires Node 18+ for native fetch)
        const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20`);
        const data = await response.json();
        res.json(data.data.map(g => ({ url: g.images.original.url })));
    } catch (err) {
        console.error('Error fetching Giphy trending:', err.message);
        res.status(500).json({ message: 'Error fetching Giphy trending' });
    }
};

// @route   GET api/gifs/giphy/search
exports.searchGiphy = async (req, res) => {
    try {
        const apiKey = process.env.GIPHY_API_KEY;
        const query = req.query.q;
        if (!query) return res.status(400).json({ message: 'Query is required' });
        const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${query}&limit=20`);
        const data = await response.json();
        res.json(data.data.map(g => ({ url: g.images.original.url })));
    } catch (err) {
        console.error('Error searching Giphy:', err.message);
        res.status(500).json({ message: 'Error searching Giphy' });
    }
};
