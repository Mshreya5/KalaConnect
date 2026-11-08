const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/dashboard-stats', reportController.getDashboardStats);
router.get('/upcoming', reportController.getUpcomingEvents);
router.get('/deficit', reportController.getDeficitReport);
router.get('/popular-events', reportController.getPopularEvents);
router.get('/event-counts', reportController.getEventParticipantCounts);
router.get('/organizer-summary', reportController.getOrganizerSummary);
router.get('/department-distribution', reportController.getDepartmentDistribution);

module.exports = router;
