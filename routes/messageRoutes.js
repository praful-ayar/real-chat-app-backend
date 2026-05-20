const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, deleteMessage, editMessage, reactToMessage } = require('../controllers/messageController');

// @route   GET api/messages
router.get('/', getMessages);

// @route   POST api/messages
router.post('/', sendMessage);

// @route   DELETE api/messages/:id
router.delete('/:id', deleteMessage);

router.put('/:id', editMessage);

// @route   POST api/messages/:id/react
router.post('/:id/react', reactToMessage);

module.exports = router;
