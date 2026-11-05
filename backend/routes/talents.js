const express = require('express');
const router = express.Router();
const tc = require('../controllers/talentController');

router.get('/search', tc.search);
router.get('/available', tc.available);

module.exports = router;
