const express = require('express');
const router = express.Router();
const ac = require('../controllers/activityController');

router.get('/', ac.getAll);
router.get('/:id/skills', ac.getSkills);

module.exports = router;
