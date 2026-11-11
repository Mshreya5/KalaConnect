const db = require('../config/db');
const pool = db.query ? db : db.pool;

exports.getEventParticipants = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        ptn.participation_id, ptn.event_id, e.event_name,
        p.participant_id, p.full_name AS participant_name,
        p.college_id AS usn_or_roll, p.department, p.year_of_study,
        p.email AS participant_email, p.phone AS participant_phone,
        ptn.role, ptn.status AS participation_status,
        ptn.feedback_or_score, ptn.registered_at
      FROM participation ptn
      INNER JOIN participants p ON ptn.participant_id = p.participant_id
      INNER JOIN events e ON ptn.event_id = e.event_id
      WHERE ptn.event_id = ?
      ORDER BY FIELD(ptn.status, 'Confirmed', 'Shortlisted', 'Registered', 'Attended', 'Cancelled'), p.full_name ASC
    `, [id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.matchTalentsForEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query(`CALL sp_match_available_talents_for_event(?)`, [id]);
    const matchedParticipants = results[0] || [];
    res.json({ success: true, event_id: parseInt(id, 10), count: matchedParticipants.length, data: matchedParticipants });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ success: false, error: err.sqlMessage || err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.registerParticipation = async (req, res) => {
  const { id: event_id } = req.params;
  const { participant_id, role } = req.body;

  if (!participant_id) {
    return res.status(400).json({ success: false, error: 'participant_id is required.' });
  }

  const targetEventId = event_id || req.body.event_id;
  if (!targetEventId) {
    return res.status(400).json({ success: false, error: 'event_id is required.' });
  }

  try {
    await pool.query(
      `CALL sp_register_event_participation(?, ?, ?, @status_code, @status_message)`,
      [participant_id, targetEventId, role || 'Performer']
    );

    const [[outResult]] = await pool.query(`SELECT @status_code AS code, @status_message AS message`);

    if (outResult.code === 1) {
      return res.status(201).json({ success: true, message: outResult.message });
    } else {
      return res.status(400).json({ success: false, error: outResult.message, code: outResult.code });
    }
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ success: false, error: err.sqlMessage || err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateParticipationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, role, feedback_or_score } = req.body;

  const validStatuses = ['Registered', 'Shortlisted', 'Confirmed', 'Attended', 'Cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const [result] = await pool.query(`
      UPDATE participation
      SET status = COALESCE(?, status),
          role = COALESCE(?, role),
          feedback_or_score = COALESCE(?, feedback_or_score)
      WHERE participation_id = ?
    `, [status, role, feedback_or_score, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Participation record not found' });
    }
    res.json({ success: true, message: 'Participation updated successfully' });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ success: false, error: err.sqlMessage || err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteParticipation = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM participation WHERE participation_id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Participation record not found' });
    }
    res.json({ success: true, message: 'Participation removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
