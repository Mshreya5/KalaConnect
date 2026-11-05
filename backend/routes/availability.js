const express = require('express');
const router = express.Router();
const avc = require('../controllers/availabilityController');

router.put('/:id', avc.update);
router.delete('/:id', avc.remove);

module.exports = router;
