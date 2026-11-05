SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS participation;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS event_requirements;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS participant_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS cultural_activities;
DROP TABLE IF EXISTS organizers;
DROP TABLE IF EXISTS participants;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE participants (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    college_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(50) NOT NULL,
    year_of_study TINYINT NOT NULL CHECK (year_of_study BETWEEN 1 AND 5),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE organizers (
    organizer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    club_or_dept VARCHAR(100) NOT NULL,
    designation VARCHAR(50) DEFAULT 'Coordinator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE cultural_activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    description TEXT,
    CONSTRAINT fk_skills_activity
        FOREIGN KEY (activity_id) REFERENCES cultural_activities(activity_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_activity_skill (activity_id, skill_name)
) ENGINE=InnoDB;

CREATE TABLE participant_skills (
    participant_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('Beginner','Intermediate','Advanced','Professional') NOT NULL DEFAULT 'Intermediate',
    years_of_experience DECIMAL(4,1) NOT NULL DEFAULT 0.0 CHECK (years_of_experience >= 0.0),
    portfolio_url VARCHAR(255),
    PRIMARY KEY (participant_id, skill_id),
    CONSTRAINT fk_ps_participant
        FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ps_skill
        FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    activity_id INT,
    event_name VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(150) NOT NULL,
    status ENUM('Scheduled','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',
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

CREATE TABLE availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('Available','Busy','Tentative') NOT NULL DEFAULT 'Available',
    CONSTRAINT chk_avail_time CHECK (end_time > start_time),
    CONSTRAINT fk_availability_participant
        FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_participant_date (participant_id, available_date)
) ENGINE=InnoDB;

CREATE TABLE participation (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    event_id INT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Performer',
    status ENUM('Registered','Shortlisted','Confirmed','Attended','Cancelled') NOT NULL DEFAULT 'Registered',
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
