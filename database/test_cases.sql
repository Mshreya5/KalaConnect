-- =====================================================================
-- KalaConnect — Trigger Test Cases (Member 1: Availability Triggers)
-- Run AFTER: schema.sql, sample_data.sql, trigger.sql
-- Tool: MySQL Workbench — run each block individually
-- =====================================================================
-- IMPORTANT: Tests marked [SHOULD FAIL] are intentionally designed to
-- raise SIGNAL errors. They are NOT bugs. Run them to verify the trigger
-- fires correctly. Tests marked [SHOULD SUCCEED] must insert cleanly.
-- =====================================================================

USE kalaconnect;

-- =====================================================================
-- SETUP: Verify triggers exist before running tests
-- =====================================================================
SHOW TRIGGERS FROM kalaconnect;
-- Expected: trg_validate_availability_before_insert
--           trg_validate_availability_before_update
--           trg_validate_participant_availability_before_booking


-- =====================================================================
-- TEST 1 [SHOULD SUCCEED]: Valid non-overlapping slot for participant 4
-- Participant 4 has one slot on 2026-11-15 (10:00-14:00, Busy).
-- New slot is on a different date — no conflict possible.
-- Expected: INSERT succeeds, 1 row added.
-- =====================================================================
INSERT INTO availability (participant_id, available_date, start_time, end_time, status)
VALUES (4, '2026-12-01', '09:00:00', '12:00:00', 'Available');

SELECT * FROM availability WHERE participant_id = 4 ORDER BY available_date;


-- =====================================================================
-- TEST 2 [SHOULD FAIL]: start_time >= end_time (invalid period)
-- Trigger Rule 1: start_time must be strictly before end_time.
-- Expected: ERROR 1644 — "Invalid availability slot: start_time must be before end_time."
-- =====================================================================
INSERT INTO availability (participant_id, available_date, start_time, end_time, status)
VALUES (1, '2026-12-05', '14:00:00', '10:00:00', 'Available');


-- =====================================================================
-- TEST 3 [SHOULD FAIL]: start_time == end_time (zero-length slot)
-- Expected: ERROR 1644 — "Invalid availability slot: start_time must be before end_time."
-- =====================================================================
INSERT INTO availability (participant_id, available_date, start_time, end_time, status)
VALUES (1, '2026-12-05', '10:00:00', '10:00:00', 'Available');


-- =====================================================================
-- TEST 4 [SHOULD FAIL]: Overlapping slot for participant 1 on 2026-11-15
-- Participant 1 already has slot 401: 16:00-22:00 on 2026-11-15.
-- New slot 17:00-19:00 is fully inside that range — overlap detected.
-- Expected: ERROR 1644 — "Overlapping availability slot..."
-- =====================================================================
INSERT INTO availability (participant_id, available_date, start_time, end_time, status)
VALUES (1, '2026-11-15', '17:00:00', '19:00:00', 'Busy');


-- =====================================================================
-- TEST 5 [SHOULD SUCCEED]: Adjacent slot (no overlap) for participant 1
-- Existing slot 408: 10:00-13:00 on 2026-11-18.
-- New slot starts exactly at 13:00 — adjacent, NOT overlapping.
-- Overlap rule: existing_end > NEW.start_time => 13:00 > 13:00 is FALSE.
-- Expected: INSERT succeeds.
-- =====================================================================
INSERT INTO availability (participant_id, available_date, start_time, end_time, status)
VALUES (1, '2026-11-18', '13:00:00', '17:00:00', 'Available');

SELECT * FROM availability WHERE participant_id = 1 AND available_date = '2026-11-18' ORDER BY start_time;


-- =====================================================================
-- TEST 6 [SHOULD FAIL]: UPDATE that creates an overlap
-- Participant 1 on 2026-11-18 now has: 10:00-13:00 (Busy) and 13:00-17:00 (Available).
-- Extending the first slot end_time to 14:00 would overlap with 13:00-17:00.
-- Expected: ERROR 1644 — "Overlapping availability slot: updating this slot..."
-- Step 1: find the ID
-- =====================================================================
SELECT availability_id, start_time, end_time
FROM availability
WHERE participant_id = 1 AND available_date = '2026-11-18' AND start_time = '10:00:00';

-- Step 2: run this (replace 408 with the actual ID if different):
UPDATE availability SET end_time = '14:00:00' WHERE availability_id = 408;


-- =====================================================================
-- TEST 7 [SHOULD SUCCEED]: UPDATE that does NOT create an overlap
-- Shrink the Busy slot from 10:00-13:00 to 10:00-12:00 — no conflict.
-- Expected: UPDATE succeeds.
-- =====================================================================
UPDATE availability SET end_time = '12:00:00' WHERE availability_id = 408;

SELECT * FROM availability WHERE participant_id = 1 AND available_date = '2026-11-18' ORDER BY start_time;


-- =====================================================================
-- CLEANUP: Remove rows inserted by TEST 1 and TEST 5, restore TEST 7
-- =====================================================================
DELETE FROM availability WHERE participant_id = 4 AND available_date = '2026-12-01';
DELETE FROM availability WHERE participant_id = 1 AND available_date = '2026-11-18' AND start_time = '13:00:00';
UPDATE availability SET end_time = '13:00:00' WHERE availability_id = 408;

SELECT * FROM availability ORDER BY participant_id, available_date, start_time;
