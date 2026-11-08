const { pool } = require('../config/db');

exports.getUpcomingEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.event_id, e.event_name, e.event_date, e.start_time, e.end_time,
        e.venue, e.status AS event_status,
        o.organizer_id, o.full_name AS organizer_name, o.email AS organizer_email,
        o.phone AS organizer_phone, o.club_or_dept AS organizing_body, o.designation AS organizer_title,
        COALESCE(ca.activity_name, 'Inter-Disciplinary / General') AS cultural_theme
      FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN cultural_activities ca ON e.activity_id = ca.activity_id
      WHERE e.event_date >= CURRENT_DATE OR e.status = 'Scheduled'
      ORDER BY e.event_date ASC, e.start_time ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDeficitReport = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.event_id, e.event_name, e.event_date,
        o.full_name AS organizer_name, o.club_or_dept,
        s.skill_id, s.skill_name AS required_skill,
        er.required_count AS target_headcount,
        COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_headcount,
        (er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS deficit_headcount
      FROM event_requirements er
      INNER JOIN events e ON er.event_id = e.event_id
      INNER JOIN organizers o ON e.organizer_id = o.organizer_id
      INNER JOIN skills s ON er.skill_id = s.skill_id
      LEFT JOIN participation ptn ON e.event_id = ptn.event_id
      LEFT JOIN participant_skills ps ON ptn.participant_id = ps.participant_id AND ps.skill_id = s.skill_id
      WHERE e.status = 'Scheduled'
      GROUP BY e.event_id, e.event_name, e.event_date, o.full_name, o.club_or_dept, s.skill_id, s.skill_name, er.required_count
      HAVING deficit_headcount > 0
      ORDER BY deficit_headcount DESC, e.event_date ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEventParticipantCounts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.event_id, e.event_name, e.event_date, e.venue, e.status AS event_status,
        o.full_name AS organizer_name,
        COUNT(ptn.participation_id) AS total_registrations,
        COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_count,
        COUNT(CASE WHEN ptn.status = 'Shortlisted' THEN 1 END) AS shortlisted_count,
        COUNT(CASE WHEN ptn.status = 'Registered' THEN 1 END) AS pending_review_count,
        COUNT(CASE WHEN ptn.status = 'Cancelled' THEN 1 END) AS cancelled_count
      FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN participation ptn ON e.event_id = ptn.event_id
      GROUP BY e.event_id, e.event_name, e.event_date, e.venue, e.status, o.full_name
      ORDER BY e.event_date ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOrganizerSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.organizer_id, o.full_name, o.club_or_dept, o.designation,
        COUNT(e.event_id) AS total_events_organized,
        SUM(CASE WHEN e.status = 'Completed' THEN 1 ELSE 0 END) AS completed_events,
        SUM(CASE WHEN e.status = 'Scheduled' THEN 1 ELSE 0 END) AS upcoming_events,
        COUNT(ptn.participation_id) AS total_participants_engaged
      FROM organizers o
      LEFT JOIN events e ON o.organizer_id = e.organizer_id
      LEFT JOIN participation ptn ON e.event_id = ptn.event_id
      GROUP BY o.organizer_id, o.full_name, o.club_or_dept, o.designation
      ORDER BY total_events_organized DESC, o.full_name ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPopularEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.event_id, e.event_name, e.event_date, e.venue,
        o.full_name AS organizer_name, o.club_or_dept,
        COUNT(ptn.participation_id) AS total_registrations,
        COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_participants,
        DENSE_RANK() OVER (ORDER BY COUNT(ptn.participation_id) DESC) AS popularity_rank
      FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN participation ptn ON e.event_id = ptn.event_id
      GROUP BY e.event_id, e.event_name, e.event_date, e.venue, o.full_name, o.club_or_dept
      ORDER BY popularity_rank ASC, e.event_date ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDepartmentDistribution = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.department,
        COUNT(DISTINCT p.participant_id) AS distinct_students,
        COUNT(ptn.participation_id) AS total_event_engagements
      FROM participants p
      JOIN participation ptn ON p.participant_id = ptn.participant_id
      WHERE ptn.status IN ('Confirmed', 'Attended', 'Registered')
      GROUP BY p.department
      ORDER BY total_event_engagements DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [eventCount] = await pool.query(`SELECT COUNT(*) AS total_events FROM events`);
    const [upcomingCount] = await pool.query(`SELECT COUNT(*) AS upcoming_events FROM events WHERE status = 'Scheduled'`);
    const [organizerCount] = await pool.query(`SELECT COUNT(*) AS total_organizers FROM organizers`);
    const [participantCount] = await pool.query(`SELECT COUNT(*) AS total_participants FROM participants`);
    const [participationCount] = await pool.query(`SELECT COUNT(*) AS total_registrations FROM participation`);
    const [deficitCount] = await pool.query(`
      SELECT COUNT(*) AS unfilled_requirements FROM (
        SELECT er.requirement_id
        FROM event_requirements er
        JOIN events e ON er.event_id = e.event_id
        LEFT JOIN participation ptn ON er.event_id = ptn.event_id AND ptn.status = 'Confirmed'
        WHERE e.status = 'Scheduled'
        GROUP BY er.requirement_id, er.required_count
        HAVING er.required_count > COUNT(ptn.participation_id)
      ) AS t
    `);

    res.json({
      success: true,
      data: {
        total_events: eventCount[0].total_events || 0,
        upcoming_events: upcomingCount[0].upcoming_events || 0,
        total_organizers: organizerCount[0].total_organizers || 0,
        total_participants: participantCount[0].total_participants || 0,
        total_registrations: participationCount[0].total_registrations || 0,
        unfilled_requirements: deficitCount[0]?.unfilled_requirements || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
