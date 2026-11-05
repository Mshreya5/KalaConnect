const pool = require('../config/db');

// GET /api/activities
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT activity_id, activity_name, category, description FROM cultural_activities ORDER BY category, activity_name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// GET /api/activities/:id/skills
exports.getSkills = async (req, res) => {
  try {
    const [activity] = await pool.query('SELECT activity_id, activity_name FROM cultural_activities WHERE activity_id = ?', [req.params.id]);
    if (!activity.length) return res.status(404).json({ error: 'Activity not found' });

    const [skills] = await pool.query(
      'SELECT skill_id, skill_name, description FROM skills WHERE activity_id = ? ORDER BY skill_name',
      [req.params.id]
    );
    res.json({ activity: activity[0], skills });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};
