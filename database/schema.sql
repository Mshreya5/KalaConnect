-- =====================================================================
-- KalaConnect — Cultural Talent, Availability & Event Coordination System
-- Canonical Relational Database Schema (3NF Compliant)
-- =====================================================================
-- Description:
-- This file defines the core 9 tables for the KalaConnect database.
-- Tables are created in strict foreign-key dependency order (parents before children).
-- Designed and agreed upon jointly by Member 1 and Member 2.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS kalaconnect;
USE kalaconnect;

-- Disable foreign key checks temporarily during table creation/resets if needed
SET FOREIGN_KEY_CHECKS = 0;

-- Drop child tables first, then parent tables to avoid FK constraint errors
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

-- =====================================================================
-- 1. PARTICIPANTS (Member 1 Scope)
-- Stores profile and college identity information for registered students/artists.
-- =====================================================================
CREATE TABLE participants (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    college_id VARCHAR(50) NOT NULL UNIQUE,       -- Student USN / Roll Number
    department VARCHAR(50) NOT NULL,              -- e.g., 'Computer Science', 'Mechanical'
    year_of_study TINYINT NOT NULL CHECK (year_of_study BETWEEN 1 AND 5),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 2. ORGANIZERS (Member 2 Scope)
-- Stores details of faculty coordinators, club presidents, and event managers.
-- =====================================================================
CREATE TABLE organizers (
    organizer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    club_or_dept VARCHAR(100) NOT NULL,          -- e.g., 'Music Society', 'Cultural Committee'
    designation VARCHAR(50) DEFAULT 'Coordinator',-- e.g., 'President', 'Faculty Lead'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 3. CULTURAL ACTIVITIES (Member 1 Scope)
-- High-level cultural art forms and domains.
-- =====================================================================
CREATE TABLE cultural_activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL UNIQUE,   -- e.g., 'Dance', 'Music', 'Theatre', 'Fine Arts'
    category VARCHAR(50) NOT NULL,                -- e.g., 'Performing Arts', 'Visual Arts', 'Literary Arts'
    description TEXT
) ENGINE=InnoDB;

-- =====================================================================
-- 4. SKILLS (Member 1 Scope)
-- Specific granular talents classified under a cultural activity.
-- Normalization note: Foreign key to cultural_activities removes transitive dependencies.
-- =====================================================================
CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,             -- e.g., 'Bharatanatyam', 'Carnatic Vocal', 'Tabla'
    description TEXT,
    CONSTRAINT fk_skills_activity
        FOREIGN KEY (activity_id) REFERENCES cultural_activities(activity_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_activity_skill (activity_id, skill_name)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. PARTICIPANT SKILLS (Member 1 Scope - M:N Junction Table)
-- Resolves the Many-to-Many relationship between Participants and Skills.
-- A participant can possess multiple skills; a skill can belong to multiple participants.
-- =====================================================================
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

-- =====================================================================
-- 6. EVENTS (Member 2 Scope)
-- Cultural shows, inter-college competitions, and auditions hosted by organizers.
-- =====================================================================
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    activity_id INT,                              -- Optional: specifies primary theme or activity
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

-- =====================================================================
-- 7. EVENT REQUIREMENTS (Member 2 Scope)
-- Specifies the headcount and skill sets needed to execute an event.
-- =====================================================================
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

-- =====================================================================
-- 8. AVAILABILITY (Member 1 Scope)
-- Tracks time intervals when participants are available or busy.
-- Essential for coordinators to prevent double-booking or academic schedule collisions.
-- =====================================================================
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

-- =====================================================================
-- 9. PARTICIPATION (Member 2 Scope - M:N Junction Table)
-- Connects Participants to Events, capturing registrations, roles, and status.
-- =====================================================================
CREATE TABLE participation (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    event_id INT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Performer', -- e.g., 'Lead Vocalist', 'Soloist', 'Accompanist'
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
