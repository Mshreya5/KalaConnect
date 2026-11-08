const { pool } = require('../config/db');

// List cultural activities
exports.getCulturalActivities = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT activity_id, activity_name, category, description 
      FROM cultural_activities 
      ORDER BY category, activity_name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// List skills with activity names
exports.getSkills = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.skill_id, s.skill_name, s.description, ca.activity_id, ca.activity_name, ca.category
      FROM skills s
      JOIN cultural_activities ca ON s.activity_id = ca.activity_id
      ORDER BY ca.activity_name, s.skill_name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// List participants
exports.getParticipants = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT participant_id, full_name, email, phone, college_id, department, year_of_study
      FROM participants
      ORDER BY full_name ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
