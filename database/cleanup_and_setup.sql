-- =====================================================================
-- KalaConnect — Database Cleanup and Canonical Setup
-- Purpose: 
-- 1. Safely remove isolated legacy tables (artistprofiles, artisttalents, artistavailablility, bookings)
-- 2. Build the pristine 9-table schema (3NF-compliant) agreed for KalaConnect
-- 3. Populate realistic sample data for Phase 1 testing and viva presentation
-- =====================================================================

USE kalaconnect;

-- Temporarily disable foreign key checks to allow clean dropping
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- STEP 1: DROP ISOLATED LEGACY TABLES (Verified 0 rows in inspection)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS artistavailablility; -- Spotted in inspection (legacy with 3 'l's)
DROP TABLE IF EXISTS artisttalents;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS artistprofiles;

-- ---------------------------------------------------------------------
-- STEP 2: DROP EXISTING INTENDED TABLES TO ENSURE CLEAN 3NF REBUILD
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS participation;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS event_requirements;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS participant_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS cultural_activities;
DROP TABLE IF EXISTS organizers;
DROP TABLE IF EXISTS participants;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- STEP 3: CREATE THE 9 CANONICAL TABLES
-- =====================================================================

-- 1. PARTICIPANTS (Member 1 Scope)
CREATE TABLE participants (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    college_id VARCHAR(50) NOT NULL UNIQUE,       -- Student USN / Roll Number
    department VARCHAR(50) NOT NULL,              -- e.g., 'Computer Science'
    year_of_study TINYINT NOT NULL CHECK (year_of_study BETWEEN 1 AND 5),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. ORGANIZERS (Member 2 Scope)
CREATE TABLE organizers (
    organizer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    club_or_dept VARCHAR(100) NOT NULL,          -- e.g., 'Music Society', 'Cultural Committee'
    designation VARCHAR(50) DEFAULT 'Coordinator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. CULTURAL ACTIVITIES (Member 1 Scope)
CREATE TABLE cultural_activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL UNIQUE,   -- e.g., 'Dance', 'Music', 'Theatre'
    category VARCHAR(50) NOT NULL,                -- e.g., 'Performing Arts', 'Visual Arts'
    description TEXT
) ENGINE=InnoDB;

-- 4. SKILLS (Member 1 Scope)
CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,             -- e.g., 'Bharatanatyam', 'Carnatic Vocal'
    description TEXT,
    CONSTRAINT fk_skills_activity
        FOREIGN KEY (activity_id) REFERENCES cultural_activities(activity_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_activity_skill (activity_id, skill_name)
) ENGINE=InnoDB;

-- 5. PARTICIPANT SKILLS (Member 1 Scope - M:N Junction Table)
CREATE TABLE participant_skills (
    participant_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Professional') NOT NULL DEFAULT 'Intermediate',
    years_of_experience DECIMAL(4, 1) NOT NULL DEFAULT 0.0 CHECK (years_of_experience >= 0.0),
    portfolio_url VARCHAR(255),
    PRIMARY KEY (participant_id, skill_id),
    CONSTRAINT fk_ps_participant
        FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ps_skill
        FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. EVENTS (Member 2 Scope)
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    activity_id INT,                              -- Optional: thematic link
    event_name VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(150) NOT NULL,
    status ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_time CHECK (end_time > start_time),
    CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_id) REFERENCES organizers(organizer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_events_activity
        FOREIGN KEY (activity_id) REFERENCES cultural_activities(activity_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. EVENT REQUIREMENTS (Member 2 Scope)
CREATE TABLE event_requirements (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_count INT NOT NULL DEFAULT 1 CHECK (required_count > 0),
    notes TEXT,
    CONSTRAINT fk_er_event
        FOREIGN KEY (event_id) REFERENCES events(event_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_er_skill
        FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_event_skill (event_id, skill_id)
) ENGINE=InnoDB;

-- 8. AVAILABILITY (Member 1 Scope)
CREATE TABLE availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('Available', 'Busy', 'Tentative') NOT NULL DEFAULT 'Available',
    CONSTRAINT chk_avail_time CHECK (end_time > start_time),
    CONSTRAINT fk_availability_participant
        FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_participant_date (participant_id, available_date)
) ENGINE=InnoDB;

-- 9. PARTICIPATION (Member 2 Scope - M:N Junction Table)
CREATE TABLE participation (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    event_id INT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Performer',
    status ENUM('Registered', 'Shortlisted', 'Confirmed', 'Attended', 'Cancelled') NOT NULL DEFAULT 'Registered',
    feedback_or_score VARCHAR(100),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participation_participant
        FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_participation_event
        FOREIGN KEY (event_id) REFERENCES events(event_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uq_participant_event (participant_id, event_id)
) ENGINE=InnoDB;

-- =====================================================================
-- STEP 4: INSERT REALISTIC SAMPLE DATA FOR TESTING
-- =====================================================================

INSERT INTO cultural_activities (activity_id, activity_name, category, description) VALUES
(1, 'Classical & Contemporary Dance', 'Performing Arts', 'Traditional Indian classical and western contemporary dance.'),
(2, 'Vocal & Instrumental Music', 'Musical Arts', 'Solo vocals, classical accompaniment, western band music, and instrumental.'),
(3, 'Theatre & Dramatics', 'Performing Arts', 'Stage plays, street plays (Nukkad Natak), and mono-acting.'),
(4, 'Fine & Visual Arts', 'Visual Arts', 'Painting, sketching, digital art, clay modeling, and rangoli.'),
(5, 'Literary Arts & Debating', 'Literary Arts', 'Parliamentary debates, elocution, creative writing, and poetry.');

INSERT INTO skills (skill_id, activity_id, skill_name, description) VALUES
(101, 1, 'Bharatanatyam', 'South Indian classical dance form.'),
(102, 1, 'Kathak', 'North Indian classical dance with rhythmic footwork.'),
(103, 1, 'Hip-Hop & Street Dance', 'Energetic freestyle urban dance.'),
(104, 2, 'Carnatic Classical Vocal', 'Traditional South Indian classical singing.'),
(105, 2, 'Hindustani Classical Vocal', 'North Indian classical vocal tradition.'),
(106, 2, 'Tabla', 'Twin hand drums used for rhythm and accompaniment.'),
(107, 2, 'Acoustic Guitar', 'Acoustic guitar for chord progression and solos.'),
(108, 2, 'Beatboxing', 'Vocal percussion producing rhythmic beats.'),
(109, 3, 'Street Play (Nukkad Natak)', 'High-energy outdoor theatre for social causes.'),
(110, 3, 'Mono-Acting & Dialogue Delivery', 'Solo dramatic expression and character switches.'),
(111, 4, 'Charcoal & Graphite Sketching', 'Monochrome shading and portraiture.'),
(112, 4, 'Acrylic & Canvas Painting', 'Color-rich visual art.'),
(113, 5, 'Parliamentary Debating', 'Collegiate debate format with points of information.'),
(114, 5, 'Poetry Slam & Spoken Word', 'Performance poetry emphasizing rhythm and storytelling.');

INSERT INTO participants (participant_id, full_name, email, phone, college_id, department, year_of_study, bio) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@college.edu', '9876543210', '1MS21CS001', 'Computer Science', 3, 'Trained Hindustani vocalist and acoustic guitarist.'),
(2, 'Diya Iyer', 'diya.iyer@college.edu', '9876543211', '1MS22EC045', 'Electronics & Comm.', 2, 'Bharatanatyam dancer with 10 years of formal training.'),
(3, 'Rohan Verma', 'rohan.verma@college.edu', '9876543212', '1MS21ME089', 'Mechanical Engg', 3, 'Street play actor and director for the Dramatics Club.'),
(4, 'Ananya Sen', 'ananya.sen@college.edu', '9876543213', '1MS23IS012', 'Information Science', 1, 'National-level debate champion and slam poet.'),
(5, 'Vikram Nair', 'vikram.nair@college.edu', '9876543214', '1MS22CV034', 'Civil Engg', 2, 'Percussionist and Tabla accompanist.'),
(6, 'Sneha Patel', 'sneha.patel@college.edu', '9876543215', '1MS21CS110', 'Computer Science', 3, 'Live charcoal artist and digital illustrator.'),
(7, 'Karan Malhotra', 'karan.malhotra@college.edu', '9876543216', '1MS23EC078', 'Electronics & Comm.', 1, 'Hip-hop dancer and beatboxer.');

INSERT INTO organizers (organizer_id, full_name, email, phone, club_or_dept, designation) VALUES
(1, 'Dr. Meenakshi Sundaram', 'meenakshi.s@college.edu', '9123456780', 'Cultural Affairs Committee', 'Faculty Head'),
(2, 'Aditya Singhania', 'aditya.singh@college.edu', '9123456781', 'Dhvani Music Society', 'Student President'),
(3, 'Pooja Kulkarni', 'pooja.k@college.edu', '9123456782', 'Natya Stage & Street Theatre', 'General Secretary'),
(4, 'Tanvi Deshmukh', 'tanvi.d@college.edu', '9123456783', 'Fine Arts & Creativity Forum', 'Lead Coordinator');

INSERT INTO participant_skills (participant_id, skill_id, proficiency_level, years_of_experience, portfolio_url) VALUES
(1, 105, 'Advanced', 8.5, 'https://portfolio.college.edu/aarav/music'),
(1, 107, 'Intermediate', 4.0, NULL),
(2, 101, 'Professional', 10.0, 'https://portfolio.college.edu/diya/dance'),
(2, 102, 'Intermediate', 3.0, NULL),
(3, 109, 'Advanced', 5.0, 'https://youtube.com/watch?v=nukkad_demo_rohan'),
(3, 110, 'Advanced', 4.5, NULL),
(4, 113, 'Professional', 4.0, 'https://portfolio.college.edu/ananya/debate'),
(4, 114, 'Advanced', 3.0, NULL),
(5, 106, 'Advanced', 7.0, 'https://soundcloud.com/vikram_tabla'),
(6, 111, 'Advanced', 6.0, 'https://instagram.com/sneha_charcoal_art'),
(6, 112, 'Intermediate', 3.5, NULL),
(7, 103, 'Advanced', 5.0, 'https://portfolio.college.edu/karan/hiphop'),
(7, 108, 'Intermediate', 2.5, NULL);

INSERT INTO events (event_id, organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description) VALUES
(201, 2, 2, 'Sur Sangam: Annual Classical Music Night', '2026-11-15', '17:30:00', '21:00:00', 'Main Auditorium', 'Scheduled', 'Celebration of Hindustani and Carnatic classical ragas.'),
(202, 3, 3, 'Awaaz: Inter-College Street Play Fest', '2026-11-18', '10:00:00', '14:00:00', 'Open Air Theatre (OAT)', 'Scheduled', 'Open street play competition on social themes.'),
(203, 1, 1, 'Nritya Tarang: Classical & Contemporary Showcase', '2026-11-20', '18:00:00', '21:30:00', 'Quadrangle Amphitheatre', 'Scheduled', 'Dance competition featuring solo and group classical recitals.'),
(204, 4, 4, 'Chitrakala: Live Canvas & Charcoal Exhibition', '2026-11-22', '11:00:00', '16:00:00', 'Central Library Lawn', 'Scheduled', 'Spot charcoal art and canvas exhibition.');

INSERT INTO event_requirements (requirement_id, event_id, skill_id, required_count, notes) VALUES
(301, 201, 105, 2, 'Two Hindustani vocalists for solo and jugalbandi slots.'),
(302, 201, 106, 2, 'Two tabla players for accompaniment.'),
(303, 202, 109, 8, 'Full street play troupe (actors with vocal projection).'),
(304, 203, 101, 3, 'Solo Bharatanatyam recitalists.'),
(305, 204, 111, 4, 'Charcoal sketchers for live exhibition.');

INSERT INTO availability (availability_id, participant_id, available_date, start_time, end_time, status) VALUES
(401, 1, '2026-11-15', '16:00:00', '22:00:00', 'Available'),
(402, 2, '2026-11-20', '17:00:00', '22:00:00', 'Available'),
(403, 3, '2026-11-18', '09:00:00', '15:00:00', 'Available'),
(404, 4, '2026-11-15', '10:00:00', '14:00:00', 'Busy'),
(405, 5, '2026-11-15', '16:30:00', '21:30:00', 'Available'),
(406, 6, '2026-11-22', '10:00:00', '17:00:00', 'Available'),
(407, 7, '2026-11-20', '17:30:00', '22:00:00', 'Available'),
(408, 1, '2026-11-18', '10:00:00', '13:00:00', 'Busy');

INSERT INTO participation (participation_id, participant_id, event_id, role, status, feedback_or_score) VALUES
(501, 1, 201, 'Lead Hindustani Vocalist', 'Confirmed', 'Audition Score: 92/100'),
(502, 5, 201, 'Tabla Accompanist', 'Confirmed', 'Assigned as primary rhythm accompanist'),
(503, 3, 202, 'Lead Street Play Actor / Director', 'Confirmed', 'Leading script and direction'),
(504, 2, 203, 'Solo Bharatanatyam Performer', 'Confirmed', 'Entry approved for competitive slot'),
(505, 6, 204, 'Charcoal Artist', 'Registered', 'Portfolio submitted, awaiting clearance');

-- =====================================================================
-- STEP 5: VERIFY FINAL TABLE COUNT
-- =====================================================================
SELECT 
    TABLE_NAME AS `Pristine Table Name`,
    TABLE_ROWS AS `Rows Inserted`
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'kalaconnect'
ORDER BY TABLE_NAME;
