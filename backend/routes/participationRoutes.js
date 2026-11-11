const express = require('express');
const router = express.Router();
const participationController = require('../controllers/participationController');

router.post('/register', participationController.registerParticipation);
router.patch('/:id/status', participationController.updateParticipationStatus);
router.delete('/:id', participationController.deleteParticipation);

module.exports = router;
