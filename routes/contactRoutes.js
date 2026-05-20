const express = require('express');
const router = express.Router();
const { sendRequest, getRequests, acceptRequest, rejectRequest, getContacts, searchUsers } = require('../controllers/contactController');
const authMiddleware = require('../middleware/auth');

// @route   POST api/contacts/request
// @desc    Send a contact request
// @access  Private
router.post('/request', authMiddleware, sendRequest);

// @route   GET api/contacts/requests
// @desc    Get pending contact requests
// @access  Private
router.get('/requests', authMiddleware, getRequests);

// @route   POST api/contacts/accept
// @desc    Accept a contact request
// @access  Private
router.post('/accept', authMiddleware, acceptRequest);

// @route   POST api/contacts/reject
// @desc    Reject a contact request
// @access  Private
router.post('/reject', authMiddleware, rejectRequest);

// @route   GET api/contacts/search
// @desc    Search users to add to contacts
// @access  Private
router.get('/search', authMiddleware, searchUsers);

// @route   GET api/contacts
// @desc    Get all contacts for the current user
// @access  Private
router.get('/', authMiddleware, getContacts);

module.exports = router;
