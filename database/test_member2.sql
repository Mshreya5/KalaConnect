-- =====================================================================
-- KalaConnect — Member 2 Comprehensive Test Suite
-- Target Database: kalaconnect
-- Scope: Stored Procedure, Triggers, Conflict Detection & Event Coordination
-- Author: Member 2
-- =====================================================================

USE kalaconnect;

-- =====================================================================
-- TEST SUITE OVERVIEW:
-- This script validates the 6 core functional requirements for Member 2:
--   Test 1: An event with matching available participants.
--   Test 2: An event with no matching participants for required skills.
--   Test 3: An event with unfulfilled requirements (deficit calculation).
--   Test 4: A participant unavailable during the event ('Busy' slot rejection).
--   Test 5: A participant already confirmed for a conflicting simultaneous event.
--   Test 6: An invalid event ID error handling.
-- =====================================================================


-- =====================================================================
-- TEST 1: An Event with Matching Participants
-- Objective:
--   Validate that `sp_match_available_talents_for_event` correctly resolves
--   all required skills for an event, identifies qualified participants,
--   and verifies their free availability window.
-- Target: Event 201 ('Sur Sangam: Annual Classical Music Night', 2026-11-15, 17:30 - 21:00)
-- Required Skills: 
--   - Skill 105: Hindustani Classical Vocal (Target: 2)
--   - Skill 106: Tabla (Target: 2)
-- Expected Result:
--   Returns 2 matching records:
--   1. Participant 1 (Aarav Sharma) -> Hindustani Classical Vocal (Advanced, 8.5 yrs), 'Explicitly Available'
--   2. Participant 5 (Vikram Nair) -> Tabla (Advanced, 7.0 yrs), 'Explicitly Available'
-- =====================================================================
SELECT '>>> RUNNING TEST 1: Event with Matching Available Participants (Event 201) <<<' AS Test_Banner;

CALL sp_match_available_talents_for_event(201);


-- =====================================================================
-- TEST 2: An Event with No Matching Participants
-- Objective:
--   Validate that calling `sp_match_available_talents_for_event` on an event
--   requiring skills that no student in the database currently possesses
--   returns an empty result set without crashing.
-- Test Fixture:
--   Create a temporary test event (ID: 291) requiring Skill 104
--   ('Carnatic Classical Vocal' - no student in sample_data.sql has this skill).
-- Expected Result:
--   Returns an empty result set (0 rows matched), indicating no matching talent.
-- =====================================================================
SELECT '>>> RUNNING TEST 2: Event with No Matching Talent (Event 291 requiring Skill 104) <<<' AS Test_Banner;

-- Insert temporary fixture
INSERT INTO events (event_id, organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description)
VALUES (291, 1, 2, 'Carnatic Solo Recital [TEST]', '2026-12-01', '10:00:00', '13:00:00', 'Auditorium B', 'Scheduled', 'Testing zero-talent match scenario')
ON DUPLICATE KEY UPDATE event_name = VALUES(event_name);

INSERT INTO event_requirements (requirement_id, event_id, skill_id, required_count, notes)
VALUES (391, 291, 104, 2, 'Need 2 Carnatic classical vocalists')
ON DUPLICATE KEY UPDATE required_count = VALUES(required_count);

-- Execute procedure for Test 2
CALL sp_match_available_talents_for_event(291);

-- Clean up test fixture
DELETE FROM event_requirements WHERE requirement_id = 391;
DELETE FROM events WHERE event_id = 291;


-- =====================================================================
-- TEST 3: An Event with Unfulfilled Requirements (Deficit Analysis)
-- Objective:
--   Validate the deficit calculation for understaffed events where confirmed
--   headcount is less than the required count.
-- Target: Event 202 ('Awaaz: Inter-College Street Play Fest', 2026-11-18)
--   Requires: 8 Street Play actors (Skill 109).
--   Currently Confirmed: 1 (Participant 3: Rohan Verma).
-- Expected Result:
--   - Target Count: 8
--   - Confirmed Count: 1
--   - Deficit Headcount: 7 (8 - 1 = 7 unfilled slots)
-- =====================================================================
SELECT '>>> RUNNING TEST 3: Event with Unfulfilled Requirements (Deficit Analysis) <<<' AS Test_Banner;

SELECT 
    e.event_id,
    e.event_name,
    s.skill_name AS required_skill,
    er.required_count AS target_count,
    COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_count,
    (er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS deficit_headcount,
    CASE 
        WHEN (er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) > 0 THEN 'UNFULFILLED / ACTION REQUIRED'
        ELSE 'FULLY STAFFED'
    END AS fulfillment_status
FROM event_requirements er
INNER JOIN events e ON er.event_id = e.event_id
INNER JOIN skills s ON er.skill_id = s.skill_id
LEFT JOIN participation ptn ON e.event_id = ptn.event_id
LEFT JOIN participant_skills ps ON ptn.participant_id = ps.participant_id AND ps.skill_id = s.skill_id
WHERE e.event_id = 202
GROUP BY e.event_id, e.event_name, s.skill_name, er.required_count;


-- =====================================================================
-- TEST 4: A Participant Unavailable During the Event ('Busy' Schedule)
-- Objective:
--   Validate that:
--   1. `sp_match_available_talents_for_event` filters out any student who has
--      declared a 'Busy' slot during the event hours.
--   2. Direct attempt to register a 'Busy' student triggers an abort via
--      `trg_validate_participant_availability_before_booking`.
-- Test Scenario:
--   Participant 1 (Aarav Sharma) is marked 'Busy' on 2026-11-18 between
--   10:00:00 and 13:00:00 (Availability ID: 408).
--   Event 202 is on 2026-11-18 from 10:00:00 to 14:00:00.
-- Expected Result:
--   - Participant 1 is NOT matched for any requirement overlapping this window.
--   - An INSERT into participation will FAIL with SQLSTATE 45000:
--     "Cannot register participant: Participant is marked as Busy in availability for this date and time."
-- =====================================================================
SELECT '>>> RUNNING TEST 4: Attempting to Register a Busy Participant (Should be rejected) <<<' AS Test_Banner;

-- Verify Participant 1's Busy slot
SELECT participant_id, available_date, start_time, end_time, status 
FROM availability 
WHERE participant_id = 1 AND available_date = '2026-11-18';

-- Attempt insertion (Uncommenting this block in MySQL Workbench will produce expected error)
/*
INSERT INTO participation (participant_id, event_id, role, status)
VALUES (1, 202, 'Supporting Actor', 'Registered');
-- Expected: Error Code 1644 (SQLSTATE 45000): Cannot register participant: Participant is marked as Busy...
*/

-- Safe execution via sp_register_event_participation:
CALL sp_register_event_participation(1, 202, 'Supporting Actor', @p4_code, @p4_msg);
SELECT @p4_code AS status_code, @p4_msg AS status_message;
-- Expected output: status_code = 0 or -1, indicating registration rejected.


-- =====================================================================
-- TEST 5: A Participant Already Confirmed for a Conflicting Event
-- Objective:
--   Validate double-booking prevention: A student who is already 'Confirmed'
--   for Event A cannot be booked into simultaneous Event B.
-- Test Scenario:
--   Participant 1 is already 'Confirmed' for Event 201 on 2026-11-15 (17:30 - 21:00).
--   We create a conflicting simultaneous Event 292 on 2026-11-15 (18:00 - 20:00).
-- Expected Result:
--   - `sp_match_available_talents_for_event(292)` will EXCLUDE Participant 1.
--   - Attempted registration will FAIL with SQLSTATE 45000:
--     "Cannot register participant: Double-booking detected! Participant is already confirmed for another event at this time."
-- =====================================================================
SELECT '>>> RUNNING TEST 5: Double-Booking Prevention across Simultaneous Events <<<' AS Test_Banner;

-- Create simultaneous event fixture
INSERT INTO events (event_id, organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description)
VALUES (292, 2, 2, 'Fusion Classical Jam [TEST]', '2026-11-15', '18:00:00', '20:00:00', 'Music Room 1', 'Scheduled', 'Simultaneous event for conflict test')
ON DUPLICATE KEY UPDATE event_name = VALUES(event_name);

INSERT INTO event_requirements (requirement_id, event_id, skill_id, required_count, notes)
VALUES (392, 292, 105, 1, 'Need 1 Hindustani Vocalist')
ON DUPLICATE KEY UPDATE required_count = VALUES(required_count);

-- Execute procedure for Test 5: Notice Participant 1 is NOT returned because of the conflict!
CALL sp_match_available_talents_for_event(292);

-- Test registration rejection via sp_register_event_participation
CALL sp_register_event_participation(1, 292, 'Guest Vocalist', @p5_code, @p5_msg);
SELECT @p5_code AS status_code, @p5_msg AS status_message;
-- Expected: status_code = -1, status_message indicating trigger conflict / double-booking prevented.

-- Clean up test fixture
DELETE FROM event_requirements WHERE requirement_id = 392;
DELETE FROM events WHERE event_id = 292;


-- =====================================================================
-- TEST 6: Invalid Event ID
-- Objective:
--   Validate that `sp_match_available_talents_for_event` rejects invalid
--   or non-existent event IDs by raising an explicit error with SQLSTATE 45000.
-- Target: Event ID = 9999 (Non-existent).
-- Expected Result:
--   Procedure terminates with error:
--   Error Code: 1644. SQLSTATE: 45000: Invalid Event ID: The specified event does not exist in the database.
-- =====================================================================
SELECT '>>> RUNNING TEST 6: Invalid Event ID Error Handling (Event 9999) <<<' AS Test_Banner;

/*
CALL sp_match_available_talents_for_event(9999);
-- Expected Output: Error 1644 (45000): Invalid Event ID: The specified event does not exist in the database.
*/

SELECT 'Test Suite Member 2 execution instructions: Uncomment the signaled error tests in Workbench or CLI to view explicit SQLSTATE 45000 exceptions.' AS Complete_Notice;
