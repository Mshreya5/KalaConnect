const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const participationController = require('../controllers/participationController');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

router.get('/:id/requirements', eventController.getEventRequirements);
router.post('/:id/requirements', eventController.addEventRequirement);
router.delete('/:id/requirements/:reqId', eventController.deleteEventRequirement);
router.delete('/requirements/:reqId', eventController.deleteEventRequirement);

router.get('/:id/match-talents', participationController.matchTalentsForEvent);

router.get('/:id/participants', participationController.getEventParticipants);
router.post('/:id/register', participationController.registerParticipation);

module.exports = router;
