-- =====================================================================
-- KalaConnect — Member 2 SQL Queries
-- Focus Scope: Organizer Management, Events, Event Requirements,
--              and Participation (M:N).
-- Author: Member 2 (Teammate)
-- =====================================================================

USE kalaconnect;

-- ---------------------------------------------------------------------
-- Q1: Event Schedule Dashboard
-- Retrieves upcoming events along with organizer details and activity themes.
-- ---------------------------------------------------------------------
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    e.start_time,
    e.end_time,
    e.venue,
    e.status,
    o.full_name AS organizer_name,
    o.club_or_dept,
    ca.activity_name AS theme_activity
FROM events e
JOIN organizers o ON e.organizer_id = o.organizer_id
LEFT JOIN cultural_activities ca ON e.activity_id = ca.activity_id
ORDER BY e.event_date ASC, e.start_time ASC;


-- ---------------------------------------------------------------------
-- Q2: Event Requirements Breakdown vs. Actual Registrations
-- Compares the number of artists required per skill against current confirmed artists.
-- ---------------------------------------------------------------------
SELECT 
    e.event_id,
    e.event_name,
    s.skill_name,
    er.required_count,
    COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_count,
    (er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS deficit_or_surplus
FROM event_requirements er
JOIN events e ON er.event_id = e.event_id
JOIN skills s ON er.skill_id = s.skill_id
LEFT JOIN participation ptn 
    ON e.event_id = ptn.event_id
LEFT JOIN participant_skills ps 
    ON ptn.participant_id = ps.participant_id AND ps.skill_id = s.skill_id
WHERE e.event_id = 201
GROUP BY e.event_id, e.event_name, s.skill_name, er.required_count;


-- ---------------------------------------------------------------------
-- Q3: Understaffed Events Detector (Deficit Analysis)
-- Finds all upcoming events that still have unfilled skill requirements.
-- ---------------------------------------------------------------------
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    s.skill_name AS missing_skill,
    er.required_count,
    COUNT(ptn.participation_id) AS current_assigned
FROM event_requirements er
JOIN events e ON er.event_id = e.event_id
JOIN skills s ON er.skill_id = s.skill_id
LEFT JOIN participation ptn 
    ON e.event_id = ptn.event_id 
    AND ptn.status = 'Confirmed'
WHERE e.status = 'Scheduled'
GROUP BY e.event_id, e.event_name, e.event_date, s.skill_name, er.required_count
HAVING current_assigned < er.required_count;


-- ---------------------------------------------------------------------
-- Q4: Organizer Workload & Event Portfolio Summary
-- Aggregates the total number of events hosted per organizer and club.
-- ---------------------------------------------------------------------
SELECT 
    o.organizer_id,
    o.full_name,
    o.club_or_dept,
    o.designation,
    COUNT(e.event_id) AS total_events_organized,
    SUM(CASE WHEN e.status = 'Completed' THEN 1 ELSE 0 END) AS completed_events,
    SUM(CASE WHEN e.status = 'Scheduled' THEN 1 ELSE 0 END) AS upcoming_events
FROM organizers o
LEFT JOIN events e ON o.organizer_id = e.organizer_id
GROUP BY o.organizer_id, o.full_name, o.club_or_dept, o.designation
ORDER BY total_events_organized DESC;


-- ---------------------------------------------------------------------
-- Q5: Event Roster: List All Registered Participants for an Event
-- Displays all applicants, their assigned role, and participation approval status.
-- ---------------------------------------------------------------------
SELECT 
    ptn.participation_id,
    p.full_name AS participant_name,
    p.college_id,
    p.department,
    ptn.role,
    ptn.status,
    ptn.feedback_or_score,
    ptn.registered_at
FROM participation ptn
JOIN participants p ON ptn.participant_id = p.participant_id
WHERE ptn.event_id = 201
ORDER BY ptn.status ASC, p.full_name ASC;


-- ---------------------------------------------------------------------
-- Q6: Top In-Demand Skills Across All College Events
-- Ranks which skills are most frequently requested by event organizers.
-- ---------------------------------------------------------------------
SELECT 
    s.skill_name,
    ca.activity_name,
    SUM(er.required_count) AS total_headcount_requested,
    COUNT(DISTINCT er.event_id) AS requested_in_events_count
FROM event_requirements er
JOIN skills s ON er.skill_id = s.skill_id
JOIN cultural_activities ca ON s.activity_id = ca.activity_id
GROUP BY s.skill_name, ca.activity_name
ORDER BY total_headcount_requested DESC;


-- ---------------------------------------------------------------------
-- Q7: Departmental Participation Distribution
-- Analyzes which academic departments contribute the most active cultural talent.
-- ---------------------------------------------------------------------
SELECT 
    p.department,
    COUNT(DISTINCT p.participant_id) AS distinct_students,
    COUNT(ptn.participation_id) AS total_event_engagements
FROM participants p
JOIN participation ptn ON p.participant_id = ptn.participant_id
WHERE ptn.status IN ('Confirmed', 'Attended')
GROUP BY p.department
ORDER BY total_event_engagements DESC;
