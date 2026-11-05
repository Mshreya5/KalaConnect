const pool = require('../config/db');

// GET /api/talents/search?skill=&category=&proficiency=
exports.search = async (req, res) => {
  const { skill, category, proficiency } = req.query;
  const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  if (proficiency && !validLevels.includes(proficiency)) {
    return res.status(400).json({ error: `proficiency must be one of: ${validLevels.join(', ')}` });
  }

  let sql = `
    SELECT DISTINCT
      p.participant_id, p.full_name, p.email, p.department, p.year_of_study,
      s.skill_name, ca.activity_name, ca.category,
      ps.proficiency_level, ps.years_of_experience, ps.portfolio_url
    FROM participants p
    JOIN participant_skills ps ON p.participant_id = ps.participant_id
    JOIN skills s ON ps.skill_id = s.skill_id
    JOIN cultural_activities ca ON s.activity_id = ca.activity_id
    WHERE 1=1
  `;
  const params = [];

  if (skill) {
    sql += ' AND s.skill_name LIKE ?';
    params.push(`%${skill}%`);
  }
  if (category) {
    sql += ' AND (ca.category LIKE ? OR ca.activity_name LIKE ?)';
    params.push(`%${category}%`, `%${category}%`);
  }
  if (proficiency) {
    sql += ' AND ps.proficiency_level = ?';
    params.push(proficiency);
  }

  sql += ' ORDER BY ps.proficiency_level, p.full_name';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// GET /api/talents/available?date=&startTime=&endTime=
exports.available = async (req, res) => {
  const { date, startTime, endTime } = req.query;
  if (!date || !startTime || !endTime) {
    return res.status(400).json({ error: 'date, startTime, and endTime are required (date: YYYY-MM-DD, times: HH:MM)' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT
         p.participant_id, p.full_name, p.email, p.department, p.year_of_study,
         a.available_date, a.start_time, a.end_time, a.status
       FROM participants p
       JOIN availability a ON p.participant_id = a.participant_id
       WHERE a.available_date = ?
         AND a.status = 'Available'
         AND a.start_time <= ?
         AND a.end_time >= ?
       ORDER BY p.full_name`,
      [date, startTime, endTime]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// GET /api/dashboard/stats
exports.dashboardStats = async (req, res) => {
  try {
    const [[{ participantCount }]] = await pool.query('SELECT COUNT(*) AS participantCount FROM participants');
    const [[{ skillCount }]] = await pool.query('SELECT COUNT(*) AS skillCount FROM skills');
    const [[{ availabilityCount }]] = await pool.query("SELECT COUNT(*) AS availabilityCount FROM availability WHERE status = 'Available'");
    const [categoryStats] = await pool.query(
      `SELECT ca.category, COUNT(DISTINCT ps.participant_id) AS artist_count
       FROM cultural_activities ca
       LEFT JOIN skills s ON ca.activity_id = s.activity_id
       LEFT JOIN participant_skills ps ON s.skill_id = ps.skill_id
       GROUP BY ca.category ORDER BY artist_count DESC`
    );
    res.json({ participantCount, skillCount, availabilityCount, categoryStats });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};
