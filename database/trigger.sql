-- =====================================================================
-- KalaConnect — Database Trigger
-- Purpose: Enforce Business Rules & Prevent Scheduling Conflicts
-- Collaboration: Designed jointly by Member 1 (Availability) and Member 2 (Participation/Events)
-- =====================================================================

USE kalaconnect;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_validate_participant_availability_before_booking$$

-- ---------------------------------------------------------------------
-- Trigger: trg_validate_participant_availability_before_booking
-- Timing: BEFORE INSERT ON participation
-- Purpose: 
-- 1. Verifies that the participant does NOT have a 'Busy' status in their
--    availability calendar for the event's date and overlapping time window.
-- 2. Prevents double-booking a participant across two simultaneous events.
-- If a conflict is detected, it aborts the insert using SIGNAL SQLSTATE '45000'.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_validate_participant_availability_before_booking
BEFORE INSERT ON participation
FOR EACH ROW
BEGIN
    DECLARE v_event_date DATE;
    DECLARE v_start_time TIME;
    DECLARE v_end_time TIME;
    DECLARE v_busy_count INT DEFAULT 0;
    DECLARE v_clash_count INT DEFAULT 0;

    -- Fetch the target event's scheduled date and timings
    SELECT event_date, start_time, end_time
    INTO v_event_date, v_start_time, v_end_time
    FROM events
    WHERE event_id = NEW.event_id;

    -- Check 1: Has the participant marked themselves as 'Busy' during this slot?
    SELECT COUNT(*)
    INTO v_busy_count
    FROM availability
    WHERE participant_id = NEW.participant_id
      AND available_date = v_event_date
      AND status = 'Busy'
      AND start_time < v_end_time
      AND end_time > v_start_time;

    IF v_busy_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot register participant: Participant is marked as Busy in availability for this date and time.';
    END IF;

    -- Check 2: Is the participant already confirmed for another event during the same time?
    SELECT COUNT(*)
    INTO v_clash_count
    FROM participation ptn
    JOIN events e ON ptn.event_id = e.event_id
    WHERE ptn.participant_id = NEW.participant_id
      AND ptn.status = 'Confirmed'
      AND e.event_id <> NEW.event_id
      AND e.event_date = v_event_date
      AND e.start_time < v_end_time
      AND e.end_time > v_start_time;

    IF v_clash_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot register participant: Double-booking detected! Participant is already confirmed for another event at this time.';
    END IF;

END$$

DELIMITER ;

-- =====================================================================
-- TRIGGER VERIFICATION & DEMONSTRATION TESTS (Run after sample data is loaded)
-- =====================================================================
/*
-- TEST 1 (Should FAIL): Try inserting Participant 4 into Event 201 on 2026-11-15.
-- Notice Participant 4 is marked 'Busy' on 2026-11-15 from 10:00 to 14:00 (or if overlapping):
-- INSERT INTO participation (participant_id, event_id, role, status)
-- VALUES (4, 201, 'Debater', 'Registered');

-- TEST 2 (Should SUCCEED): Try inserting Participant 2 into an event where they are free:
-- INSERT INTO participation (participant_id, event_id, role, status)
-- VALUES (2, 202, 'Guest Performer', 'Registered');
*/
