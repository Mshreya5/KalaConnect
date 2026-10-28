-- =====================================================================
-- KalaConnect — Database Views
-- Purpose: Provide simplified, reusable virtual tables for frontend APIs and reporting
-- Shared between Member 1 and Member 2
-- =====================================================================

USE kalaconnect;

-- ---------------------------------------------------------------------
-- VIEW 1: v_talent_directory
-- Flattens the M:N relationship between participants, skills, and cultural activities.
-- Primary use case: Frontend artist search, filtering by art domain and skill.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_talent_directory AS
SELECT 
    p.participant_id,
    p.full_name AS artist_name,
    p.college_id AS roll_number,
    p.department,
    p.year_of_study,
    ca.category AS activity_domain,
    ca.activity_name,
    s.skill_id,
    s.skill_name,
    ps.proficiency_level,
    ps.years_of_experience,
    ps.portfolio_url
FROM participants p
JOIN participant_skills ps ON p.participant_id = ps.participant_id
JOIN skills s ON ps.skill_id = s.skill_id
JOIN cultural_activities ca ON s.activity_id = ca.activity_id;


-- ---------------------------------------------------------------------
-- VIEW 2: v_event_fulfillment_status
-- Aggregates event requirements against confirmed participation.
-- Primary use case: Coordinator dashboard showing unfilled slots.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_event_fulfillment_status AS
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    e.venue,
    e.status AS event_status,
    o.full_name AS organizer_name,
    o.club_or_dept,
    s.skill_name AS required_skill,
    er.required_count AS target_count,
    COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_count,
    GREATEST(0, er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS open_slots
FROM events e
JOIN organizers o ON e.organizer_id = o.organizer_id
JOIN event_requirements er ON e.event_id = er.event_id
JOIN skills s ON er.skill_id = s.skill_id
LEFT JOIN participation ptn 
    ON e.event_id = ptn.event_id
LEFT JOIN participant_skills ps 
    ON ptn.participant_id = ps.participant_id AND ps.skill_id = s.skill_id
GROUP BY 
    e.event_id, e.event_name, e.event_date, e.venue, e.status,
    o.full_name, o.club_or_dept, s.skill_name, er.required_count;


-- ---------------------------------------------------------------------
-- VIEW 3: v_upcoming_event_roster
-- Detailed roster of all confirmed students across all scheduled events.
-- Primary use case: Generating attendance sheets and stage cue schedules.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_upcoming_event_roster AS
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    e.start_time,
    e.end_time,
    e.venue,
    p.participant_id,
    p.full_name AS participant_name,
    p.college_id,
    p.phone AS participant_phone,
    ptn.role,
    ptn.status AS participation_status
FROM events e
JOIN participation ptn ON e.event_id = ptn.event_id
JOIN participants p ON ptn.participant_id = p.participant_id
WHERE e.status = 'Scheduled'
ORDER BY e.event_date ASC, e.start_time ASC, p.full_name ASC;
