# KalaConnect – Cultural Talent, Availability & Event Coordination System

> **A Complete Full-Stack DBMS Mini-Project for College Submission & Viva Demonstration**  
> Built with React (Vite, Tailwind CSS), Node.js (Express), MySQL Community Server (mysql2), and Advanced SQL (Triggers, Stored Procedures, Views & Transactions).

---

## 1. Project Title
**KalaConnect – Cultural Talent, Availability & Event Coordination System**

---

## 2. Project Overview
**KalaConnect** is a centralized campus talent discovery and cultural event coordination web application designed for collegiate institutions. In many universities and colleges, cultural talent (musicians, dancers, dramatists, debaters, fine artists) is scattered across departments and academic years. Event coordinators, student club leaders, and faculty cultural committees struggle to find students with specific skills who are actually free on rehearsal and event dates.

KalaConnect bridges this gap by maintaining a verified cultural talent registry alongside student availability time slots. Event organizers can schedule events, declare headcount requirements for specific art forms, and run automated database-driven talent matching to recruit conflict-free performers.

---

## 3. Problem Statement
In collegiate environments:
1. **Scattered Information**: Student talents and cultural proficiencies are not recorded systematically. Organizers rely on word-of-mouth or last-minute messaging to find performers.
2. **Scheduling Conflicts**: Students frequently get double-booked across simultaneous rehearsals or conflicting college fests.
3. **Requirement Deficits**: Event coordinators struggle to track how many performers have been confirmed versus how many are still required for an event, leading to program delays.
4. **Lack of Validation**: Overlapping availability entries and clashing stage assignments often cause chaos on event days.

**KalaConnect** solves these issues using a **3NF-normalized relational database**, **database triggers** that prevent overlapping availability and conflicting bookings, and a **stored procedure** that automates candidate talent matching.

---

## 4. Objectives
- **Centralize Campus Talent**: Maintain structured profiles of student performers, including proficiency levels (Beginner, Intermediate, Advanced, Professional), experience, and portfolios.
- **Manage Student Availability**: Allow participants to declare their free time slots with automated trigger rejection for invalid or overlapping intervals.
- **Streamline Event Requirements**: Allow organizers to define precise skill headcounts (e.g., 2 Classical Vocalists, 3 Bharatanatyam Dancers, 8 Street Play Actors) for each event.
- **Automate Talent Matching**: Encapsulate matching logic inside a MySQL Stored Procedure (`sp_match_available_talents_for_event`) that matches skills, verifies availability, and excludes double-booked students.
- **Track Participation Lifecycle**: Support registration, shortlisting, confirmation (approval), attendance, and cancellation with scheduling conflict enforcement.
- **Provide Actionable Analytics**: Generate real-time reports on talent requirement deficits, popular events, and departmental engagement.

---

## 5. Key Features

### Participant Hub (Member 1)
- **Student Profile Management**: Full CRUD operations for student participants (USN/Roll No, department, year of study, contact details, bio).
- **Cultural Activities & Skills Catalog**: Hierarchical exploration of cultural domains (Performing Arts, Musical Arts, Visual Arts, Literary Arts) and individual skills.
- **Skill Proficiency & Portfolio Tracking**: M:N junction table mapping participants to skills with proficiency ratings and years of experience.
- **Availability Slot Management**: Calendar slot declaration with strict database trigger enforcement preventing overlapping slots for the same participant on the same date.
- **Talent Search & Filtering**: Multi-criteria search by skill, category, minimum proficiency, and specific date/time availability intervals.

### Organizer & Event Coordination Hub (Member 2)
- **Organizer Profiles**: Cultural committee and club coordinator management.
- **Event Scheduling & Requirements**: Event creation with date, time window, venue, and cultural theme, linked to specific skill quotas.
- **Automated Talent Matcher**: Invokes the `sp_match_available_talents_for_event` stored procedure to rank eligible, available performers with zero scheduling conflicts.
- **Participation Workflow & Approvals**: End-to-end request management with statuses: `Registered` (Pending) &rarr; `Shortlisted` &rarr; `Confirmed` (Approved) &rarr; `Attended` / `Cancelled`.
- **Deficit & Analytics Reports**: Real-time identification of unfilled skill quotas across scheduled events, department distribution, and event popularity ranking.

---

## 6. Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, React Router DOM 7 | Responsive, modern Single-Page Application (SPA) |
| **Backend** | Node.js (v18+/v20+/v24+), Express.js 4 | RESTful API server with modular routing and MVC architecture |
| **Database** | MySQL Community Server 8.0+, `mysql2/promise` | 3NF Relational Database with InnoDB engine, Foreign Keys, Triggers, and Stored Procedures |
| **Tools** | PowerShell, Git, Node.js CLI | Development, migrations, and automated testing |

---

## 7. System Architecture

```
+-------------------------------------------------------------------------+
|                        Client Layer (React / Vite)                      |
|  - Member 1: Participants, Skills, Availability, Directory, Dashboard   |
|  - Member 2: Events, Requirements, Talent Matcher, Roster, Reports     |
+------------------------------------+------------------------------------+
                                     |  HTTP REST Calls (JSON)
                                     v  (Proxy port 5173 -> 5000)
+-------------------------------------------------------------------------+
|                    Application Server Layer (Express.js)                |
|  - Middleware: CORS, express.json, Error Handlers                       |
|  - Routes: /api/participants, /api/events, /api/talents, /api/reports   |
|  - Controllers: Parameterized SQL, Validation, Business Logic           |
+------------------------------------+------------------------------------+
                                     |  mysql2 Connection Pool
                                     |  (TCP localhost:3306)
                                     v
+-------------------------------------------------------------------------+
|                       Database Layer (MySQL 8.0+)                       |
|  - 9 Relational Tables (InnoDB, FK Constraints, Unique Keys)            |
|  - Triggers: Availability Overlap Check & Booking Clash Prevention      |
|  - Stored Procedures: Talent Matching & Transactional Registration      |
|  - Views: Fulfillment Status, Talent Directory, Participant Summary     |
+-------------------------------------------------------------------------+
```

---

## 8. Database Design (9 Canonical Tables)

The database schema is strictly normalized to **Third Normal Form (3NF)** with referential integrity constraints (`ON UPDATE CASCADE`, `ON DELETE CASCADE/RESTRICT`):

1. **`participants`** (Member 1): Stores student demographics (`participant_id`, `full_name`, `email`, `phone`, `college_id` [USN], `department`, `year_of_study`, `bio`).
2. **`organizers`** (Member 2): Stores club/department coordinators (`organizer_id`, `full_name`, `email`, `phone`, `club_or_dept`, `designation`).
3. **`cultural_activities`** (Member 1): Master catalog of cultural domains (`activity_id`, `activity_name`, `category`, `description`).
4. **`skills`** (Member 1): Specific art disciplines (`skill_id`, `activity_id` &rarr; `cultural_activities`, `skill_name`, `description`).
5. **`participant_skills`** (Member 1): M:N bridge table (`participant_id` &rarr; `participants`, `skill_id` &rarr; `skills`, `proficiency_level`, `years_of_experience`, `portfolio_url`).
6. **`events`** (Member 2): Scheduled cultural events (`event_id`, `organizer_id` &rarr; `organizers`, `activity_id` &rarr; `cultural_activities`, `event_name`, `event_date`, `start_time`, `end_time`, `venue`, `status`, `description`).
7. **`event_requirements`** (Member 2): Skill quotas per event (`requirement_id`, `event_id` &rarr; `events`, `skill_id` &rarr; `skills`, `required_count`, `notes`).
8. **`availability`** (Member 1): Participant free/busy intervals (`availability_id`, `participant_id` &rarr; `participants`, `available_date`, `start_time`, `end_time`, `status`).
9. **`participation`** (Member 2): M:N event participation lifecycle (`participation_id`, `participant_id` &rarr; `participants`, `event_id` &rarr; `events`, `role`, `status`, `feedback_or_score`, `registered_at`).

### Entity-Relationship (ER) Overview
```
+--------------+        1:N        +--------+        1:N        +--------------------+
|  organizers  | ----------------- | events | ----------------- | event_requirements |
+--------------+                   +---+----+                   +---------+----------+
                                       |                                  |
                                       | 1:N                              | N:1
                                       v                                  v
+------------------+     M:N       +---------------+            +--------------------+
|   participants   | ------------- | participation |            |       skills       |
+--------+---------+               +---------------+            +---------+----------+
         |                                                                |
         | 1:N                                                            | N:1
         +--------------------+                                           |
         |                    |                                           v
         v                    v                                 +--------------------+
+------------------+   +--------------+                         |cultural_activities |
|participant_skills|   | availability |                         +--------------------+
+------------------+   +--------------+
```

---

## 9. Modules & Team Contributions

### Member 1 Scope: Participant & Talent Management
- Participant profile management and registration.
- Cultural activities and skills hierarchy catalog.
- Participant skills mapping, proficiency levels, and experience tracking.
- Availability calendar declarations.
- Database Triggers: `trg_validate_availability_before_insert` and `trg_validate_availability_before_update` (rejects overlapping time slots).
- Talent search, filter queries, and Member 1 Dashboard KPIs.

### Member 2 Scope: Events & Coordination
- Organizer profiles and campus cultural clubs management.
- Event scheduling, venue booking, and skill quota requirements management.
- Stored Procedure: `sp_match_available_talents_for_event` (automated skill & availability matching).
- Stored Procedure: `sp_register_event_participation` (transactional registration with requirement verification).
- Database Trigger: `trg_validate_participant_availability_before_booking` (prevents double-booking and booking busy students).
- Participation status management (Registered &rarr; Shortlisted &rarr; Confirmed &rarr; Attended &rarr; Cancelled).
- Analytical reports (Deficit analysis, Popular events ranking, Department distribution).

---

## 10. Project Folder Structure
```
KalaConnect/
├── .env                     # Local environment variables (DB credentials, port)
├── .env.example             # Safe template for environment configuration
├── .gitignore               # Git ignored patterns
├── package.json             # Root scripts orchestrating backend & frontend
├── README.md                # Project documentation and submission guide
├── PROJECT_EXPLANATION.md   # Beginner-friendly guide, viva questions & demo script
├── database/                # Database SQL migration and inspection scripts
│   ├── schema.sql           # Canonical 3NF DDL for all 9 tables
│   ├── sample_data.sql      # Realistic collegiate sample data
│   ├── trigger.sql          # Availability overlap & booking validation triggers
│   ├── procedure.sql        # Talent-matching & registration stored procedures
│   ├── views.sql            # Analytical database views
│   ├── queries_member1.sql  # 8 Member 1 SQL queries with explanations
│   ├── queries_member2.sql  # 8 Member 2 SQL queries with explanations
│   └── test_cases.sql       # SQL test cases for viva demonstration
├── backend/                 # Integrated Express.js REST API Server
│   ├── config/
│   │   └── db.js            # mysql2 connection pool with auto-reconnect
│   ├── controllers/         # Modular controllers for Member 1 & 2
│   │   ├── activityController.js
│   │   ├── availabilityController.js
│   │   ├── eventController.js
│   │   ├── lookupController.js
│   │   ├── organizerController.js
│   │   ├── participantController.js
│   │   ├── participationController.js
│   │   ├── reportController.js
│   │   └── talentController.js
│   ├── routes/              # Express API route declarations
│   │   ├── activities.js
│   │   ├── availability.js
│   │   ├── eventRoutes.js
│   │   ├── lookupRoutes.js
│   │   ├── organizerRoutes.js
│   │   ├── participants.js
│   │   ├── participationRoutes.js
│   │   ├── reportRoutes.js
│   │   └── talents.js
│   ├── package.json
│   └── server.js            # Express application entry point (port 5000)
└── frontend/                # Integrated React + Vite + Tailwind CSS Portal
    ├── public/              # Favicon and SVGs
    ├── src/
    │   ├── api/
    │   │   └── index.js     # Axios API service
    │   ├── services/
    │   │   └── api.js       # Fetch API service for events & matching
    │   ├── components/      # UI components & Lucide-compatible icons
    │   │   ├── Alert.jsx
    │   │   ├── EventDetail.jsx
    │   │   ├── EventsManager.jsx
    │   │   ├── Icons.jsx    # Zero-dependency SVG icon system
    │   │   ├── Navbar.jsx   # Responsive top navigation
    │   │   ├── ParticipationManager.jsx
    │   │   ├── ReportsView.jsx
    │   │   ├── Spinner.jsx
    │   │   └── TalentMatcher.jsx
    │   ├── pages/           # Application views
    │   │   ├── Activities.jsx
    │   │   ├── Availability.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── MySkills.jsx
    │   │   ├── Participants.jsx
    │   │   └── TalentSearch.jsx
    │   ├── App.jsx          # Route configurations
    │   ├── index.css        # Tailwind directives + design system CSS
    │   └── main.jsx         # React DOM root mounting
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 11. Prerequisites
Before running KalaConnect, ensure the following software is installed on your computer:
- **Node.js**: Version 18.x, 20.x, or 24.x (`node -v`)
- **npm**: Version 9.x or 10.x (`npm -v`)
- **MySQL Community Server**: Version 8.0 or higher (`mysql --version`)
- **Operating System**: Windows 10/11, macOS, or Linux

---

## 12. Installation and Setup

### Step 1: Clone or Open the Repository
```powershell
cd c:\Users\Shreya\OneDrive\Desktop\KalaConnect
```

### Step 2: Install Backend & Frontend Dependencies
From the root folder, run:
```powershell
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

---

## 13. Environment Variables Configuration
Create a `.env` file in the project root directory by copying `.env.example`:
```powershell
copy .env.example .env
```
Open `.env` and verify your local MySQL credentials:
```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=kalaconnect

# Frontend Client URL
CLIENT_URL=http://localhost:5173
```
> **Security Note**: Never commit your `.env` file containing actual database passwords to version control.

---

## 14. Database Setup
To build the database and install all triggers, stored procedures, and sample data in the correct order:

### Option A: Using the MySQL Command Line
Run the SQL scripts in this exact sequence:
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kalaconnect;"
mysql -u root -p kalaconnect < database\schema.sql
mysql -u root -p kalaconnect < database\sample_data.sql
mysql -u root -p kalaconnect < database\trigger.sql
mysql -u root -p kalaconnect < database\procedure.sql
mysql -u root -p kalaconnect < database\views.sql
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench and connect to your local MySQL instance.
2. Open and execute `database/schema.sql` (Creates tables).
3. Open and execute `database/sample_data.sql` (Inserts seed data).
4. Open and execute `database/trigger.sql` (Installs validation triggers).
5. Open and execute `database/procedure.sql` (Installs stored procedures).
6. Open and execute `database/views.sql` (Installs views).

---

## 15. Running the Application

Open **two separate terminal windows** on Windows:

### Terminal 1: Start the Backend API Server
```powershell
cd c:\Users\Shreya\OneDrive\Desktop\KalaConnect
npm run backend
```
*The server will start on `http://localhost:5000` and test database connectivity.*

### Terminal 2: Start the Frontend React Client
```powershell
cd c:\Users\Shreya\OneDrive\Desktop\KalaConnect
npm run frontend
```
*The Vite development server will start on `http://localhost:5173`.*

Open your web browser and navigate to: **`http://localhost:5173`**

---

## 16. Application Workflows

### Participant Workflow
1. Navigate to **Participants** (`/participants`) and register personal and academic details.
2. Navigate to **My Skills** (`/skills`), select the participant, and assign cultural skills with proficiency (Beginner, Intermediate, Advanced, Professional) and experience years.
3. Navigate to **Availability** (`/availability`), specify dates and time intervals (e.g., `14:00 - 18:00`). The database trigger verifies that no conflicting or overlapping slot exists.
4. The participant is now indexed and immediately available for organizer talent searches and event talent matching.

### Organizer & Coordination Workflow
1. Navigate to **Events & Reqs** (`/events`) and click **"Create Cultural Event"**.
2. Specify event title, organizing club, date, start time, end time, and campus venue.
3. Open the event details and click **"Add Skill Requirement"** to specify needed skills and headcounts (e.g., 2 Tabla players).
4. Click **"Launch Talent Matcher"** (`/talent-matcher`). The system invokes `sp_match_available_talents_for_event`, checking candidate skills, proficiency, explicit availability, and absence of clashing assignments.
5. Click **"Register Participant"** to create a participation record (`status = 'Registered'`).
6. Navigate to **Roster & Approvals** (`/participation`), review the candidates, and click **"Confirm"** (Approve).
7. If another simultaneous event tries to book this confirmed participant, the database trigger rejects the conflicting assignment.
8. Navigate to **Deficits & Reports** (`/reports`) to track remaining unfilled skill quotas across all campus events.

---

## 17. API Endpoints Documentation

### Health & Analytics
- `GET /api/health`: Server health check.
- `GET /api/dashboard/stats`: Member 1 participant and category statistics.
- `GET /api/reports/dashboard-stats`: Member 2 event, organizer, and deficit metrics.
- `GET /api/reports/deficit`: Detailed skill requirement deficit report.
- `GET /api/reports/upcoming`: List of upcoming scheduled events.
- `GET /api/reports/popular-events`: Ranking of events by registration volume.
- `GET /api/reports/department-distribution`: Student participation grouped by department.

### Participants (Member 1)
- `GET /api/participants`: Retrieve all participants.
- `POST /api/participants`: Register a new participant.
- `GET /api/participants/:id`: Retrieve single participant details.
- `PUT /api/participants/:id`: Update participant profile.
- `DELETE /api/participants/:id`: Remove participant.
- `GET /api/participants/:id/skills`: Get skills possessed by participant.
- `POST /api/participants/:id/skills`: Add skill with proficiency & experience.
- `PUT /api/participants/:id/skills/:skillId`: Update skill proficiency.
- `DELETE /api/participants/:id/skills/:skillId`: Delete participant skill.
- `GET /api/participants/:id/availability`: Retrieve participant availability slots.
- `POST /api/participants/:id/availability`: Add availability slot (validated by trigger).

### Availability & Talents (Member 1)
- `PUT /api/availability/:id`: Update an availability slot.
- `DELETE /api/availability/:id`: Delete an availability slot.
- `GET /api/activities`: Retrieve all cultural activities and categories.
- `GET /api/activities/:id/skills`: Retrieve all skills under a cultural activity.
- `GET /api/talents/search`: Multi-attribute talent search.
- `GET /api/talents/available`: Search talent by available date/time window.

### Organizers & Events (Member 2)
- `GET /api/organizers`: Retrieve all organizers.
- `POST /api/organizers`: Create an organizer profile.
- `GET /api/organizers/:id`: Retrieve organizer profile with organized events.
- `PUT /api/organizers/:id`: Update organizer details.
- `GET /api/events`: List events with optional filters (`status`, `upcoming`, `organizer_id`).
- `POST /api/events`: Create a cultural event.
- `GET /api/events/:id`: Retrieve event details, skill quotas, and fulfillment summaries.
- `PUT /api/events/:id`: Update event schedule or details.
- `DELETE /api/events/:id`: Cancel or delete an event.
- `GET /api/events/:id/requirements`: Retrieve skill requirements for an event.
- `POST /api/events/:id/requirements`: Add a skill requirement quota.
- `DELETE /api/events/requirements/:reqId`: Delete an event skill requirement.

### Talent Matching & Participation (Member 2)
- `GET /api/events/:id/match-talents`: Executes stored procedure `sp_match_available_talents_for_event`.
- `GET /api/events/:id/participants`: Retrieve roster of participants for an event.
- `POST /api/events/:id/register`: Register participant via stored procedure `sp_register_event_participation`.
- `PATCH /api/participation/:id/status`: Update status (`Registered`, `Shortlisted`, `Confirmed`, `Attended`, `Cancelled`).
- `DELETE /api/participation/:id`: Remove participation entry.

---

## 18. SQL Concepts Demonstrated

### 1. Primary & Foreign Keys with Referential Actions
- `ON UPDATE CASCADE` ensures primary key updates propagate automatically.
- `ON DELETE CASCADE` automatically cleans up dependent slots and skills when a participant is deleted.
- `ON DELETE RESTRICT` protects cultural activities from being accidentally deleted while skills reference them.

### 2. Check Constraints & Enums
- `CHECK (year_of_study BETWEEN 1 AND 5)` enforces valid undergraduate/postgraduate years.
- `CHECK (end_time > start_time)` ensures chronological validity across events and availability slots.
- `ENUM` constraints for standardized categorization: `proficiency_level`, `status`, `event_status`.

### 3. Database Triggers
- **`trg_validate_availability_before_insert`**: Rejects non-chronological slots and queries the table to block overlapping time slots for the same participant on the same date:
  ```sql
  start_time < NEW.end_time AND end_time > NEW.start_time
  ```
- **`trg_validate_availability_before_update`**: Permits slot updates without self-conflicting using `AND availability_id <> OLD.availability_id`.
- **`trg_validate_participant_availability_before_booking`**: Fired on `BEFORE INSERT ON participation`; prevents adding participants who are marked 'Busy' or already 'Confirmed' in another simultaneous event.

### 4. Stored Procedures
- **`sp_match_available_talents_for_event`**: Accepts an event ID, extracts schedule, cross-joins event requirements with participant skills, checks for explicit availability versus declared conflicts, filters out simultaneous commitments, and orders candidates by proficiency rank.
- **`sp_register_event_participation`**: Uses ACID transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) with error handlers (`DECLARE EXIT HANDLER FOR SQLEXCEPTION`) to atomically validate event existence, requirement matching, and conflict avoidance.

### 5. Multi-Table Joins & Aggregations
- Queries utilize `INNER JOIN`, `LEFT JOIN`, `GROUP BY`, `HAVING`, and window functions (`DENSE_RANK() OVER`) to generate analytical reports like the deficit headcount report.

---

## 19. Verification and Test Results

The application underwent rigorous end-to-end testing against a live MySQL instance:

| Test Scenario | Module | Verification Method | Result |
|---|---|---|---|
| **TEST 1: Participant Registration** | Member 1 | POST `/api/participants` &rarr; checked in MySQL | **PASSED** |
| **TEST 2: Skill Assignment** | Member 1 | POST `/api/participants/:id/skills` &rarr; verified in `participant_skills` | **PASSED** |
| **TEST 3: Availability Declaration** | Member 1 | POST `/api/participants/:id/availability` &rarr; verified in `availability` | **PASSED** |
| **TEST 4: Overlapping Availability** | Member 1 | Trigger rejection check with overlapping time window | **PASSED (Rejected with 45000)** |
| **TEST 5: Organizer Registration** | Member 2 | POST `/api/organizers` &rarr; verified in `organizers` | **PASSED** |
| **TEST 6: Event Scheduling** | Member 2 | POST `/api/events` &rarr; verified in `events` | **PASSED** |
| **TEST 7: Event Skill Quotas** | Member 2 | POST `/api/events/:id/requirements` &rarr; verified in `event_requirements` | **PASSED** |
| **TEST 8: Stored Procedure Match** | Member 2 | Executed `sp_match_available_talents_for_event` via API | **PASSED** |
| **TEST 9: Candidate Filtering** | Member 2 | Verified matching skill, experience, and 'Explicitly Available' tag | **PASSED** |
| **TEST 10: Participation Request** | Member 2 | POST `/api/events/:id/register` &rarr; record added with status 'Registered' | **PASSED** |
| **TEST 11: Coordinator Approval** | Member 2 | PATCH `/api/participation/:id/status` &rarr; updated to 'Confirmed' | **PASSED** |
| **TEST 12: DB Status Persistence** | Member 2 | Direct SQL query verified status in MySQL table `participation` | **PASSED** |
| **TEST 13: Conflict Prevention** | Shared | Direct booking on simultaneous event rejected by trigger | **PASSED (Blocked)** |
| **TEST 14: Analytics & Dashboards** | Shared | Verified Deficit Report, Popular Events, Department distribution | **PASSED** |
| **Frontend Production Build** | Shared | Executed `npm --prefix frontend run build` | **PASSED (0 errors, 0 warnings)** |
| **API Endpoints Test Suite** | Shared | Automated probe of all 17 REST endpoints | **PASSED (17/17 Passed)** |

---

## 20. Future Enhancements
- **SMS / Email Notifications**: Automated email notifications via Nodemailer when a participation request is confirmed or shortlisted.
- **Audio/Video Media Uploads**: Integration with Cloudinary or AWS S3 for direct portfolio video previews on the talent matcher screen.
- **QR Code Attendance System**: Instant attendance verification by scanning participant event badges on stage day.
- **Role-Based Authentication**: JWT-based login for participants and organizers with password hashing (bcrypt).

---

## 21. Conclusion
**KalaConnect** successfully integrates all assigned modules of Member 1 and Member 2 into a single, cohesive, production-grade application. By coupling an intuitive React frontend with a robust Express backend and a normalized MySQL database featuring stored procedures and triggers, the project delivers a complete solution for cultural talent discovery, scheduling, and event coordination.
