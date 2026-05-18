const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, deleteMessage } = require('../controllers/messageController');

// @route   GET api/messages
router.get('/', getMessages);

// @route   POST api/messages
router.post('/', sendMessage);

// @route   DELETE api/messages/:id
router.delete('/:id', deleteMessage);

module.exports = router;
