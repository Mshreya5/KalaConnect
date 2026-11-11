const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');

router.get('/cultural-activities', lookupController.getCulturalActivities);
router.get('/skills', lookupController.getSkills);
router.get('/participants', lookupController.getParticipants);

module.exports = router;
