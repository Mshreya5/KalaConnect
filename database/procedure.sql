-- =====================================================================
-- KalaConnect — Stored Procedures
-- Purpose: Encapsulate complex business workflows:
--          1. Automated talent matching for events (sp_match_available_talents_for_event)
--          2. Transactional participant registration with skill validation (sp_register_event_participation)
-- Author: Member 2
-- Database: MySQL 8.0+ / kalaconnect
-- =====================================================================

USE kalaconnect;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_match_available_talents_for_event$$

-- ---------------------------------------------------------------------
-- Procedure: sp_match_available_talents_for_event
-- Purpose:
--   Given an Event ID:
--   1. Validates that the event exists; raises an error if invalid.
--   2. Retrieves the event's schedule (date, start time, end time).
--   3. Identifies all skills required by the event from event_requirements.
--   4. Finds all students who possess those matching skills.
--   5. Checks their availability on the event date/time window:
--      - Excludes students marked 'Busy' during any part of the event.
--      - Identifies if student is 'Explicitly Available' or has 'No Declared Conflict'.
--   6. Excludes students already 'Confirmed' for another simultaneous event.
--   7. Returns participant ID, full name, email, department, matching skill,
--      proficiency level, years of experience, and availability details.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_match_available_talents_for_event(
    IN p_event_id INT
)
BEGIN
    DECLARE v_event_exists INT DEFAULT 0;
    DECLARE v_event_date DATE;
    DECLARE v_start_time TIME;
    DECLARE v_end_time TIME;
    DECLARE v_req_count INT DEFAULT 0;

    -- Check if target event exists and retrieve schedule
    SELECT COUNT(*), MAX(event_date), MAX(start_time), MAX(end_time)
    INTO v_event_exists, v_event_date, v_start_time, v_end_time
    FROM events
    WHERE event_id = p_event_id;

    -- Validate event existence
    IF v_event_exists = 0 OR v_event_date IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid Event ID: The specified event does not exist in the database.';
    END IF;

    -- Check if event has defined requirements
    SELECT COUNT(*)
    INTO v_req_count
    FROM event_requirements
    WHERE event_id = p_event_id;

    -- Return matched, qualified, conflict-free participants
    SELECT 
        p.participant_id,
        p.full_name AS participant_name,
        p.email AS participant_email,
        p.college_id AS usn_or_roll,
        p.department,
        p.year_of_study,
        s.skill_id,
        s.skill_name AS matching_skill,
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
            ELSE 'Available (No Declared Conflict)'
        END AS availability_status,
        COALESCE(ptn.status, 'Not Registered') AS current_event_status
    FROM event_requirements er
    INNER JOIN skills s 
        ON er.skill_id = s.skill_id
    INNER JOIN participant_skills ps 
        ON s.skill_id = ps.skill_id
    INNER JOIN participants p 
        ON ps.participant_id = p.participant_id
    LEFT JOIN participation ptn 
        ON ptn.event_id = p_event_id 
       AND ptn.participant_id = p.participant_id
    WHERE er.event_id = p_event_id
      -- Condition 1: Exclude participants marked 'Busy' during the event window
      AND NOT EXISTS (
          SELECT 1 FROM availability a
          WHERE a.participant_id = p.participant_id
            AND a.available_date = v_event_date
            AND a.status = 'Busy'
            AND a.start_time < v_end_time
            AND a.end_time > v_start_time
      )
      -- Condition 2: Exclude participants confirmed in another simultaneous event
      AND NOT EXISTS (
          SELECT 1 FROM participation other_ptn
          INNER JOIN events other_e 
              ON other_ptn.event_id = other_e.event_id
          WHERE other_ptn.participant_id = p.participant_id
            AND other_ptn.status = 'Confirmed'
            AND other_e.event_id <> p_event_id
            AND other_e.event_date = v_event_date
            AND other_e.start_time < v_end_time
            AND other_e.end_time > v_start_time
      )
    ORDER BY 
        s.skill_name ASC,
        FIELD(ps.proficiency_level, 'Professional', 'Advanced', 'Intermediate', 'Beginner'),
        ps.years_of_experience DESC,
        p.full_name ASC;

END$$


DROP PROCEDURE IF EXISTS sp_register_event_participation$$

-- ---------------------------------------------------------------------
-- Procedure: sp_register_event_participation
-- Purpose:
--   Safely registers a student for an event using transactions.
--   Validates:
--   1. Event existence and active status.
--   2. Participant existence.
--   3. Prior registration prevention (no duplicates).
--   4. Validates that participant possesses at least one skill required by event.
--   5. Handles SQL exceptions cleanly by rolling back and returning status codes.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_register_event_participation(
    IN p_participant_id INT,
    IN p_event_id INT,
    IN p_role VARCHAR(50),
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
BEGIN
    DECLARE v_event_exists INT DEFAULT 0;
    DECLARE v_event_status VARCHAR(20);
    DECLARE v_participant_exists INT DEFAULT 0;
    DECLARE v_already_registered INT DEFAULT 0;
    DECLARE v_req_count INT DEFAULT 0;
    DECLARE v_skill_match INT DEFAULT 0;

    -- Exit handler for SQLEXCEPTION (Trigger violation, FK constraint, etc.)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = -1;
        SET p_status_message = 'Registration failed due to a database constraint or scheduling conflict.';
    END;

    START TRANSACTION;

    -- 1. Validate Event
    SELECT COUNT(*), MAX(status)
    INTO v_event_exists, v_event_status
    FROM events
    WHERE event_id = p_event_id;

    IF v_event_exists = 0 THEN
        SET p_status_code = 0;
        SET p_status_message = 'Event does not exist.';
        ROLLBACK;
    ELSEIF v_event_status = 'Cancelled' THEN
        SET p_status_code = 0;
        SET p_status_message = 'Cannot register: This event has been cancelled.';
        ROLLBACK;
    ELSE
        -- 2. Validate Participant
        SELECT COUNT(*)
        INTO v_participant_exists
        FROM participants
        WHERE participant_id = p_participant_id;

        IF v_participant_exists = 0 THEN
            SET p_status_code = 0;
            SET p_status_message = 'Participant does not exist.';
            ROLLBACK;
        ELSE
            -- 3. Check for existing registration
            SELECT COUNT(*)
            INTO v_already_registered
            FROM participation
            WHERE participant_id = p_participant_id AND event_id = p_event_id;

            IF v_already_registered > 0 THEN
                SET p_status_code = 0;
                SET p_status_message = 'Participant is already registered for this event.';
                ROLLBACK;
            ELSE
                -- 4. Validate event skill requirement match
                SELECT COUNT(*)
                INTO v_req_count
                FROM event_requirements
                WHERE event_id = p_event_id;

                IF v_req_count > 0 THEN
                    SELECT COUNT(*)
                    INTO v_skill_match
                    FROM event_requirements er
                    INNER JOIN participant_skills ps 
                        ON er.skill_id = ps.skill_id
                    WHERE er.event_id = p_event_id 
                      AND ps.participant_id = p_participant_id;

                    IF v_skill_match = 0 THEN
                        SET p_status_code = 0;
                        SET p_status_message = 'Participant does not possess any skill required for this event.';
                        ROLLBACK;
                    ELSE
                        -- Insert registration record (Trigger trg_validate_participant_availability_before_booking will fire)
                        INSERT INTO participation (participant_id, event_id, role, status)
                        VALUES (p_participant_id, p_event_id, COALESCE(p_role, 'Performer'), 'Registered');

                        COMMIT;
                        SET p_status_code = 1;
                        SET p_status_message = 'Participation successfully registered!';
                    END IF;
                ELSE
                    -- Event has no specific skill restrictions, proceed with registration
                    INSERT INTO participation (participant_id, event_id, role, status)
                    VALUES (p_participant_id, p_event_id, COALESCE(p_role, 'Performer'), 'Registered');

                    COMMIT;
                    SET p_status_code = 1;
                    SET p_status_message = 'Participation successfully registered!';
                END IF;
            END IF;
        END IF;
    END IF;

END$$

DELIMITER ;
