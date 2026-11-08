const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const participationController = require('../controllers/participationController');

// Events CRUD
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Requirements for an event
router.get('/:id/requirements', eventController.getEventRequirements);
router.post('/:id/requirements', eventController.addEventRequirement);
router.delete('/:id/requirements/:reqId', eventController.deleteEventRequirement);
router.delete('/requirements/:reqId', eventController.deleteEventRequirement);

// Talent Matching (Calls Stored Procedure)
router.get('/:id/match-talents', participationController.matchTalentsForEvent);

// Participants for an event
router.get('/:id/participants', participationController.getEventParticipants);
router.post('/:id/register', participationController.registerParticipation);

module.exports = router;
