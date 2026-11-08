const { pool } = require('../config/db');

// List all organizers with event stats
exports.getAllOrganizers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.organizer_id,
        o.full_name,
        o.email,
        o.phone,
        o.club_or_dept,
        o.designation,
        o.created_at,
        COUNT(e.event_id) AS total_events,
        SUM(CASE WHEN e.status = 'Scheduled' THEN 1 ELSE 0 END) AS upcoming_events,
        SUM(CASE WHEN e.status = 'Completed' THEN 1 ELSE 0 END) AS completed_events
      FROM organizers o
      LEFT JOIN events e ON o.organizer_id = e.organizer_id
      GROUP BY o.organizer_id, o.full_name, o.email, o.phone, o.club_or_dept, o.designation, o.created_at
      ORDER BY o.full_name ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error in getAllOrganizers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single organizer by ID with their organized events
exports.getOrganizerById = async (req, res) => {
  const { id } = req.params;
  try {
    const [organizers] = await pool.query(
      `SELECT * FROM organizers WHERE organizer_id = ?`,
      [id]
    );
    if (organizers.length === 0) {
      return res.status(404).json({ success: false, error: 'Organizer not found' });
    }

    const [events] = await pool.query(`
      SELECT 
        e.*,
        ca.activity_name AS cultural_theme,
        COUNT(ptn.participation_id) AS total_registrations,
        COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_participants
      FROM events e
      LEFT JOIN cultural_activities ca ON e.activity_id = ca.activity_id
      LEFT JOIN participation ptn ON e.event_id = ptn.event_id
      WHERE e.organizer_id = ?
      GROUP BY e.event_id
      ORDER BY e.event_date ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...organizers[0],
        events
      }
    });
  } catch (err) {
    console.error('Error in getOrganizerById:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Create new organizer
exports.createOrganizer = async (req, res) => {
  const { full_name, email, phone, club_or_dept, designation } = req.body;

  if (!full_name || !email || !phone || !club_or_dept) {
    return res.status(400).json({
      success: false,
      error: 'full_name, email, phone, and club_or_dept are required fields.'
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO organizers (full_name, email, phone, club_or_dept, designation) VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, phone, club_or_dept, designation || 'Coordinator']
    );
    res.status(201).json({
      success: true,
      message: 'Organizer created successfully',
      organizer_id: result.insertId
    });
  } catch (err) {
    console.error('Error in createOrganizer:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'An organizer with this email already exists.' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update organizer
exports.updateOrganizer = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, club_or_dept, designation } = req.body;

  if (!full_name || !email || !phone || !club_or_dept) {
    return res.status(400).json({
      success: false,
      error: 'full_name, email, phone, and club_or_dept are required.'
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE organizers 
       SET full_name = ?, email = ?, phone = ?, club_or_dept = ?, designation = ?
       WHERE organizer_id = ?`,
      [full_name, email, phone, club_or_dept, designation || 'Coordinator', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Organizer not found' });
    }

    res.json({ success: true, message: 'Organizer updated successfully' });
  } catch (err) {
    console.error('Error in updateOrganizer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
