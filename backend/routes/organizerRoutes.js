const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');

router.get('/', organizerController.getAllOrganizers);
router.get('/:id', organizerController.getOrganizerById);
router.post('/', organizerController.createOrganizer);
router.put('/:id', organizerController.updateOrganizer);

module.exports = router;
