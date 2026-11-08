const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const DB = process.env.DB_NAME || 'kalaconnect';

async function run() {
  const root = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('[Setup] Connected to MySQL.');
  await root.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\``);
  console.log(`[Setup] Database '${DB}' ready.`);
  await root.end();

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB,
    multipleStatements: true,
  });

  const dbDir = path.resolve(__dirname, '../database');

  const schema = fs.readFileSync(path.join(dbDir, 'schema.sql'), 'utf8');
  await conn.query(schema);
  console.log('[Setup] Schema created (9 tables).');

  const data = fs.readFileSync(path.join(dbDir, 'sample_data.sql'), 'utf8');
  await conn.query(data);
  console.log('[Setup] Sample data loaded.');

  await conn.query(`DROP TRIGGER IF EXISTS trg_validate_participant_availability_before_booking`);
  await conn.query(`
    CREATE TRIGGER trg_validate_participant_availability_before_booking
    BEFORE INSERT ON participation
    FOR EACH ROW
    BEGIN
      DECLARE v_event_date DATE;
      DECLARE v_start_time TIME;
      DECLARE v_end_time TIME;
      DECLARE v_busy_count INT DEFAULT 0;
      DECLARE v_clash_count INT DEFAULT 0;

      SELECT event_date, start_time, end_time
      INTO v_event_date, v_start_time, v_end_time
      FROM events WHERE event_id = NEW.event_id;

      SELECT COUNT(*) INTO v_busy_count
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

      SELECT COUNT(*) INTO v_clash_count
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
    END
  `);
  console.log('[Setup] Trigger deployed.');

  await conn.query(`DROP PROCEDURE IF EXISTS sp_match_available_talents_for_event`);
  await conn.query(`
    CREATE PROCEDURE sp_match_available_talents_for_event(IN p_event_id INT)
    BEGIN
      DECLARE v_event_exists INT DEFAULT 0;
      DECLARE v_event_date DATE;
      DECLARE v_start_time TIME;
      DECLARE v_end_time TIME;

      SELECT COUNT(*), MAX(event_date), MAX(start_time), MAX(end_time)
      INTO v_event_exists, v_event_date, v_start_time, v_end_time
      FROM events WHERE event_id = p_event_id;

      IF v_event_exists = 0 OR v_event_date IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid Event ID: The specified event does not exist in the database.';
      END IF;

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
      INNER JOIN skills s ON er.skill_id = s.skill_id
      INNER JOIN participant_skills ps ON s.skill_id = ps.skill_id
      INNER JOIN participants p ON ps.participant_id = p.participant_id
      LEFT JOIN participation ptn ON ptn.event_id = p_event_id AND ptn.participant_id = p.participant_id
      WHERE er.event_id = p_event_id
        AND NOT EXISTS (
          SELECT 1 FROM availability a
          WHERE a.participant_id = p.participant_id
            AND a.available_date = v_event_date
            AND a.status = 'Busy'
            AND a.start_time < v_end_time
            AND a.end_time > v_start_time
        )
        AND NOT EXISTS (
          SELECT 1 FROM participation other_ptn
          INNER JOIN events other_e ON other_ptn.event_id = other_e.event_id
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
    END
  `);
  console.log('[Setup] Stored Procedure 1 deployed.');

  await conn.query(`DROP PROCEDURE IF EXISTS sp_register_event_participation`);
  await conn.query(`
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

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        ROLLBACK;
        SET p_status_code = -1;
        SET p_status_message = 'Registration failed due to a database constraint or scheduling conflict.';
      END;

      START TRANSACTION;

      SELECT COUNT(*), MAX(status)
      INTO v_event_exists, v_event_status
      FROM events WHERE event_id = p_event_id;

      IF v_event_exists = 0 THEN
        SET p_status_code = 0;
        SET p_status_message = 'Event does not exist.';
        ROLLBACK;
      ELSEIF v_event_status = 'Cancelled' THEN
        SET p_status_code = 0;
        SET p_status_message = 'Cannot register: This event has been cancelled.';
        ROLLBACK;
      ELSE
        SELECT COUNT(*) INTO v_participant_exists
        FROM participants WHERE participant_id = p_participant_id;

        IF v_participant_exists = 0 THEN
          SET p_status_code = 0;
          SET p_status_message = 'Participant does not exist.';
          ROLLBACK;
        ELSE
          SELECT COUNT(*) INTO v_already_registered
          FROM participation
          WHERE participant_id = p_participant_id AND event_id = p_event_id;

          IF v_already_registered > 0 THEN
            SET p_status_code = 0;
            SET p_status_message = 'Participant is already registered for this event.';
            ROLLBACK;
          ELSE
            SELECT COUNT(*) INTO v_req_count
            FROM event_requirements WHERE event_id = p_event_id;

            IF v_req_count > 0 THEN
              SELECT COUNT(*) INTO v_skill_match
              FROM event_requirements er
              INNER JOIN participant_skills ps ON er.skill_id = ps.skill_id
              WHERE er.event_id = p_event_id AND ps.participant_id = p_participant_id;

              IF v_skill_match = 0 THEN
                SET p_status_code = 0;
                SET p_status_message = 'Participant does not possess any skill required for this event.';
                ROLLBACK;
              ELSE
                INSERT INTO participation (participant_id, event_id, role, status)
                VALUES (p_participant_id, p_event_id, COALESCE(p_role, 'Performer'), 'Registered');
                COMMIT;
                SET p_status_code = 1;
                SET p_status_message = 'Participation successfully registered!';
              END IF;
            ELSE
              INSERT INTO participation (participant_id, event_id, role, status)
              VALUES (p_participant_id, p_event_id, COALESCE(p_role, 'Performer'), 'Registered');
              COMMIT;
              SET p_status_code = 1;
              SET p_status_message = 'Participation successfully registered!';
            END IF;
          END IF;
        END IF;
      END IF;
    END
  `);
  console.log('[Setup] Stored Procedure 2 deployed.');

  const views = fs.readFileSync(path.join(dbDir, 'views.sql'), 'utf8');
  await conn.query(views);
  console.log('[Setup] Views created.');

  await conn.end();

  console.log('');
  console.log('====================================================');
  console.log(' KalaConnect database setup complete!');
  console.log(' Run: npm run start:server   (backend on :5000)');
  console.log(' Run: npm run dev:client     (frontend on :5173)');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('[Setup FAILED]', err.message);
  process.exit(1);
});
