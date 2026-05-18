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
