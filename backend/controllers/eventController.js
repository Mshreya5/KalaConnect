const db = require('../config/db');
const pool = db.query ? db : db.pool;

exports.getAllEvents = async (req, res) => {
  const { status, organizer_id, upcoming } = req.query;
  let sql = `
    SELECT 
      e.event_id, e.event_name, e.event_date, e.start_time, e.end_time,
      e.venue, e.status, e.description, e.created_at,
      o.organizer_id, o.full_name AS organizer_name, o.club_or_dept,
      ca.activity_id, ca.activity_name AS cultural_theme, ca.category AS activity_category,
      COUNT(ptn.participation_id) AS total_registrations,
      COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_participants
    FROM events e
    INNER JOIN organizers o ON e.organizer_id = o.organizer_id
    LEFT JOIN cultural_activities ca ON e.activity_id = ca.activity_id
    LEFT JOIN participation ptn ON e.event_id = ptn.event_id
    WHERE 1=1
  `;
  const params = [];

  if (status) { sql += ` AND e.status = ?`; params.push(status); }
  if (organizer_id) { sql += ` AND e.organizer_id = ?`; params.push(organizer_id); }
  if (upcoming === 'true') { sql += ` AND (e.event_date >= CURRENT_DATE OR e.status = 'Scheduled')`; }

  sql += `
    GROUP BY e.event_id, e.event_name, e.event_date, e.start_time, e.end_time,
             e.venue, e.status, e.description, e.created_at, o.organizer_id,
             o.full_name, o.club_or_dept, ca.activity_id, ca.activity_name, ca.category
    ORDER BY e.event_date ASC, e.start_time ASC
  `;

  try {
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const [events] = await pool.query(`
      SELECT 
        e.*,
        o.full_name AS organizer_name, o.email AS organizer_email,
        o.phone AS organizer_phone, o.club_or_dept, o.designation,
        ca.activity_name AS cultural_theme, ca.category AS activity_category
      FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN cultural_activities ca ON e.activity_id = ca.activity_id
      WHERE e.event_id = ?
    `, [id]);

    if (events.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const [requirements] = await pool.query(`
      SELECT 
        er.requirement_id, er.event_id, er.skill_id,
        s.skill_name, ca.activity_name, er.required_count, er.notes,
        COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_count,
        GREATEST(0, er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS deficit
      FROM event_requirements er
      INNER JOIN skills s ON er.skill_id = s.skill_id
      INNER JOIN cultural_activities ca ON s.activity_id = ca.activity_id
      LEFT JOIN participation ptn ON er.event_id = ptn.event_id
      LEFT JOIN participant_skills ps ON ptn.participant_id = ps.participant_id AND ps.skill_id = s.skill_id
      WHERE er.event_id = ?
      GROUP BY er.requirement_id, er.event_id, er.skill_id, s.skill_name, ca.activity_name, er.required_count, er.notes
      ORDER BY s.skill_name ASC
    `, [id]);

    const [counts] = await pool.query(`
      SELECT 
        COUNT(participation_id) AS total_registrations,
        COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) AS confirmed,
        COUNT(CASE WHEN status = 'Shortlisted' THEN 1 END) AS shortlisted,
        COUNT(CASE WHEN status = 'Registered' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'Attended' THEN 1 END) AS attended,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) AS cancelled
      FROM participation WHERE event_id = ?
    `, [id]);

    res.json({ success: true, data: { ...events[0], requirements, participation_summary: counts[0] || {} } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  const { organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description } = req.body;

  if (!organizer_id || !event_name || !event_date || !start_time || !end_time || !venue) {
    return res.status(400).json({ success: false, error: 'organizer_id, event_name, event_date, start_time, end_time, and venue are required.' });
  }
  if (end_time <= start_time) {
    return res.status(400).json({ success: false, error: 'Event end_time must be strictly after start_time.' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO events (organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [organizer_id, activity_id || null, event_name, event_date, start_time, end_time, venue, status || 'Scheduled', description || null]);

    res.status(201).json({ success: true, message: 'Event created successfully', event_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description } = req.body;

  if (end_time && start_time && end_time <= start_time) {
    return res.status(400).json({ success: false, error: 'Event end_time must be strictly after start_time.' });
  }

  try {
    const [result] = await pool.query(`
      UPDATE events
      SET organizer_id = COALESCE(?, organizer_id),
          activity_id = COALESCE(?, activity_id),
          event_name = COALESCE(?, event_name),
          event_date = COALESCE(?, event_date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          venue = COALESCE(?, venue),
          status = COALESCE(?, status),
          description = COALESCE(?, description)
      WHERE event_id = ?
    `, [organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, message: 'Event updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM events WHERE event_id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEventRequirements = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        er.requirement_id, er.event_id, er.skill_id,
        s.skill_name, ca.activity_name, er.required_count, er.notes,
        COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_count,
        GREATEST(0, er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS deficit
      FROM event_requirements er
      INNER JOIN skills s ON er.skill_id = s.skill_id
      INNER JOIN cultural_activities ca ON s.activity_id = ca.activity_id
      LEFT JOIN participation ptn ON er.event_id = ptn.event_id
      LEFT JOIN participant_skills ps ON ptn.participant_id = ps.participant_id AND ps.skill_id = s.skill_id
      WHERE er.event_id = ?
      GROUP BY er.requirement_id, er.event_id, er.skill_id, s.skill_name, ca.activity_name, er.required_count, er.notes
      ORDER BY s.skill_name ASC
    `, [id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addEventRequirement = async (req, res) => {
  const { id } = req.params;
  const { skill_id, required_count, notes } = req.body;

  if (!skill_id || !required_count || required_count <= 0) {
    return res.status(400).json({ success: false, error: 'skill_id and a positive required_count are required.' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO event_requirements (event_id, skill_id, required_count, notes)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE required_count = VALUES(required_count), notes = VALUES(notes)
    `, [id, skill_id, required_count, notes || null]);

    res.status(201).json({ success: true, message: 'Event requirement saved successfully', requirement_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteEventRequirement = async (req, res) => {
  const { reqId } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM event_requirements WHERE requirement_id = ?`, [reqId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Requirement not found' });
    }
    res.json({ success: true, message: 'Requirement removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
