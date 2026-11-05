-- =====================================================================
-- KalaConnect — Member 1 SQL Queries (UPDATED — 8 Queries)
-- Focus: Participants, Cultural Activities, Skills, Participant Skills, Availability
-- Author: Member 1
-- =====================================================================

USE kalaconnect;

-- ---------------------------------------------------------------------
-- Q1: Full Profile for a Specific Participant
-- Used when opening a student's profile page.
-- Change: participant_id = 1 to any valid ID
-- ---------------------------------------------------------------------
SELECT
    participant_id,
    full_name,
    email,
    phone,
    college_id AS usn_or_roll,
    department,
    year_of_study,
    bio,
    created_at
FROM participants
WHERE participant_id = 1;


-- ---------------------------------------------------------------------
-- Q2: Find Participants by Skill Name with Minimum Proficiency
-- Example: All 'Bharatanatyam' dancers at Intermediate level or above.
-- Demonstrates: INNER JOIN across 3 tables, IN filter, ORDER BY
-- ---------------------------------------------------------------------
SELECT
    p.participant_id,
    p.full_name,
    p.department,
    p.year_of_study,
    s.skill_name,
    ps.proficiency_level,
    ps.years_of_experience,
    ps.portfolio_url
FROM participants p
JOIN participant_skills ps ON p.participant_id = ps.participant_id
JOIN skills s ON ps.skill_id = s.skill_id
WHERE s.skill_name = 'Bharatanatyam'
  AND ps.proficiency_level IN ('Intermediate', 'Advanced', 'Professional')
ORDER BY ps.years_of_experience DESC;


-- ---------------------------------------------------------------------
-- Q3: Filter Participants by Proficiency Level
-- Example: All 'Professional' level artists across all skills.
-- Demonstrates: JOIN, WHERE on ENUM column
-- ---------------------------------------------------------------------
SELECT
    p.full_name,
    p.department,
    s.skill_name,
    ca.activity_name,
    ca.category,
    ps.proficiency_level,
    ps.years_of_experience
FROM participants p
JOIN participant_skills ps ON p.participant_id = ps.participant_id
JOIN skills s ON ps.skill_id = s.skill_id
JOIN cultural_activities ca ON s.activity_id = ca.activity_id
WHERE ps.proficiency_level = 'Professional'
ORDER BY ps.years_of_experience DESC;


-- ---------------------------------------------------------------------
-- Q4: Filter Participants by Cultural Activity / Category
-- Example: All artists in 'Performing Arts' category.
-- Demonstrates: 4-way JOIN, WHERE on category
-- ---------------------------------------------------------------------
SELECT
    ca.category AS activity_domain,
    ca.activity_name,
    s.skill_name,
    p.full_name AS artist_name,
    p.college_id,
    ps.proficiency_level,
    ps.years_of_experience
FROM cultural_activities ca
JOIN skills s ON ca.activity_id = s.activity_id
JOIN participant_skills ps ON s.skill_id = ps.skill_id
JOIN participants p ON ps.participant_id = p.participant_id
WHERE ca.category = 'Performing Arts'
ORDER BY ca.activity_name, s.skill_name, p.full_name;


-- ---------------------------------------------------------------------
-- Q5: Participant Skill Summary (per participant)
-- Shows each participant's total skills, activities, and max proficiency.
-- Demonstrates: GROUP BY, COUNT, GROUP_CONCAT, aggregate functions
-- ---------------------------------------------------------------------
SELECT
    p.participant_id,
    p.full_name,
    p.department,
    COUNT(DISTINCT ps.skill_id)      AS total_skills,
    COUNT(DISTINCT s.activity_id)    AS distinct_activities,
    GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ') AS skills_list,
    MAX(ps.years_of_experience)      AS max_experience_years
FROM participants p
JOIN participant_skills ps ON p.participant_id = ps.participant_id
JOIN skills s ON ps.skill_id = s.skill_id
GROUP BY p.participant_id, p.full_name, p.department
ORDER BY total_skills DESC;


-- ---------------------------------------------------------------------
-- Q6: Count of Registered Artists per Cultural Activity / Category
-- Demonstrates: LEFT JOIN, COUNT(DISTINCT), GROUP BY, ORDER BY
-- ---------------------------------------------------------------------
SELECT
    ca.activity_id,
    ca.activity_name,
    ca.category,
    COUNT(DISTINCT ps.participant_id) AS total_enrolled_artists,
    COUNT(DISTINCT s.skill_id)        AS total_skills_offered
FROM cultural_activities ca
LEFT JOIN skills s ON ca.activity_id = s.activity_id
LEFT JOIN participant_skills ps ON s.skill_id = ps.skill_id
GROUP BY ca.activity_id, ca.activity_name, ca.category
ORDER BY total_enrolled_artists DESC;


-- ---------------------------------------------------------------------
-- Q7: Find Available Participants for a Given Date and Time Interval
-- Example: Who is 'Available' on 2026-11-15 covering 17:30–21:00?
-- Demonstrates: JOIN, WHERE with date/time range, NOT EXISTS subquery
-- Change the date and times to match your event.
-- ---------------------------------------------------------------------
SELECT
    p.participant_id,
    p.full_name,
    p.email,
    p.phone,
    a.available_date,
    a.start_time,
    a.end_time,
    a.status
FROM participants p
JOIN availability a ON p.participant_id = a.participant_id
WHERE a.available_date = '2026-11-15'
  AND a.status = 'Available'
  AND a.start_time <= '17:30:00'
  AND a.end_time   >= '21:00:00'
ORDER BY p.full_name;


-- ---------------------------------------------------------------------
-- Q8: Detect Overlapping Availability Slots for the Same Participant
-- Finds any two slots for the same participant on the same date that overlap.
-- Overlap rule: existing_start < new_end AND existing_end > new_start
-- Adjacent slots (end == start) are NOT considered overlapping.
-- Demonstrates: Self-JOIN, overlap arithmetic, WHERE a1.id < a2.id avoids duplicates
-- ---------------------------------------------------------------------
SELECT
    a1.participant_id,
    p.full_name,
    a1.availability_id  AS slot1_id,
    a1.start_time       AS slot1_start,
    a1.end_time         AS slot1_end,
    a2.availability_id  AS slot2_id,
    a2.start_time       AS slot2_start,
    a2.end_time         AS slot2_end,
    a1.available_date
FROM availability a1
JOIN availability a2
    ON  a1.participant_id  = a2.participant_id
    AND a1.available_date  = a2.available_date
    AND a1.availability_id < a2.availability_id   -- avoid duplicate pairs
    AND a1.start_time      < a2.end_time           -- overlap condition
    AND a1.end_time        > a2.start_time         -- overlap condition
JOIN participants p ON a1.participant_id = p.participant_id
ORDER BY a1.participant_id, a1.available_date;
