-- =====================================================================
-- KalaConnect — Member 2 SQL Queries
-- Focus Scope: Organizer Management, Events, Event Skill Requirements,
--              and Participation (M:N) Management.
-- Author: Member 2
-- Database: MySQL 8.0+ / kalaconnect
-- =====================================================================

USE kalaconnect;

-- =====================================================================
-- QUERY 1: Upcoming Events with Organizer Information
-- Purpose:
--   Retrieves all scheduled or ongoing cultural events occurring on or after
--   the current date, along with the designated organizer's contact details,
--   club/department affiliation, and the optional cultural activity theme.
-- Relational Concepts:
--   - INNER JOIN between events and organizers (mandatory parent).
--   - LEFT JOIN with cultural_activities (optional thematic parent).
--   - Filtering on status and date.
-- =====================================================================
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    e.start_time,
    e.end_time,
    e.venue,
    e.status AS event_status,
    o.organizer_id,
    o.full_name AS organizer_name,
    o.email AS organizer_email,
    o.phone AS organizer_phone,
    o.club_or_dept AS organizing_body,
    o.designation AS organizer_title,
    COALESCE(ca.activity_name, 'Inter-Disciplinary / General') AS cultural_theme,
    COALESCE(ca.category, 'General Arts') AS activity_category
FROM events e
INNER JOIN organizers o 
    ON e.organizer_id = o.organizer_id
LEFT JOIN cultural_activities ca 
    ON e.activity_id = ca.activity_id
WHERE e.event_date >= CURRENT_DATE 
   OR e.status = 'Scheduled'
ORDER BY e.event_date ASC, e.start_time ASC;


-- =====================================================================
-- QUERY 2: Participants Registered for a Selected Event
-- Purpose:
--   Lists all student participants registered for a specific target event
--   (Demonstrated here with event_id = 201: 'Sur Sangam: Annual Classical Music Night').
--   Displays participant academic details, assigned performance role,
--   approval status, and audition/feedback remarks.
-- Relational Concepts:
--   - 3-Table INNER JOIN connecting events, participation, and participants.
--   - Status-prioritized sorting via FIELD() function.
-- =====================================================================
SELECT 
    ptn.participation_id,
    e.event_id,
    e.event_name,
    p.participant_id,
    p.full_name AS participant_name,
    p.college_id AS usn_or_roll,
    p.department,
    p.year_of_study,
    p.email AS participant_email,
    p.phone AS participant_phone,
    ptn.role AS performance_role,
    ptn.status AS participation_status,
    ptn.feedback_or_score,
    ptn.registered_at
FROM participation ptn
INNER JOIN participants p 
    ON ptn.participant_id = p.participant_id
INNER JOIN events e 
    ON ptn.event_id = e.event_id
WHERE e.event_id = 201
ORDER BY 
    FIELD(ptn.status, 'Confirmed', 'Shortlisted', 'Registered', 'Attended', 'Cancelled'),
    p.full_name ASC;


-- =====================================================================
-- QUERY 3: Unfulfilled Event Requirements (Deficit Analysis)
-- Purpose:
--   Analyzes all upcoming scheduled events to identify skills where the number
--   of 'Confirmed' participants is less than the required target headcount.
--   Crucial for organizers to identify recruitment gaps early.
-- Relational Concepts:
--   - Aggregation with conditional COUNT() inside CASE expression.
--   - GROUP BY across event requirement composite attributes.
--   - HAVING clause filtering for strictly positive deficit (open slots).
-- =====================================================================
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    o.full_name AS organizer_name,
    o.club_or_dept,
    s.skill_id,
    s.skill_name AS required_skill,
    er.required_count AS target_headcount,
    COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_headcount,
    (er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS deficit_headcount
FROM event_requirements er
INNER JOIN events e 
    ON er.event_id = e.event_id
INNER JOIN organizers o 
    ON e.organizer_id = o.organizer_id
INNER JOIN skills s 
    ON er.skill_id = s.skill_id
LEFT JOIN participation ptn 
    ON e.event_id = ptn.event_id
LEFT JOIN participant_skills ps 
    ON ptn.participant_id = ps.participant_id 
   AND ps.skill_id = s.skill_id
WHERE e.status = 'Scheduled'
GROUP BY 
    e.event_id, 
    e.event_name, 
    e.event_date, 
    o.full_name, 
    o.club_or_dept, 
    s.skill_id, 
    s.skill_name, 
    er.required_count
HAVING deficit_headcount > 0
ORDER BY deficit_headcount DESC, e.event_date ASC;


-- =====================================================================
-- QUERY 4: Participant Counts Grouped by Event
-- Purpose:
--   Provides a high-level coordination summary of student interest and approval
--   funnel for every event in the system (total applicants, confirmed, shortlisted,
--   and pending review).
-- Relational Concepts:
--   - LEFT JOIN ensuring events with 0 participants are retained.
--   - Multiple conditional aggregations using SUM(CASE...) and COUNT().
-- =====================================================================
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    e.venue,
    e.status AS event_status,
    o.full_name AS organizer_name,
    COUNT(ptn.participation_id) AS total_registrations,
    COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_count,
    COUNT(CASE WHEN ptn.status = 'Shortlisted' THEN 1 END) AS shortlisted_count,
    COUNT(CASE WHEN ptn.status = 'Registered' THEN 1 END) AS pending_review_count,
    COUNT(CASE WHEN ptn.status = 'Cancelled' THEN 1 END) AS cancelled_count
FROM events e
INNER JOIN organizers o 
    ON e.organizer_id = o.organizer_id
LEFT JOIN participation ptn 
    ON e.event_id = ptn.event_id
GROUP BY 
    e.event_id, 
    e.event_name, 
    e.event_date, 
    e.venue, 
    e.status, 
    o.full_name
ORDER BY e.event_date ASC;


-- =====================================================================
-- QUERY 5: Events Belonging to a Particular Organizer
-- Purpose:
--   Fetches the full event portfolio managed by a selected organizer
--   (Demonstrated here for organizer_id = 1: 'Dr. Meenakshi Sundaram').
--   Shows event scheduling, total participation turnout, and theme.
-- Relational Concepts:
--   - Filtered join for coordinator dashboard.
--   - Aggregation of registrations per event for an organizer.
-- =====================================================================
SELECT 
    o.organizer_id,
    o.full_name AS organizer_name,
    o.club_or_dept,
    o.designation,
    e.event_id,
    e.event_name,
    e.event_date,
    e.start_time,
    e.end_time,
    e.venue,
    e.status AS event_status,
    COALESCE(ca.activity_name, 'Multi-Activity') AS primary_theme,
    COUNT(ptn.participation_id) AS registered_student_count
FROM organizers o
INNER JOIN events e 
    ON o.organizer_id = e.organizer_id
LEFT JOIN cultural_activities ca 
    ON e.activity_id = ca.activity_id
LEFT JOIN participation ptn 
    ON e.event_id = ptn.event_id
WHERE o.organizer_id = 1
GROUP BY 
    o.organizer_id, 
    o.full_name, 
    o.club_or_dept, 
    o.designation,
    e.event_id, 
    e.event_name, 
    e.event_date, 
    e.start_time, 
    e.end_time, 
    e.venue, 
    e.status, 
    ca.activity_name
ORDER BY e.event_date ASC;


-- =====================================================================
-- QUERY 6: Popular Events Ranked by Participation
-- Purpose:
--   Ranks events across the college by total student participation volume.
--   Uses SQL window functions to handle ties gracefully.
-- Relational Concepts:
--   - DENSE_RANK() window function based on registration counts.
--   - Multi-table join with organizers and participation.
-- =====================================================================
SELECT 
    e.event_id,
    e.event_name,
    e.event_date,
    e.venue,
    o.full_name AS organizer_name,
    o.club_or_dept,
    COUNT(ptn.participation_id) AS total_registrations,
    COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_participants,
    DENSE_RANK() OVER (ORDER BY COUNT(ptn.participation_id) DESC) AS popularity_rank
FROM events e
INNER JOIN organizers o 
    ON e.organizer_id = o.organizer_id
LEFT JOIN participation ptn 
    ON e.event_id = ptn.event_id
GROUP BY 
    e.event_id, 
    e.event_name, 
    e.event_date, 
    e.venue, 
    o.full_name, 
    o.club_or_dept
ORDER BY popularity_rank ASC, e.event_date ASC;


-- =====================================================================
-- QUERY 7: Participants Who Possess Skills Required by an Event
-- Purpose:
--   For a target event (Demonstrated here for event_id = 201), identifies all
--   students in the college database who possess at least one of the skills
--   officially requested in the event's requirements specification.
--   Displays their proficiency level, years of experience, and whether they
--   have already registered for the event.
-- Relational Concepts:
--   - 5-Table relational traversal: events -> event_requirements -> skills
--     -> participant_skills -> participants.
--   - LEFT JOIN with participation to indicate current enrollment status.
--   - Subquery or JOIN-based talent qualification.
-- =====================================================================
SELECT 
    er.event_id,
    e.event_name,
    s.skill_id,
    s.skill_name AS matching_required_skill,
    p.participant_id,
    p.full_name AS participant_name,
    p.college_id AS usn_or_roll,
    p.department,
    p.year_of_study,
    ps.proficiency_level,
    ps.years_of_experience,
    ps.portfolio_url,
    COALESCE(ptn.status, 'Not Registered') AS event_registration_status
FROM event_requirements er
INNER JOIN events e 
    ON er.event_id = e.event_id
INNER JOIN skills s 
    ON er.skill_id = s.skill_id
INNER JOIN participant_skills ps 
    ON s.skill_id = ps.skill_id
INNER JOIN participants p 
    ON ps.participant_id = p.participant_id
LEFT JOIN participation ptn 
    ON er.event_id = ptn.event_id 
   AND p.participant_id = ptn.participant_id
WHERE er.event_id = 201
ORDER BY 
    s.skill_name ASC,
    FIELD(ps.proficiency_level, 'Professional', 'Advanced', 'Intermediate', 'Beginner'),
    ps.years_of_experience DESC,
    p.full_name ASC;
