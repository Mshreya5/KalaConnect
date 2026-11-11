const express = require('express');
const router = express.Router();
const pc = require('../controllers/participantController');

router.get('/', pc.getAll);
router.post('/', pc.create);
router.get('/:id', pc.getById);
router.put('/:id', pc.update);
router.delete('/:id', pc.remove);

router.get('/:id/skills', pc.getSkills);
router.post('/:id/skills', pc.addSkill);
router.put('/:id/skills/:skillId', pc.updateSkill);
router.delete('/:id/skills/:skillId', pc.removeSkill);

router.get('/:id/stats', pc.getStats);
router.get('/:id/availability', require('../controllers/availabilityController').getByParticipant);
router.post('/:id/availability', require('../controllers/availabilityController').create);

module.exports = router;
