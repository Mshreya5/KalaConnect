const pool = require('../config/db');

// GET /api/participants/:id/availability
exports.getByParticipant = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT availability_id, available_date, start_time, end_time, status FROM availability WHERE participant_id = ? ORDER BY available_date, start_time',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// POST /api/participants/:id/availability
exports.create = async (req, res) => {
  const { available_date, start_time, end_time, status } = req.body;
  if (!available_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'available_date, start_time, and end_time are required' });
  }
  const validStatuses = ['Available', 'Busy', 'Tentative'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }
  if (start_time >= end_time) {
    return res.status(400).json({ error: 'start_time must be before end_time' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO availability (participant_id, available_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, available_date, start_time, end_time, status || 'Available']
    );
    res.status(201).json({ availability_id: result.insertId, message: 'Availability slot created' });
  } catch (err) {
    if (err.sqlState === '45000') return res.status(409).json({ error: err.message });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Participant not found' });
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// PUT /api/availability/:id
exports.update = async (req, res) => {
  const { available_date, start_time, end_time, status } = req.body;
  const validStatuses = ['Available', 'Busy', 'Tentative'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }
  try {
    const [existing] = await pool.query('SELECT * FROM availability WHERE availability_id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Availability slot not found' });

    const merged = {
      available_date: available_date || existing[0].available_date,
      start_time: start_time || existing[0].start_time,
      end_time: end_time || existing[0].end_time,
      status: status || existing[0].status,
    };

    if (merged.start_time >= merged.end_time) {
      return res.status(400).json({ error: 'start_time must be before end_time' });
    }

    await pool.query(
      'UPDATE availability SET available_date = ?, start_time = ?, end_time = ?, status = ? WHERE availability_id = ?',
      [merged.available_date, merged.start_time, merged.end_time, merged.status, req.params.id]
    );
    res.json({ message: 'Availability slot updated' });
  } catch (err) {
    if (err.sqlState === '45000') return res.status(409).json({ error: err.message });
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// DELETE /api/availability/:id
exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM availability WHERE availability_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Availability slot not found' });
    res.json({ message: 'Availability slot deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};
