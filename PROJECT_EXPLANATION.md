# KalaConnect – Complete Project Explanation & Viva Guide

> **Prepared for College DBMS Mini-Project Review, Demonstration & Viva Voce**  
> **Project Name:** KalaConnect – Cultural Talent, Availability & Event Coordination System  
> **Team:** Member 1 & Member 2 Integration  
> **Tech Stack:** React (Vite, Tailwind CSS), Node.js, Express.js, MySQL (mysql2)

---

## Table of Contents
1. [What is KalaConnect?](#1-what-is-kalaconnect)
2. [Why Did We Choose This Project?](#2-why-did-we-choose-this-project)
3. [What Problem Does It Solve?](#3-what-problem-does-it-solve)
4. [How Does the Complete Application Work?](#4-how-does-the-complete-application-work)
5. [System Architecture Explained](#5-system-architecture-explained)
6. [Frontend Explained](#6-frontend-explained)
7. [Backend Explained](#7-backend-explained)
8. [How React Communicates with Express](#8-how-react-communicates-with-express)
9. [How Express Communicates with MySQL](#9-how-express-communicates-with-mysql)
10. [The 9 Database Tables Explained Individually](#10-the-9-database-tables-explained-individually)
11. [Primary Keys and Foreign Keys Used](#11-primary-keys-and-foreign-keys-used)
12. [Table Relationships and ER Logic](#12-table-relationships-and-er-logic)
13. [Member 1 Modules In-Depth](#13-member-1-modules-in-depth)
14. [Member 2 Modules In-Depth](#14-member-2-modules-in-depth)
15. [How Talent Matching Works Step-by-Step](#15-how-talent-matching-works-step-by-step)
16. [How Participant Availability is Checked](#16-how-participant-availability-is-checked)
17. [The Availability Validation Trigger (With Concrete Example)](#17-the-availability-validation-trigger-with-concrete-example)
18. [The Talent-Matching Stored Procedure (With Concrete Example)](#18-the-talent-matching-stored-procedure-with-concrete-example)
19. [Important SQL Queries and Joins Used in the System](#19-important-sql-queries-and-joins-used-in-the-system)
20. [Complete Participant Workflow](#20-complete-participant-workflow)
21. [Complete Organizer Workflow](#21-complete-organizer-workflow)
22. [Testing Performed & Verification Results](#22-testing-performed--verification-results)
23. [Main Challenges and How They Were Solved](#23-main-challenges-and-how-they-were-solved)
24. [Possible Future Enhancements](#24-possible-future-enhancements)
25. [Section A: Mini-Project Demonstration Guide for Faculty](#section-a-mini-project-demonstration-guide-for-faculty)
26. [Section B: Viva Voce Preparation (28 Questions & Answers)](#section-b-viva-voce-preparation-28-questions--answers)
27. [Section C: Detailed Member Contribution Breakdown](#section-c-detailed-member-contribution-breakdown)

---

## 1. What is KalaConnect?
**KalaConnect** (*Kala* meaning Art/Culture in Sanskrit + *Connect*) is a full-stack database application designed to solve cultural talent discovery and event scheduling challenges in colleges. It serves as a single digital platform where:
- Students with cultural abilities (singers, dancers, actors, debaters, painters) register their profiles, proficiencies, and free time slots.
- College clubs, cultural secretaries, and faculty coordinators create events, declare how many performers of each skill are needed, and match eligible performers automatically using database stored procedures.

---

## 2. Why Did We Choose This Project?
Most DBMS mini-projects revolve around simple inventory, library, or blood bank systems. We chose **KalaConnect** because it represents a **real-world, multi-dimensional relational problem**:
- It requires **M:N (Many-to-Many) relationships** (participants to skills, and participants to events).
- It involves **temporal interval scheduling** (start times, end times, and date checking), which allows us to showcase **complex database triggers** to prevent overlapping availability slots.
- It requires **intelligent multi-condition querying** (matching skills, checking availability, and filtering out students already booked in other simultaneous events), which is best solved using a **MySQL Stored Procedure**.

---

## 3. What Problem Does It Solve?
1. **Eliminates Manual Search**: Organizers no longer need to broadcast messages across hundreds of WhatsApp groups to find a tabla player or debater.
2. **Stops Double-Booking Chaos**: Students frequently commit to two different events at the same time. KalaConnect's triggers and stored procedures automatically flag and prevent scheduling clashes.
3. **Requirement Deficit Visibility**: Coordinators can immediately see which events still have unfilled performer quotas.
4. **Data Integrity**: Enforces strict constraints so that students cannot register invalid time slots (e.g., end time earlier than start time or overlapping slots).

---

## 4. How Does the Complete Application Work?
The application functions as an integrated ecosystem:
1. **Talent Onboarding**: Students enter their personal and academic info, select their art forms (e.g., Kathak, Beatboxing, Charcoal Sketching), rate their proficiency (Beginner to Professional), and declare when they are free.
2. **Event Formulation**: Organizers post events (e.g., Annual Music Night) and attach required skill quotas (e.g., 2 Classical Vocalists, 2 Tabla players).
3. **Automated Matching**: Organizers click "Launch Talent Matcher". The backend calls MySQL stored procedure `sp_match_available_talents_for_event`, which cross-checks the event schedule against participant availability and outputs conflict-free candidate performers ranked by experience.
4. **Coordination & Approval**: Organizers send participation requests, review applicants, and mark them as `Confirmed`. Confirmed performers are locked from being booked in conflicting events.
5. **Analytics**: The dashboard tracks total artists, event quotas, and deficit reports in real time.

---

## 5. System Architecture Explained
KalaConnect follows the classic **3-Tier Client-Server Architecture**:

1. **Presentation Tier (Frontend - React + Vite + Tailwind CSS)**:
   - Runs in the user's browser.
   - Provides an interactive Single-Page Application (SPA) with responsive tables, modal dialogs, and KPI cards.
   - Makes asynchronous HTTP calls to the backend via standard REST APIs.

2. **Application Tier (Backend - Node.js + Express.js)**:
   - Listens on port 5000.
   - Parses HTTP requests, validates inputs, and implements business logic.
   - Maintains a connection pool (`mysql2/promise`) to execute parameterized SQL queries against MySQL.

3. **Data Tier (Database - MySQL Community Server 8.0+)**:
   - Manages relational tables, foreign key cascades, triggers, stored procedures, and views.
   - Guarantees ACID properties (Atomicity, Consistency, Isolation, Durability) for event registrations.

---

## 6. Frontend Explained
- **React 19**: Modern UI library utilizing functional components and hooks (`useState`, `useEffect`, `useNavigate`).
- **Vite 8**: Next-generation lightning-fast build tool and local dev server with Hot Module Replacement (HMR).
- **Tailwind CSS**: Utility-first styling framework enabling a clean, modern responsive layout.
- **React Router DOM 7**: Client-side declarative routing enabling seamless transitions between Dashboard, Participants, Skills, Availability, Events, Matcher, Roster, and Reports without page reloads.
- **Icons (`Icons.jsx`)**: Zero-dependency standalone SVG icon library replicating Lucide icons for maximum speed and portability.

---

## 7. Backend Explained
- **Node.js**: Asynchronous, event-driven JavaScript runtime.
- **Express.js 4**: Lightweight web framework organizing APIs into routes and controllers.
- **`cors`**: Middleware permitting cross-origin requests from the Vite frontend (`localhost:5173`) to Express (`localhost:5000`).
- **`dotenv`**: Loads environment variables from the root `.env` file securely without hardcoding passwords.
- **`mysql2/promise`**: High-performance MySQL driver utilizing connection pooling and native async/await syntax.

---

## 8. How React Communicates with Express
1. When a user interacts with the UI (e.g., submits a form or loads the dashboard), React triggers an asynchronous function in `frontend/src/api/index.js` or `frontend/src/services/api.js`.
2. React uses the browser's native `fetch` API or `axios` to send an HTTP request (GET, POST, PUT, PATCH, DELETE) to `/api/...`.
3. In development, Vite's proxy forwards requests from `http://localhost:5173/api/...` to `http://localhost:5000/api/...`.
4. Express receives the request, processes it, and responds with a JSON payload (e.g., `{ success: true, data: [...] }`).
5. React updates component state (`setEvents(...)`), which instantly re-renders the DOM.

---

## 9. How Express Communicates with MySQL
1. At startup, `backend/config/db.js` creates a MySQL connection pool using `mysql.createPool(...)`.
2. Whenever an Express controller needs data, it borrows a connection from the pool and runs a parameterized query:
   ```javascript
   const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [id]);
   ```
3. **Parameterized queries (`?`)** ensure complete protection against **SQL Injection attacks**.
4. To execute the stored procedure, Express calls:
   ```javascript
   const [results] = await pool.query('CALL sp_match_available_talents_for_event(?)', [id]);
   ```
5. Once the query completes, the connection is returned to the pool for reuse.

---

## 10. The 9 Database Tables Explained Individually

### Table 1: `participants` (Member 1)
Stores all student performers.
- `participant_id` (INT, PK, Auto Increment)
- `full_name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(100), UNIQUE, NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `college_id` (VARCHAR(50), UNIQUE, NOT NULL): Student USN / Roll number (e.g., `1MS21CS001`).
- `department` (VARCHAR(50), NOT NULL): e.g., 'Computer Science', 'Mechanical Engg'.
- `year_of_study` (TINYINT, CHECK: 1 to 5): 1st through 5th year students.
- `bio` (TEXT): Student background and achievements.
- `created_at` (TIMESTAMP): Registration timestamp.

### Table 2: `organizers` (Member 2)
Stores cultural coordinators and faculty leaders.
- `organizer_id` (INT, PK, Auto Increment)
- `full_name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(100), UNIQUE, NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `club_or_dept` (VARCHAR(100), NOT NULL): e.g., 'Music Society', 'Cultural Committee'.
- `designation` (VARCHAR(50)): e.g., 'Student Head', 'Faculty Advisor'.
- `created_at` (TIMESTAMP)

### Table 3: `cultural_activities` (Member 1)
High-level cultural domains.
- `activity_id` (INT, PK, Auto Increment)
- `activity_name` (VARCHAR(100), UNIQUE, NOT NULL): e.g., 'Classical & Folk Dance', 'Musical Arts'.
- `category` (VARCHAR(50), NOT NULL): e.g., 'Performing Arts', 'Visual Arts', 'Literary Arts'.
- `description` (TEXT)

### Table 4: `skills` (Member 1)
Specific disciplines within an activity.
- `skill_id` (INT, PK, Auto Increment)
- `activity_id` (INT, FK &rarr; `cultural_activities.activity_id`): Parent domain.
- `skill_name` (VARCHAR(100), NOT NULL): e.g., 'Bharatanatyam', 'Carnatic Vocal', 'Tabla', 'Street Play'.
- `description` (TEXT)
- **Constraint**: `UNIQUE KEY (activity_id, skill_name)` prevents duplicate skill names under the same activity.

### Table 5: `participant_skills` (Member 1)
Bridge table solving the M:N relationship between participants and skills.
- `participant_id` (INT, FK &rarr; `participants.participant_id`, PK)
- `skill_id` (INT, FK &rarr; `skills.skill_id`, PK)
- `proficiency_level` (ENUM: 'Beginner', 'Intermediate', 'Advanced', 'Professional')
- `years_of_experience` (DECIMAL(4,1), CHECK >= 0.0)
- `portfolio_url` (VARCHAR(255)): Link to YouTube, Behance, or audio sample.
- **Primary Key**: Composite `(participant_id, skill_id)`.

### Table 6: `events` (Member 2)
Cultural events scheduled by organizers.
- `event_id` (INT, PK, Auto Increment)
- `organizer_id` (INT, FK &rarr; `organizers.organizer_id`)
- `activity_id` (INT, FK &rarr; `cultural_activities.activity_id`, NULLABLE)
- `event_name` (VARCHAR(150), NOT NULL): e.g., 'Sur Sangam: Classical Music Night'.
- `event_date` (DATE, NOT NULL)
- `start_time` (TIME, NOT NULL)
- `end_time` (TIME, NOT NULL)
- `venue` (VARCHAR(150), NOT NULL)
- `status` (ENUM: 'Scheduled', 'Ongoing', 'Completed', 'Cancelled')
- `description` (TEXT)
- **Constraint**: `CHECK (end_time > start_time)`.

### Table 7: `event_requirements` (Member 2)
Per-skill quotas declared for an event.
- `requirement_id` (INT, PK, Auto Increment)
- `event_id` (INT, FK &rarr; `events.event_id`)
- `skill_id` (INT, FK &rarr; `skills.skill_id`)
- `required_count` (INT, DEFAULT 1, CHECK > 0): Number of performers required.
- `notes` (TEXT): Specific instructions (e.g., 'Need acoustic accompaniment').
- **Constraint**: `UNIQUE KEY (event_id, skill_id)` ensures a skill is not added twice to the same event.

### Table 8: `availability` (Member 1)
Participant free and busy time windows.
- `availability_id` (INT, PK, Auto Increment)
- `participant_id` (INT, FK &rarr; `participants.participant_id`)
- `available_date` (DATE, NOT NULL)
- `start_time` (TIME, NOT NULL)
- `end_time` (TIME, NOT NULL)
- `status` (ENUM: 'Available', 'Busy', 'Tentative')
- **Constraint**: `CHECK (end_time > start_time)`.
- **Triggers**: Enforce non-overlapping intervals per student on any given date.

### Table 9: `participation` (Member 2)
The lifecycle of participant assignments to events.
- `participation_id` (INT, PK, Auto Increment)
- `participant_id` (INT, FK &rarr; `participants.participant_id`)
- `event_id` (INT, FK &rarr; `events.event_id`)
- `role` (VARCHAR(50), DEFAULT 'Performer'): e.g., 'Lead Vocalist', 'Accompanist'.
- `status` (ENUM: 'Registered', 'Shortlisted', 'Confirmed', 'Attended', 'Cancelled')
- `feedback_or_score` (VARCHAR(100))
- `registered_at` (TIMESTAMP)
- **Constraint**: `UNIQUE KEY (participant_id, event_id)` prevents duplicate bookings for the same event.

---

## 11. Primary Keys and Foreign Keys Used

| Table | Primary Key | Foreign Key(s) & Referenced Tables | On Delete Action |
|---|---|---|---|
| `participants` | `participant_id` | *None* | - |
| `organizers` | `organizer_id` | *None* | - |
| `cultural_activities` | `activity_id` | *None* | - |
| `skills` | `skill_id` | `activity_id` &rarr; `cultural_activities(activity_id)` | `RESTRICT` |
| `participant_skills` | `(participant_id, skill_id)` | `participant_id` &rarr; `participants`, `skill_id` &rarr; `skills` | `CASCADE` / `RESTRICT` |
| `events` | `event_id` | `organizer_id` &rarr; `organizers`, `activity_id` &rarr; `cultural_activities` | `RESTRICT` / `SET NULL` |
| `event_requirements` | `requirement_id` | `event_id` &rarr; `events`, `skill_id` &rarr; `skills` | `CASCADE` / `RESTRICT` |
| `availability` | `availability_id` | `participant_id` &rarr; `participants` | `CASCADE` |
| `participation` | `participation_id` | `participant_id` &rarr; `participants`, `event_id` &rarr; `events` | `CASCADE` / `CASCADE` |

---

## 12. Table Relationships and ER Logic
- **`participants` &harr; `skills`**: **Many-to-Many (M:N)** via junction table `participant_skills`. One student can have multiple skills; one skill is possessed by multiple students.
- **`cultural_activities` &harr; `skills`**: **One-to-Many (1:N)**. Each cultural category houses multiple related skills.
- **`organizers` &harr; `events`**: **One-to-Many (1:N)**. One organizer organizes multiple events.
- **`events` &harr; `event_requirements`**: **One-to-Many (1:N)**. Each event specifies multiple skill quotas.
- **`events` &harr; `participants`**: **Many-to-Many (M:N)** via junction table `participation`. Students can participate in multiple events, and events host multiple student performers.
- **`participants` &harr; `availability`**: **One-to-Many (1:N)**. Students record multiple available time intervals across different dates.

---

## 13. Member 1 Modules In-Depth
Member 1 focused on **Talent Identity, Cataloging, and Availability Declarations**:
1. **Participant Management**: Form inputs validate USN uniqueness, phone numbers, and year of study.
2. **Skill Proficiency System**: Maps students to art forms with 4-tier proficiency ratings.
3. **Availability Management**: Allows students to declare time slots.
4. **Availability Trigger**: Custom MySQL trigger that acts as a gatekeeper, rejecting overlapping slots mathematically before insertion.
5. **Talent Search**: Query engine allowing filtering by skill name, category, and minimum proficiency level.

---

## 14. Member 2 Modules In-Depth
Member 2 focused on **Event Management, Talent Matching, and Participation Coordination**:
1. **Organizer & Event Administration**: Tools to create and edit cultural events.
2. **Skill Requirements Engine**: Quota management with headcount deficit calculation.
3. **Talent-Matching Stored Procedure**: Comprehensive matching logic encapsulated in `sp_match_available_talents_for_event`.
4. **Transactional Registration**: Implemented via stored procedure `sp_register_event_participation` with rollback handlers.
5. **Participation Management**: Multi-step approval pipeline (`Registered` &rarr; `Shortlisted` &rarr; `Confirmed`).
6. **Deficit & Analytical Reports**: Queries identifying talent shortages and event popularity rankings.

---

## 15. How Talent Matching Works Step-by-Step
When the organizer clicks **"Launch Talent Matcher"** for an event (e.g., Event 201):
1. **Step 1**: The backend passes `event_id = 201` to `sp_match_available_talents_for_event(201)`.
2. **Step 2**: The procedure fetches the event's date (`2026-11-15`), start time (`17:30`), and end time (`21:00`).
3. **Step 3**: It reads all required skills from `event_requirements` (e.g., Hindustani Vocal [Skill 105], Tabla [Skill 106]).
4. **Step 4**: It joins with `participant_skills` to find all students who possess these required skills.
5. **Step 5**: **Conflict Filtering**:
   - Condition 1: Excludes any student marked **`Busy`** in the `availability` table during the event's time window.
   - Condition 2: Excludes any student who is already **`Confirmed`** in another simultaneous event on that date.
6. **Step 6**: **Availability Labeling**: Checks if the student explicitly declared an **`Available`** slot covering the entire event duration (labeled `"Explicitly Available"`) or has no declared conflict (labeled `"Available (No Declared Conflict)"`).
7. **Step 7**: **Ranking**: Sorts candidates by skill name, proficiency level (Professional &rarr; Advanced &rarr; Intermediate &rarr; Beginner), and years of experience in descending order.

---

## 16. How Participant Availability is Checked
Availability is checked using **time interval overlap mathematics**:
Two time intervals `[StartA, EndA]` and `[StartB, EndB]` on the same date overlap **if and only if**:
$$\text{StartA} < \text{EndB} \quad \text{AND} \quad \text{EndA} > \text{StartB}$$
- If a slot ends at 12:00 and another starts at 12:00, they are **adjacent**, NOT overlapping ($12:00 < 12:00$ is False). KalaConnect correctly permits adjacent slots!
- In the stored procedure, an explicit availability match requires:
  $$\text{slot.start\_time} \le \text{event.start\_time} \quad \text{AND} \quad \text{slot.end\_time} \ge \text{event.end\_time}$$

---

## 17. The Availability Validation Trigger (With Concrete Example)

### Why Use a Trigger?
Application code can be bypassed by direct database queries. A database trigger guarantees **100% data integrity directly at the storage engine level**.

### Trigger Code
```sql
CREATE TRIGGER trg_validate_availability_before_insert
BEFORE INSERT ON availability
FOR EACH ROW
BEGIN
    DECLARE v_overlap_count INT DEFAULT 0;

    -- Rule 1: Chronological validity
    IF NEW.start_time >= NEW.end_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid slot: start_time must be before end_time.';
    END IF;

    -- Rule 2: Overlap check for same participant on same date
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
END;
```

### Concrete Example:
1. Participant 1 has an existing slot: `10:00:00` to `12:00:00` on `2026-12-01`.
2. Someone attempts to insert a second slot: `11:00:00` to `13:00:00` on `2026-12-01`.
3. The trigger checks:
   - `existing.start_time (10:00) < NEW.end_time (13:00)` &rarr; **TRUE**
   - `existing.end_time (12:00) > NEW.start_time (11:00)` &rarr; **TRUE**
4. `v_overlap_count` becomes 1. The trigger executes `SIGNAL SQLSTATE '45000'`, terminating the transaction and returning an error to the user!

---

## 18. The Talent-Matching Stored Procedure (With Concrete Example)

### Purpose:
Encapsulate complex multi-table joins, subqueries, and ranking logic inside MySQL so the backend needs only a single `CALL` statement.

### Key Snippet of `sp_match_available_talents_for_event`:
```sql
SELECT 
    p.participant_id,
    p.full_name AS participant_name,
    p.email AS participant_email,
    p.college_id AS usn_or_roll,
    p.department,
    s.skill_name AS matching_skill,
    ps.proficiency_level,
    ps.years_of_experience,
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
    END AS availability_status
FROM event_requirements er
INNER JOIN skills s ON er.skill_id = s.skill_id
INNER JOIN participant_skills ps ON s.skill_id = ps.skill_id
INNER JOIN participants p ON ps.participant_id = p.participant_id
WHERE er.event_id = p_event_id
  -- Exclude Busy students
  AND NOT EXISTS (
      SELECT 1 FROM availability a
      WHERE a.participant_id = p.participant_id
        AND a.available_date = v_event_date
        AND a.status = 'Busy'
        AND a.start_time < v_end_time
        AND a.end_time > v_start_time
  )
  -- Exclude students Confirmed in simultaneous events
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
    ps.years_of_experience DESC;
```

---

## 19. Important SQL Queries and Joins Used in the System

### 1. The Deficit Headcount Query (Shows Unfilled Skill Quotas)
```sql
SELECT 
    e.event_id, e.event_name, e.event_date,
    o.full_name AS organizer_name,
    s.skill_name AS required_skill,
    er.required_count AS target_headcount,
    COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END) AS confirmed_headcount,
    (er.required_count - COUNT(CASE WHEN ptn.status = 'Confirmed' THEN 1 END)) AS deficit_headcount
FROM event_requirements er
INNER JOIN events e ON er.event_id = e.event_id
INNER JOIN organizers o ON e.organizer_id = o.organizer_id
INNER JOIN skills s ON er.skill_id = s.skill_id
LEFT JOIN participation ptn ON e.event_id = ptn.event_id
LEFT JOIN participant_skills ps ON ptn.participant_id = ps.participant_id AND ps.skill_id = s.skill_id
WHERE e.status = 'Scheduled'
GROUP BY e.event_id, e.event_name, e.event_date, o.full_name, s.skill_name, er.required_count
HAVING deficit_headcount > 0
ORDER BY deficit_headcount DESC;
```
*Concept*: Uses `INNER JOIN`, `LEFT JOIN`, conditional `COUNT(CASE WHEN)`, `GROUP BY`, and `HAVING` to filter groups where deficit > 0.

### 2. Popular Events Ranking (Window Functions)
```sql
SELECT 
    e.event_name, e.event_date, e.venue,
    COUNT(ptn.participation_id) AS total_registrations,
    DENSE_RANK() OVER (ORDER BY COUNT(ptn.participation_id) DESC) AS popularity_rank
FROM events e
LEFT JOIN participation ptn ON e.event_id = ptn.event_id
GROUP BY e.event_id, e.event_name, e.event_date, e.venue
ORDER BY popularity_rank ASC;
```
*Concept*: Uses `DENSE_RANK() OVER` window function for analytics.

---

## 20. Complete Participant Workflow
1. Student lands on **Participants** (`/participants`) &rarr; Clicks **"Register Participant"**.
2. Fills Name, Email, Phone, USN, Department, and Year of Study.
3. System saves record into `participants` table.
4. Student navigates to **My Skills** (`/skills`), selects their profile, chooses a skill (e.g., 'Bharatanatyam'), and assigns proficiency and experience.
5. Student navigates to **Availability** (`/availability`) and declares free time slots (e.g., Saturday 10:00 to 14:00).
6. The participant is now discoverable by organizers across campus.

---

## 21. Complete Organizer Workflow
1. Organizer navigates to **Events & Reqs** (`/events`) &rarr; Clicks **"Create Cultural Event"**.
2. Enters Event Title, Date, Start Time, End Time, Venue, and Description.
3. Clicks **"Requirements"** on the event card &rarr; Clicks **"Add Requirement"** &rarr; Selects skill and target headcount.
4. Clicks **"Launch Talent Matcher"** &rarr; Review qualified, available students returned by stored procedure.
5. Clicks **"Register"** next to a candidate performer.
6. Navigates to **Roster & Approvals** (`/participation`) &rarr; Updates status to **Confirmed**.
7. The participant is confirmed, the deficit decreases, and any conflicting bookings in simultaneous events are prevented.

---

## 22. Testing Performed & Verification Results
- **14 E2E Test Scenarios Executed**: Verified against live MySQL database instance with 100% pass rate.
- **Trigger Tests**: Overlapping slots rejected; adjacent slots permitted; self-updates without conflict permitted.
- **Stored Procedure Tests**: Conflict-free matching verified; double-booking exclusion confirmed.
- **Vite Production Build**: Compiled with **0 errors and 0 warnings** (98 modules, 422 kB JS).
- **All 17 API Endpoints Tested**: Probed and passing with HTTP 200/201.

---

## 23. Main Challenges and How They Were Solved
1. **Challenge: Two Separate Codebases from Member 1 and Member 2**
   - *Problem*: Member 1 used `backend/` and `frontend/`, while Member 2 used `server/` and `client/`.
   - *Solution*: Merged all controllers, routes, and services into a unified Express server (`backend/server.js`) and unified React SPA (`frontend/src`), while maintaining complete backward compatibility.
2. **Challenge: Double-Booking Prevention Across Simultaneous Events**
   - *Problem*: A participant could register for Event A and Event B taking place at the same hour.
   - *Solution*: Implemented a dual defense: the stored procedure excludes double-booked students from candidate results, and database trigger `trg_validate_participant_availability_before_booking` blocks any insert if the student is already confirmed elsewhere.
3. **Challenge: Avoiding Self-Conflict on Availability Update**
   - *Problem*: Updating an availability slot's status triggered the overlap check against itself.
   - *Solution*: Added `availability_id <> OLD.availability_id` to the `BEFORE UPDATE` trigger.

---

## 24. Possible Future Enhancements
- Automated email and SMS alerts via Nodemailer / Twilio.
- Direct video sample uploads to cloud storage (AWS S3 / Cloudinary).
- Stage-day QR code scanning for instant attendance logging.
- JWT-based authentication with role-based authorization for students and faculty.

---

## SECTION A: Mini-Project Demonstration Guide for Faculty

Follow this exact sequence during your college viva demonstration:

### Step 1: Open the Application
1. Start backend: `npm run backend` (runs on `http://localhost:5000`).
2. Start frontend: `npm run frontend` (runs on `http://localhost:5173`).
3. Open browser at `http://localhost:5173`. Show the **Integrated Dashboard** displaying both Member 1 KPIs (Participants, Skills, Slots) and Member 2 KPIs (Events, Deficits, Registrations).

### Step 2: Demonstrate Member 1 Scope (Participant & Skills)
1. Click **"Participants"** in the top navigation.
2. Register a new test student:
   - Name: `Pooja Hegde`
   - Email: `pooja.demo@college.edu`
   - Phone: `9876543219`
   - USN: `1MS21CS101`
   - Department: `Computer Science`
   - Year: `3`
3. Click **"My Skills"** &rarr; Select `Pooja Hegde` &rarr; Add skill:
   - Skill: `Bharatanatyam`
   - Proficiency: `Advanced`
   - Experience: `5.0 years`

### Step 3: Demonstrate Database Trigger (Availability Validation)
1. Click **"Availability"** &rarr; Select `Pooja Hegde`.
2. Add a valid slot: Date `2026-11-20`, `14:00` to `18:00`, Status `Available`. The slot is created.
3. **Show Trigger Rejection**: Attempt to add an overlapping slot:
   - Date: `2026-11-20`
   - Start: `15:00`
   - End: `19:00`
4. Show the error banner: **"Overlapping slot: participant already has a slot that overlaps on this date."**
5. Explain to faculty: *"This rejection is enforced directly by MySQL trigger `trg_validate_availability_before_insert`."*

### Step 4: Demonstrate Member 2 Scope (Events & Requirements)
1. Click **"Events & Reqs"** &rarr; Click **"Create Cultural Event"**.
2. Enter:
   - Title: `Natya Utsav 2026`
   - Organizer: Select any coordinator
   - Date: `2026-11-20`
   - Time: `15:00` to `17:00`
   - Venue: `Kuvempu Auditorium`
3. Open the newly created event &rarr; Click **"Add Requirement"**:
   - Skill: `Bharatanatyam`
   - Required Count: `1`

### Step 5: Demonstrate Talent Matching (Stored Procedure)
1. Click **"Launch Talent Matcher"**.
2. Show that `Pooja Hegde` is listed as the **#1 matching candidate** with status `"Explicitly Available"` because she possesses the skill and has a declared free slot covering `15:00 - 17:00`.
3. Explain to faculty: *"This result is produced by MySQL stored procedure `sp_match_available_talents_for_event`."*

### Step 6: Demonstrate Participation Approval & Conflict Prevention
1. In Talent Matcher, click **"Register"** next to `Pooja Hegde`.
2. Navigate to **"Roster & Approvals"** &rarr; Change her status from `Registered` to `Confirmed`.
3. Navigate to **"Deficits & Reports"** &rarr; Show that the deficit for `Natya Utsav 2026` dropped to 0!
4. Show that if another simultaneous event attempts to book her, the trigger blocks it with: *"Cannot register: participant is already confirmed for another event at this time."*

---

## SECTION B: Viva Voce Preparation (28 Questions & Answers)

### General & Project Concepts
**Q1: What is the main objective of KalaConnect?**  
*Answer:* KalaConnect centralizes cultural talent profiles and availability schedules in colleges, using MySQL stored procedures and triggers to match performers to events without scheduling clashes or double-booking.

**Q2: What is the tech stack used?**  
*Answer:* Frontend: React 19, Vite, Tailwind CSS, React Router DOM. Backend: Node.js, Express.js. Database: MySQL Community Server 8.0 with `mysql2`.

**Q3: Why did you separate Member 1 and Member 2 scopes?**  
*Answer:* To divide concerns clearly: Member 1 owns the Participant and Talent Identity subsystem (participants, activities, skills, availability, and overlap triggers). Member 2 owns the Event and Coordination subsystem (organizers, events, requirements, talent-matching stored procedures, and participation lifecycle).

---

### Database & MySQL Concepts
**Q4: What normal form is your database in?**  
*Answer:* Third Normal Form (3NF). Every table has a primary key, all non-key attributes are fully functionally dependent on the primary key (no partial dependencies &ndash; 2NF), and there are no transitive dependencies (3NF).

**Q5: What is the difference between a Trigger and a Stored Procedure?**  
*Answer:* A **Trigger** executes automatically in response to database events (`BEFORE/AFTER INSERT, UPDATE, DELETE`). A **Stored Procedure** is a named, precompiled set of SQL statements that must be explicitly called (`CALL procedure_name`). In our project, triggers enforce data integrity (availability overlap checks), while stored procedures implement business workflows (talent matching).

**Q6: What is a Composite Primary Key? Where is it used?**  
*Answer:* A primary key composed of two or more columns. We use it in `participant_skills(participant_id, skill_id)` to ensure a student cannot be assigned the same skill more than once.

**Q7: What are Foreign Key Constraints and Referential Actions?**  
*Answer:* Foreign keys enforce relationships between tables. We use `ON DELETE CASCADE` on `availability` (if a participant is removed, their slots are deleted) and `ON DELETE RESTRICT` on `skills` (a cultural activity cannot be deleted if skills still reference it).

**Q8: What is `SIGNAL SQLSTATE '45000'` in MySQL?**  
*Answer:* It is the standard ANSI SQL command to raise an unhandled user-defined exception inside a trigger or stored procedure, causing the transaction to abort and roll back.

**Q9: How do you prevent overlapping availability slots in MySQL?**  
*Answer:* Using the interval overlap condition in a `BEFORE INSERT` trigger:  
`existing.start_time < NEW.end_time AND existing.end_time > NEW.start_time` on the same date for the same participant.

**Q10: What is the difference between `INNER JOIN` and `LEFT JOIN`?**  
*Answer:* `INNER JOIN` returns only rows that have matching values in both tables. `LEFT JOIN` returns all rows from the left table and matched rows from the right table, filling with NULL if no match exists. We use `LEFT JOIN` in reports to include events even if they have zero registrations.

**Q11: What is a Window Function? Where did you use it?**  
*Answer:* A function that performs calculations across a set of table rows related to the current row without collapsing them like `GROUP BY`. We used `DENSE_RANK() OVER (ORDER BY COUNT(ptn.participation_id) DESC)` to rank events by popularity.

**Q12: How does `FIELD()` function work in MySQL?**  
*Answer:* It returns the index position of a string in a specified list. We used `FIELD(ps.proficiency_level, 'Professional', 'Advanced', 'Intermediate', 'Beginner')` to order candidates custom-ranked by proficiency.

**Q13: Why did you use `START TRANSACTION`, `COMMIT`, and `ROLLBACK`?**  
*Answer:* Inside `sp_register_event_participation`, we use transactions to guarantee Atomicity. If checking skill requirements fails, the transaction is rolled back so no partial data is written.

---

### Backend & Node.js / Express
**Q14: Why did you use `mysql2/promise` instead of the default `mysql` package?**  
*Answer:* `mysql2/promise` supports modern ES6 `async/await` syntax, connection pooling, prepared statements, and multiple statement execution.

**Q15: What is Connection Pooling? Why is it better than a single connection?**  
*Answer:* A connection pool maintains a cache of active database connections that can be reused across incoming HTTP requests. Opening a new TCP connection on every request causes high latency; a pool significantly improves performance.

**Q16: How do you prevent SQL Injection in your backend?**  
*Answer:* By always using parameterized queries with placeholders (`?`) instead of concatenating strings. Values are escaped and handled as parameters by the MySQL protocol.

**Q17: What does `cors` middleware do?**  
*Answer:* Cross-Origin Resource Sharing (CORS) is a browser security feature. Since the frontend runs on port 5173 and the backend runs on port 5000, `cors` permits the frontend to make requests to the backend.

**Q18: What is the purpose of `.env`?**  
*Answer:* To store environment-specific configurations (database passwords, ports) separately from application source code. It is added to `.gitignore` so secrets are never pushed to public repositories.

---

### Frontend & React
**Q19: What is Vite and why did you choose it over Create React App (CRA)?**  
*Answer:* Vite uses native ES modules and Rollup/Rolldown, providing near-instant server startup and rapid Hot Module Replacement (HMR). Create React App is deprecated and much slower.

**Q20: What is the purpose of React Router DOM?**  
*Answer:* It enables client-side routing in Single-Page Applications, dynamically rendering matching components based on the URL path without reloading the entire HTML page.

**Q21: How do you handle loading and error states in React?**  
*Answer:* We use state variables: `const [loading, setLoading] = useState(true)` and `const [error, setError] = useState('')`. We display a spinner component while data is fetching, and an alert banner if a request fails.

**Q22: What is the role of `useEffect` in your dashboard?**  
*Answer:* `useEffect` with an empty dependency array `[]` runs once after the component mounts, triggering API calls to fetch statistics and table data from Express.

---

### System Integration & Workflows
**Q23: How does the application prevent double-booking a performer?**  
*Answer:* At two levels:
1. In `sp_match_available_talents_for_event`, candidates who are already `Confirmed` in another event at the same date and overlapping time are excluded from search results.
2. In trigger `trg_validate_participant_availability_before_booking`, any insert into `participation` with conflicting confirmed bookings is rejected with error 45000.

**Q24: What statuses can a participation request have?**  
*Answer:* Five statuses: `Registered` (Initial request/application) &rarr; `Shortlisted` (Under review) &rarr; `Confirmed` (Approved & locked) &rarr; `Attended` (Present at event) / `Cancelled` (Withdrawn or rejected).

**Q25: What is a Deficit Report?**  
*Answer:* A report calculated by subtracting the number of `Confirmed` performers for a skill requirement from the `required_count`. If required is 2 and confirmed is 0, the deficit is 2, indicating recruitment is needed.

**Q26: What happens if an organizer tries to delete an event that has participation records?**  
*Answer:* Because the foreign key on `participation(event_id)` is configured with `ON DELETE CASCADE`, all linked participation records are cleanly removed automatically.

**Q27: Can a student have multiple skills in KalaConnect?**  
*Answer:* Yes. Through the `participant_skills` junction table, one student can register multiple skills with individual proficiency levels (e.g., Advanced in Carnatic Vocal and Intermediate in Acoustic Guitar).

**Q28: How do you verify database connectivity at server boot?**  
*Answer:* In `server.js`, we execute `await testConnection()` before `app.listen()`. It borrows a connection from the pool, logs the host and database name, and immediately releases it.

---

## SECTION C: Detailed Member Contribution Breakdown

### Member 1: Participant Identity, Skills & Availability
- **Database Tables**:
  - `participants`
  - `cultural_activities`
  - `skills`
  - `participant_skills`
  - `availability`
- **Database Trigger**:
  - `trg_validate_availability_before_insert` (Validates slot times and rejects overlapping participant intervals).
  - `trg_validate_availability_before_update` (Prevents slot self-conflicts during updates).
- **Backend APIs**:
  - `/api/participants` (CRUD participants)
  - `/api/participants/:id/skills` (CRUD participant skills and proficiency)
  - `/api/participants/:id/availability` (CRUD participant free slots)
  - `/api/activities` (Catalog lookup)
  - `/api/talents/search` (Multi-criteria talent search)
- **Frontend Pages**:
  - `Participants.jsx` (Student registration and management)
  - `MySkills.jsx` (Skill and proficiency assignment)
  - `Availability.jsx` (Availability calendar and slots)
  - `Activities.jsx` (Cultural category explorer)
  - `TalentSearch.jsx` (Performer search directory)

### Member 2: Event Planning, Stored Procedures & Coordination
- **Database Tables**:
  - `organizers`
  - `events`
  - `event_requirements`
  - `participation`
- **Stored Procedures**:
  - `sp_match_available_talents_for_event` (Automated conflict-free candidate ranking).
  - `sp_register_event_participation` (Transactional registration with requirement verification).
- **Database Trigger**:
  - `trg_validate_participant_availability_before_booking` (Blocks booking students marked 'Busy' or already 'Confirmed' elsewhere).
- **Backend APIs**:
  - `/api/organizers` (CRUD organizers)
  - `/api/events` (CRUD events and skill quotas)
  - `/api/events/:id/match-talents` (Invokes stored procedure)
  - `/api/events/:id/register` (Transactional participation request)
  - `/api/participation/:id/status` (Approval & status transitions)
  - `/api/reports/...` (Deficit analysis, Popular events, Department distribution)
- **Frontend Components**:
  - `EventsManager.jsx` (Event scheduling and filters)
  - `EventDetail.jsx` (Event skill quotas and fulfillment management)
  - `TalentMatcher.jsx` (Interactive candidate matching via stored procedure)
  - `ParticipationManager.jsx` (Participation requests, approval, and roster management)
  - `ReportsView.jsx` (Deficit reports, popularity ranking, department distribution)
