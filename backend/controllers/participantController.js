const pool = require('../config/db');

// GET /api/participants
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT participant_id, full_name, email, phone, college_id, department, year_of_study, bio, created_at FROM participants ORDER BY full_name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// GET /api/participants/:id
exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT participant_id, full_name, email, phone, college_id, department, year_of_study, bio, created_at FROM participants WHERE participant_id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Participant not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// POST /api/participants
exports.create = async (req, res) => {
  const { full_name, email, phone, college_id, department, year_of_study, bio } = req.body;
  if (!full_name || !email || !phone || !college_id || !department || !year_of_study) {
    return res.status(400).json({ error: 'full_name, email, phone, college_id, department, year_of_study are required' });
  }
  if (year_of_study < 1 || year_of_study > 5) {
    return res.status(400).json({ error: 'year_of_study must be between 1 and 5' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO participants (full_name, email, phone, college_id, department, year_of_study, bio) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email.toLowerCase(), phone, college_id.toUpperCase(), department, year_of_study, bio || null]
    );
    res.status(201).json({ participant_id: result.insertId, message: 'Participant registered successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.message.includes('email') ? 'email' : 'college_id';
      return res.status(409).json({ error: `A participant with this ${field} already exists` });
    }
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// PUT /api/participants/:id
exports.update = async (req, res) => {
  const { full_name, email, phone, college_id, department, year_of_study, bio } = req.body;
  if (year_of_study && (year_of_study < 1 || year_of_study > 5)) {
    return res.status(400).json({ error: 'year_of_study must be between 1 and 5' });
  }
  try {
    const [existing] = await pool.query('SELECT participant_id FROM participants WHERE participant_id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Participant not found' });

    await pool.query(
      `UPDATE participants SET
        full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        college_id = COALESCE(?, college_id),
        department = COALESCE(?, department),
        year_of_study = COALESCE(?, year_of_study),
        bio = COALESCE(?, bio)
       WHERE participant_id = ?`,
      [full_name, email, phone, college_id, department, year_of_study, bio, req.params.id]
    );
    res.json({ message: 'Participant updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.message.includes('email') ? 'email' : 'college_id';
      return res.status(409).json({ error: `A participant with this ${field} already exists` });
    }
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// DELETE /api/participants/:id
exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM participants WHERE participant_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Participant not found' });
    res.json({ message: 'Participant deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// GET /api/participants/:id/skills
exports.getSkills = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ps.skill_id, s.skill_name, ca.activity_name, ca.category,
              ps.proficiency_level, ps.years_of_experience, ps.portfolio_url
       FROM participant_skills ps
       JOIN skills s ON ps.skill_id = s.skill_id
       JOIN cultural_activities ca ON s.activity_id = ca.activity_id
       WHERE ps.participant_id = ?
       ORDER BY ca.category, s.skill_name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// POST /api/participants/:id/skills
exports.addSkill = async (req, res) => {
  const { skill_id, proficiency_level, years_of_experience, portfolio_url } = req.body;
  if (!skill_id || !proficiency_level) {
    return res.status(400).json({ error: 'skill_id and proficiency_level are required' });
  }
  const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
  if (!validLevels.includes(proficiency_level)) {
    return res.status(400).json({ error: `proficiency_level must be one of: ${validLevels.join(', ')}` });
  }
  try {
    await pool.query(
      'INSERT INTO participant_skills (participant_id, skill_id, proficiency_level, years_of_experience, portfolio_url) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, skill_id, proficiency_level, years_of_experience || 0, portfolio_url || null]
    );
    res.status(201).json({ message: 'Skill added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Participant already has this skill' });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Invalid participant_id or skill_id' });
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// PUT /api/participants/:id/skills/:skillId
exports.updateSkill = async (req, res) => {
  const { proficiency_level, years_of_experience, portfolio_url } = req.body;
  const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
  if (proficiency_level && !validLevels.includes(proficiency_level)) {
    return res.status(400).json({ error: `proficiency_level must be one of: ${validLevels.join(', ')}` });
  }
  try {
    const [result] = await pool.query(
      `UPDATE participant_skills SET
        proficiency_level = COALESCE(?, proficiency_level),
        years_of_experience = COALESCE(?, years_of_experience),
        portfolio_url = COALESCE(?, portfolio_url)
       WHERE participant_id = ? AND skill_id = ?`,
      [proficiency_level, years_of_experience, portfolio_url, req.params.id, req.params.skillId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Skill entry not found for this participant' });
    res.json({ message: 'Skill updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// DELETE /api/participants/:id/skills/:skillId
exports.removeSkill = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM participant_skills WHERE participant_id = ? AND skill_id = ?',
      [req.params.id, req.params.skillId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Skill entry not found for this participant' });
    res.json({ message: 'Skill removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};
