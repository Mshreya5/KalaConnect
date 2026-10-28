-- =====================================================================
-- KalaConnect — Stored Procedures
-- Purpose: Encapsulate complex business workflows (talent matching & registration)
-- Author: Member 2 (Teammate Scope)
-- =====================================================================

USE kalaconnect;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_match_available_talents_for_event$$

-- ---------------------------------------------------------------------
-- Procedure: sp_match_available_talents_for_event
-- Purpose:
-- Given an Event ID and a required Skill ID, finds all qualified participants
-- who:
-- 1. Possess the requested skill.
-- 2. Have declared availability or have NO 'Busy' conflict during the event time.
-- 3. Are not already booked in another event during that time.
-- Returns candidate rankings based on proficiency and experience.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_match_available_talents_for_event(
    IN p_event_id INT,
    IN p_skill_id INT
)
BEGIN
    DECLARE v_event_date DATE;
    DECLARE v_start_time TIME;
    DECLARE v_end_time TIME;

    -- Retrieve event schedule details
    SELECT event_date, start_time, end_time
    INTO v_event_date, v_start_time, v_end_time
    FROM events
    WHERE event_id = p_event_id;

    -- Return matched, conflict-free talent candidates
    SELECT 
        p.participant_id,
        p.full_name,
        p.email,
        p.department,
        p.year_of_study,
        s.skill_name,
        ps.proficiency_level,
        ps.years_of_experience,
        ps.portfolio_url,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM availability a 
                WHERE a.participant_id = p.participant_id 
                  AND a.available_date = v_event_date 
                  AND a.status = 'Available'
                  AND a.start_time <= v_start_time 
                  AND a.end_time >= v_end_time
            ) THEN 'Explicitly Available'
            ELSE 'No Known Conflict'
        END AS scheduling_match_quality
    FROM participants p
    JOIN participant_skills ps ON p.participant_id = ps.participant_id
    JOIN skills s ON ps.skill_id = s.skill_id
    WHERE ps.skill_id = p_skill_id
      -- Filter out participants with a 'Busy' slot during event hours
      AND NOT EXISTS (
          SELECT 1 FROM availability a
          WHERE a.participant_id = p.participant_id
            AND a.available_date = v_event_date
            AND a.status = 'Busy'
            AND a.start_time < v_end_time
            AND a.end_time > v_start_time
      )
      -- Filter out participants already confirmed in another simultaneous event
      AND NOT EXISTS (
          SELECT 1 FROM participation ptn
          JOIN events e ON ptn.event_id = e.event_id
          WHERE ptn.participant_id = p.participant_id
            AND ptn.status = 'Confirmed'
            AND e.event_id <> p_event_id
            AND e.event_date = v_event_date
            AND e.start_time < v_end_time
            AND e.end_time > v_start_time
      )
    ORDER BY 
        FIELD(ps.proficiency_level, 'Professional', 'Advanced', 'Intermediate', 'Beginner'),
        ps.years_of_experience DESC;

END$$


DROP PROCEDURE IF EXISTS sp_register_event_participation$$

-- ---------------------------------------------------------------------
-- Procedure: sp_register_event_participation
-- Purpose:
-- Safely registers a student for an event with transaction control (COMMIT/ROLLBACK)
-- and returns a user-friendly status message.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_register_event_participation(
    IN p_participant_id INT,
    IN p_event_id INT,
    IN p_role VARCHAR(50),
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
BEGIN
    -- Declare exit handler for SQL exceptions (rollback on error)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = -1;
        SET p_status_message = 'Registration failed due to a database error or trigger conflict.';
    END;

    START TRANSACTION;

    -- Check if already registered
    IF EXISTS (
        SELECT 1 FROM participation 
        WHERE participant_id = p_participant_id AND event_id = p_event_id
    ) THEN
        SET p_status_code = 0;
        SET p_status_message = 'Participant is already registered for this event.';
        ROLLBACK;
    ELSE
        INSERT INTO participation (participant_id, event_id, role, status)
        VALUES (p_participant_id, p_event_id, p_role, 'Registered');

        COMMIT;
        SET p_status_code = 1;
        SET p_status_message = 'Participation successfully registered!';
    END IF;

END$$

DELIMITER ;

-- =====================================================================
-- PROCEDURE DEMONSTRATION & CALL EXAMPLES:
-- =====================================================================
/*
-- 1. Match available Hindustani vocalists (Skill ID 105) for Classical Night (Event ID 201):
CALL sp_match_available_talents_for_event(201, 105);

-- 2. Safely register Participant 7 for Event 203:
CALL sp_register_event_participation(7, 203, 'Hip-Hop Dancer', @code, @msg);
SELECT @code AS status_code, @msg AS message;
*/
