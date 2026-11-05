DELIMITER $$

DROP TRIGGER IF EXISTS trg_validate_availability_before_insert$$

CREATE TRIGGER trg_validate_availability_before_insert
BEFORE INSERT ON availability
FOR EACH ROW
BEGIN
    DECLARE v_overlap_count INT DEFAULT 0;

    IF NEW.start_time >= NEW.end_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid slot: start_time must be before end_time.';
    END IF;

    SELECT COUNT(*) INTO v_overlap_count
    FROM availability
    WHERE participant_id = NEW.participant_id
      AND available_date = NEW.available_date
      AND start_time     < NEW.end_time
      AND end_time       > NEW.start_time;

    IF v_overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Overlapping slot: participant already has a slot that overlaps on this date.';
    END IF;
END$$


DROP TRIGGER IF EXISTS trg_validate_availability_before_update$$

CREATE TRIGGER trg_validate_availability_before_update
BEFORE UPDATE ON availability
FOR EACH ROW
BEGIN
    DECLARE v_overlap_count INT DEFAULT 0;

    IF NEW.start_time >= NEW.end_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid slot: start_time must be before end_time.';
    END IF;

    SELECT COUNT(*) INTO v_overlap_count
    FROM availability
    WHERE participant_id  = NEW.participant_id
      AND available_date  = NEW.available_date
      AND availability_id <> OLD.availability_id
      AND start_time      < NEW.end_time
      AND end_time        > NEW.start_time;

    IF v_overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Overlapping slot: updating this slot would conflict with an existing slot.';
    END IF;
END$$


DROP TRIGGER IF EXISTS trg_validate_participant_availability_before_booking$$

CREATE TRIGGER trg_validate_participant_availability_before_booking
BEFORE INSERT ON participation
FOR EACH ROW
BEGIN
    DECLARE v_event_date  DATE;
    DECLARE v_start_time  TIME;
    DECLARE v_end_time    TIME;
    DECLARE v_busy_count  INT DEFAULT 0;
    DECLARE v_clash_count INT DEFAULT 0;

    SELECT event_date, start_time, end_time
    INTO v_event_date, v_start_time, v_end_time
    FROM events WHERE event_id = NEW.event_id;

    SELECT COUNT(*) INTO v_busy_count
    FROM availability
    WHERE participant_id = NEW.participant_id
      AND available_date = v_event_date
      AND status         = 'Busy'
      AND start_time     < v_end_time
      AND end_time       > v_start_time;

    IF v_busy_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot register: participant is marked Busy at this time.';
    END IF;

    SELECT COUNT(*) INTO v_clash_count
    FROM participation ptn
    JOIN events e ON ptn.event_id = e.event_id
    WHERE ptn.participant_id = NEW.participant_id
      AND ptn.status         = 'Confirmed'
      AND e.event_id        <> NEW.event_id
      AND e.event_date       = v_event_date
      AND e.start_time       < v_end_time
      AND e.end_time         > v_start_time;

    IF v_clash_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot register: participant is already confirmed for another event at this time.';
    END IF;
END$$

DELIMITER ;
