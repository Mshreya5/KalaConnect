-- =====================================================================
-- KalaConnect — Member 1 SQL Queries
-- Focus Scope: Participant Management, Cultural Activities, Skills,
--              Participant Skills (M:N), and Availability.
-- Author: Member 1
-- =====================================================================

USE kalaconnect;

-- ---------------------------------------------------------------------
-- Q1: Fetch Complete Profile for a Specific Participant (Basic Selection)
-- Used when opening a student's profile page.
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
-- Q2: Find All Participants Possessing a Specific Skill with Minimum Proficiency
-- Example: Search for all 'Bharatanatyam' dancers who are 'Intermediate' or above.
-- Concept: Inner Join between participants, participant_skills, and skills.
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
-- Q3: Detailed Talent Catalog (Multi-Table 4-Way JOIN)
-- Displays participants alongside their skills and high-level cultural activities.
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
ORDER BY ca.category, ca.activity_name, s.skill_name, p.full_name;


-- ---------------------------------------------------------------------
-- Q4: Check Participant Availability for an Upcoming Event Date & Time Slot
-- Identifies whether an artist is 'Available', 'Busy', or has not declared availability.
-- ---------------------------------------------------------------------
SELECT 
    p.participant_id,
    p.full_name,
    p.phone,
    a.available_date,
    a.start_time,
    a.end_time,
    COALESCE(a.status, 'Not Declared') AS availability_status
FROM participants p
LEFT JOIN availability a 
    ON p.participant_id = a.participant_id
    AND a.available_date = '2026-11-15'
    AND a.start_time <= '17:30:00' 
    AND a.end_time >= '21:00:00'
ORDER BY availability_status ASC, p.full_name ASC;


-- ---------------------------------------------------------------------
-- Q5: Aggregation: Count of Registered Artists per Cultural Activity Domain
-- Concept: GROUP BY with COUNT(DISTINCT) to prevent duplicate counts when
--          a participant has multiple skills under the same activity.
-- ---------------------------------------------------------------------
SELECT 
    ca.activity_id,
    ca.activity_name,
    ca.category,
    COUNT(DISTINCT ps.participant_id) AS total_enrolled_artists,
    COUNT(DISTINCT s.skill_id) AS total_skills_offered
FROM cultural_activities ca
LEFT JOIN skills s ON ca.activity_id = s.activity_id
LEFT JOIN participant_skills ps ON s.skill_id = ps.skill_id
GROUP BY ca.activity_id, ca.activity_name, ca.category
ORDER BY total_enrolled_artists DESC;


-- ---------------------------------------------------------------------
-- Q6: Identify "Cross-Disciplinary / Versatile" Artists (Nested Query / HAVING)
-- Finds students who possess skills across 2 or more distinct cultural activities
-- (e.g., a student who does both Dance and Music).
-- ---------------------------------------------------------------------
SELECT 
    p.participant_id,
    p.full_name,
    p.department,
    COUNT(DISTINCT s.activity_id) AS distinct_activities_count,
    GROUP_CONCAT(DISTINCT ca.activity_name ORDER BY ca.activity_name SEPARATOR ' | ') AS activities_involved
FROM participants p
JOIN participant_skills ps ON p.participant_id = ps.participant_id
JOIN skills s ON ps.skill_id = s.skill_id
JOIN cultural_activities ca ON s.activity_id = ca.activity_id
GROUP BY p.participant_id, p.full_name, p.department
HAVING COUNT(DISTINCT s.activity_id) >= 2;


-- ---------------------------------------------------------------------
-- Q7: Find Free Qualified Artists for an Event (Correlated Subquery / NOT EXISTS)
-- Finds artists who have a skill (e.g., skill_id = 105 Hindustani Vocal)
-- and have NO conflicting 'Busy' availability entry on that date.
-- ---------------------------------------------------------------------
SELECT 
    p.participant_id,
    p.full_name,
    p.email,
    ps.proficiency_level,
    ps.years_of_experience
FROM participants p
JOIN participant_skills ps ON p.participant_id = ps.participant_id
WHERE ps.skill_id = 105
  AND NOT EXISTS (
      SELECT 1 
      FROM availability a
      WHERE a.participant_id = p.participant_id
        AND a.available_date = '2026-11-15'
        AND a.status = 'Busy'
        AND a.start_time < '21:00:00'
        AND a.end_time > '17:30:00'
  );
