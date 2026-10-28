-- =====================================================================
-- KalaConnect — Sample Demonstration Dataset
-- Purpose: Realistic test data for demonstrating queries, triggers & procedures.
-- Insertion Order: Follows strict foreign-key dependency order (parents -> children)
-- =====================================================================

USE kalaconnect;

-- Disable checks during bulk sample insertion to ensure smooth loading
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE participation;
TRUNCATE TABLE availability;
TRUNCATE TABLE event_requirements;
TRUNCATE TABLE events;
TRUNCATE TABLE participant_skills;
TRUNCATE TABLE skills;
TRUNCATE TABLE cultural_activities;
TRUNCATE TABLE organizers;
TRUNCATE TABLE participants;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. CULTURAL ACTIVITIES
-- ---------------------------------------------------------------------
INSERT INTO cultural_activities (activity_id, activity_name, category, description) VALUES
(1, 'Classical & Contemporary Dance', 'Performing Arts', 'Encompasses traditional Indian classical forms as well as modern/contemporary dance styles.'),
(2, 'Vocal & Instrumental Music', 'Musical Arts', 'Includes solo vocals, classical accompaniment, western band music, and instrumental recitals.'),
(3, 'Theatre & Dramatics', 'Performing Arts', 'Stage plays, street plays (Nukkad Natak), mono-acting, and mime performances.'),
(4, 'Fine & Visual Arts', 'Visual Arts', 'Painting, sketching, digital art, clay modeling, and traditional rangoli.'),
(5, 'Literary Arts & Debating', 'Literary Arts', 'Parliamentary debates, elocution, creative writing, poetry slams, and quiz competitions.');

-- ---------------------------------------------------------------------
-- 2. SKILLS
-- ---------------------------------------------------------------------
INSERT INTO skills (skill_id, activity_id, skill_name, description) VALUES
-- Dance (activity_id = 1)
(101, 1, 'Bharatanatyam', 'South Indian classical dance form characterized by fixed upper torso and intricate footwork.'),
(102, 1, 'Kathak', 'North Indian classical dance form focusing on rhythmic footwork and pirouettes.'),
(103, 1, 'Hip-Hop & Street Dance', 'Energetic freestyle urban dance with popping, locking, and breaking techniques.'),
-- Music (activity_id = 2)
(104, 2, 'Carnatic Classical Vocal', 'Traditional South Indian classical singing with complex raga improvisations.'),
(105, 2, 'Hindustani Classical Vocal', 'North Indian vocal tradition emphasizing emotional expression and slow raga development.'),
(106, 2, 'Tabla', 'A pair of twin hand drums of Indian origin used in traditional and fusion performances.'),
(107, 2, 'Acoustic Guitar', 'Steel-stringed acoustic instrument used for western acoustic and rhythm accompaniment.'),
(108, 2, 'Beatboxing', 'Vocal percussion producing drum beats, rhythm, and musical sounds using the human mouth.'),
-- Theatre (activity_id = 3)
(109, 3, 'Street Play (Nukkad Natak)', 'High-energy outdoor theatre addressing social causes through loud chants and circular movement.'),
(110, 3, 'Mono-Acting & Dialogue Delivery', 'Solo dramatic performance showcasing vocal modulation, expression, and character shifts.'),
-- Visual Arts (activity_id = 4)
(111, 4, 'Charcoal & Graphite Sketching', 'Detailed monochrome drawing and portraiture using charcoal and graphite pencils.'),
(112, 4, 'Acrylic & Canvas Painting', 'Color-rich visual art using acrylic mediums for expressive landscape and figurative art.'),
-- Literary (activity_id = 5)
(113, 5, 'Parliamentary Debating', 'Formal collegiate debate format focusing on policy arguments, rebuttal, and persuasive rhetoric.'),
(114, 5, 'Poetry Slam & Spoken Word', 'Performance poetry emphasizing rhythm, passion, rhyme, and original storytelling.');

-- ---------------------------------------------------------------------
-- 3. PARTICIPANTS
-- ---------------------------------------------------------------------
INSERT INTO participants (participant_id, full_name, email, phone, college_id, department, year_of_study, bio) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@college.edu', '9876543210', '1MS21CS001', 'Computer Science', 3, 'Trained Hindustani vocalist and acoustic guitarist. Loves fusion classical jams.'),
(2, 'Diya Iyer', 'diya.iyer@college.edu', '9876543211', '1MS22EC045', 'Electronics & Comm.', 2, 'Bharatanatyam dancer with 10 years of formal training. College cultural fest winner.'),
(3, 'Rohan Verma', 'rohan.verma@college.edu', '9876543212', '1MS21ME089', 'Mechanical Engg', 3, 'Passionate street play actor, scriptwriter, and lead director for the Dramatics Club.'),
(4, 'Ananya Sen', 'ananya.sen@college.edu', '9876543213', '1MS23IS012', 'Information Science', 1, 'National-level debate champion. Avid public speaker and slam poet.'),
(5, 'Vikram Nair', 'vikram.nair@college.edu', '9876543214', '1MS22CV034', 'Civil Engg', 2, 'Percussionist and Tabla player. Regularly accompanies classical vocalists.'),
(6, 'Sneha Patel', 'sneha.patel@college.edu', '9876543215', '1MS21CS110', 'Computer Science', 3, 'Visual artist specializing in live charcoal sketching and digital illustrations.'),
(7, 'Karan Malhotra', 'karan.malhotra@college.edu', '9876543216', '1MS23EC078', 'Electronics & Comm.', 1, 'Freestyle hip-hop dancer and beatboxer. Performed at multiple college inter-fests.');

-- ---------------------------------------------------------------------
-- 4. ORGANIZERS
-- ---------------------------------------------------------------------
INSERT INTO organizers (organizer_id, full_name, email, phone, club_or_dept, designation) VALUES
(1, 'Dr. Meenakshi Sundaram', 'meenakshi.s@college.edu', '9123456780', 'Cultural Affairs Committee', 'Faculty Head'),
(2, 'Aditya Singhania', 'aditya.singh@college.edu', '9123456781', 'Dhvani Music Society', 'Student President'),
(3, 'Pooja Kulkarni', 'pooja.k@college.edu', '9123456782', 'Natya Stage & Street Theatre', 'General Secretary'),
(4, 'Tanvi Deshmukh', 'tanvi.d@college.edu', '9123456783', 'Fine Arts & Creativity Forum', 'Lead Coordinator');

-- ---------------------------------------------------------------------
-- 5. PARTICIPANT SKILLS (M:N Junction Table)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 6. EVENTS
-- ---------------------------------------------------------------------
INSERT INTO events (event_id, organizer_id, activity_id, event_name, event_date, start_time, end_time, venue, status, description) VALUES
(201, 2, 2, 'Sur Sangam: Annual Classical Music Night', '2026-11-15', '17:30:00', '21:00:00', 'Main Auditorium', 'Scheduled', 'An evening celebrating classical Hindustani and Carnatic ragas with live acoustic accompaniment.'),
(202, 3, 3, 'Awaaz: Inter-College Street Play Fest', '2026-11-18', '10:00:00', '14:00:00', 'Open Air Theatre (OAT)', 'Scheduled', 'Open street play competition addressing modern environmental and social themes.'),
(203, 1, 1, 'Nritya Tarang: Classical & Contemporary Showcase', '2026-11-20', '18:00:00', '21:30:00', 'Quadrangle Amphitheatre', 'Scheduled', 'Flagship dance competition featuring solo and group classical performances.'),
(204, 4, 4, 'Chitrakala: Live Canvas & Charcoal Exhibition', '2026-11-22', '11:00:00', '16:00:00', 'Central Library Lawn', 'Scheduled', 'Spot painting and charcoal art competition with exhibition of shortlisted pieces.');

-- ---------------------------------------------------------------------
-- 7. EVENT REQUIREMENTS
-- ---------------------------------------------------------------------
INSERT INTO event_requirements (requirement_id, event_id, skill_id, required_count, notes) VALUES
(301, 201, 105, 2, 'Need two Hindustani vocalists for solo and jugalbandi slots.'),
(302, 201, 106, 2, 'Need two accompanist tabla players for vocal rhythm support.'),
(303, 202, 109, 8, 'Full street play troupe required (actors with loud vocal projection and percussion).'),
(304, 203, 101, 3, 'Solo Bharatanatyam recitalists needed for inter-college competition.'),
(305, 204, 111, 4, 'Charcoal portrait sketchers for live exhibition stalls.');

-- ---------------------------------------------------------------------
-- 8. AVAILABILITY
-- ---------------------------------------------------------------------
INSERT INTO availability (availability_id, participant_id, available_date, start_time, end_time, status) VALUES
(401, 1, '2026-11-15', '16:00:00', '22:00:00', 'Available'),
(402, 2, '2026-11-20', '17:00:00', '22:00:00', 'Available'),
(403, 3, '2026-11-18', '09:00:00', '15:00:00', 'Available'),
(404, 4, '2026-11-15', '10:00:00', '14:00:00', 'Busy'),        -- Exam / Lab slot
(405, 5, '2026-11-15', '16:30:00', '21:30:00', 'Available'),
(406, 6, '2026-11-22', '10:00:00', '17:00:00', 'Available'),
(407, 7, '2026-11-20', '17:30:00', '22:00:00', 'Available'),
(408, 1, '2026-11-18', '10:00:00', '13:00:00', 'Busy');

-- ---------------------------------------------------------------------
-- 9. PARTICIPATION
-- ---------------------------------------------------------------------
INSERT INTO participation (participation_id, participant_id, event_id, role, status, feedback_or_score) VALUES
(501, 1, 201, 'Lead Hindustani Vocalist', 'Confirmed', 'Shortlisted via preliminary audition (Score: 92/100)'),
(502, 5, 201, 'Tabla Accompanist', 'Confirmed', 'Assigned as primary rhythm accompanist for Vocalist'),
(503, 3, 202, 'Lead Street Play Actor / Director', 'Confirmed', 'Heading team script and direction'),
(504, 2, 203, 'Solo Bharatanatyam Performer', 'Confirmed', 'Entry approved for competitive slot'),
(505, 6, 204, 'Charcoal Artist', 'Registered', 'Portfolio submitted, awaiting jury clearance');
