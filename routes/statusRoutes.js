const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, statusController.createStatus);
router.get('/', authMiddleware, statusController.getStatuses);
router.post('/:id/view', authMiddleware, statusController.viewStatus);
router.delete('/:id', authMiddleware, statusController.deleteStatus);

module.exports = router;
