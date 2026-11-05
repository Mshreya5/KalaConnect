# KalaConnect — Testing Guide (Member 1)

## SQL Execution Order

Run these files in MySQL Workbench in this exact order:

```
1. database/schema.sql          — creates the kalaconnect database and all 9 tables
2. database/sample_data.sql     — inserts realistic seed records
3. database/trigger.sql         — creates all 3 triggers
4. database/views.sql           — creates all 4 views
5. database/test_cases.sql      — run trigger tests (see below)
6. database/queries_member1.sql — run Member 1 analytical queries
```

> Do NOT run `cleanup_and_setup.sql` unless you want to wipe and rebuild from scratch.

---

## Trigger Test Results (Expected)

| Test | Description | Expected Result |
|------|-------------|-----------------|
| TEST 1 | Valid slot on a new date | ✅ INSERT succeeds |
| TEST 2 | end_time before start_time | ❌ ERROR 1644: start_time must be before end_time |
| TEST 3 | start_time equals end_time | ❌ ERROR 1644: start_time must be before end_time |
| TEST 4 | Slot fully inside existing slot | ❌ ERROR 1644: Overlapping availability slot |
| TEST 5 | Adjacent slot (end == new start) | ✅ INSERT succeeds |
| TEST 6 | UPDATE extends slot into adjacent slot | ❌ ERROR 1644: Overlapping availability slot |
| TEST 7 | UPDATE shrinks slot (no conflict) | ✅ UPDATE succeeds |

### How to verify in MySQL Workbench

1. Open `test_cases.sql`
2. Run each test block individually using Ctrl+Enter (execute current statement)
3. For SHOULD FAIL tests: the Output panel shows `Error Code: 1644` with the trigger message
4. For SHOULD SUCCEED tests: the Output panel shows `1 row(s) affected`

---

## Backend API Tests (Manual — using browser or Postman)

Start the backend first:
```powershell
cd backend
npm run dev
```

| Endpoint | Method | Test Input | Expected |
|----------|--------|------------|----------|
| `/api/health` | GET | — | `{"status":"ok"}` |
| `/api/participants` | GET | — | Array of 7 participants |
| `/api/participants` | POST | `{"full_name":"Test","email":"t@t.com","phone":"9999999999","college_id":"TEST001","department":"Computer Science","year_of_study":2}` | 201 + participant_id |
| `/api/participants` | POST | same email again | 409 duplicate email error |
| `/api/participants/1` | GET | — | Aarav Sharma's profile |
| `/api/participants/1/skills` | GET | — | 2 skills (Hindustani Vocal, Acoustic Guitar) |
| `/api/activities` | GET | — | 5 activities |
| `/api/activities/1/skills` | GET | — | 3 dance skills |
| `/api/talents/search?skill=Bharatanatyam` | GET | — | Diya Iyer |
| `/api/talents/search?proficiency=Professional` | GET | — | Diya Iyer, Ananya Sen |
| `/api/talents/search?category=Performing Arts` | GET | — | Dance + Theatre artists |
| `/api/talents/available?date=2026-11-15&startTime=16:00&endTime=22:00` | GET | — | Aarav Sharma, Vikram Nair |
| `/api/participants/1/availability` | GET | — | 2 slots for Aarav |
| `/api/participants/1/availability` | POST | `{"available_date":"2026-12-10","start_time":"10:00","end_time":"14:00"}` | 201 + availability_id |
| `/api/participants/1/availability` | POST | overlapping slot same date | 409 overlap error from trigger |
| `/api/dashboard/stats` | GET | — | counts + category breakdown |

---

## Frontend Verification

Start the frontend:
```powershell
cd frontend
npm run dev
```
Open `http://localhost:5173` in a browser.

| Page | URL | What to verify |
|------|-----|----------------|
| Dashboard | `/` | Shows participant count, skill count, available slots, category table |
| Participants | `/participants` | Register form + table of 7 participants; edit/delete work |
| Activities | `/activities` | 5 activity cards; click to expand skills |
| My Skills | `/skills` | Select participant → see skills; add/edit/remove work |
| Availability | `/availability` | Select participant → see slots; add/edit/delete; overlap returns error |
| Talent Search | `/search` | Skill tab and Availability tab both return real data |

---

## Feature-to-Implementation Map

| Feature | Frontend Page | API Endpoint | DB Table / Query | Test |
|---------|--------------|--------------|------------------|------|
| Register participant | `/participants` | POST /api/participants | participants | API test row 3 |
| Duplicate email guard | `/participants` | POST /api/participants | participants UNIQUE | API test row 4 |
| View all participants | `/participants` | GET /api/participants | participants | API test row 2 |
| Edit participant | `/participants` | PUT /api/participants/:id | participants | Manual UI |
| Delete participant | `/participants` | DELETE /api/participants/:id | participants | Manual UI |
| Browse activities | `/activities` | GET /api/activities | cultural_activities | API test row 7 |
| Browse skills by activity | `/activities` | GET /api/activities/:id/skills | skills | API test row 8 |
| View participant skills | `/skills` | GET /api/participants/:id/skills | participant_skills | API test row 6 |
| Add skill | `/skills` | POST /api/participants/:id/skills | participant_skills | Manual UI |
| Update skill | `/skills` | PUT /api/participants/:id/skills/:skillId | participant_skills | Manual UI |
| Remove skill | `/skills` | DELETE /api/participants/:id/skills/:skillId | participant_skills | Manual UI |
| Search by skill name | `/search` | GET /api/talents/search?skill= | Q2 logic | API test row 10 |
| Filter by proficiency | `/search` | GET /api/talents/search?proficiency= | Q3 logic | API test row 11 |
| Filter by category | `/search` | GET /api/talents/search?category= | Q4 logic | API test row 12 |
| Add availability slot | `/availability` | POST /api/participants/:id/availability | availability | API test row 14 |
| Overlap rejection | `/availability` | POST /api/participants/:id/availability | trigger (T1) | TEST 4, API test row 15 |
| Invalid time rejection | `/availability` | POST /api/participants/:id/availability | trigger (T1) | TEST 2, TEST 3 |
| Adjacent slot allowed | `/availability` | POST /api/participants/:id/availability | trigger (T1) | TEST 5 |
| Update slot overlap check | `/availability` | PUT /api/availability/:id | trigger (T2) | TEST 6, TEST 7 |
| Find available talent | `/search` | GET /api/talents/available | Q7 logic | API test row 13 |
| Dashboard stats | `/` | GET /api/dashboard/stats | Q5, Q6 aggregates | API test row 16 |

---

## Setup Commands (Windows PowerShell)

```powershell
# 1. Clone / open project
cd "C:\Users\Shreya\OneDrive\Desktop\KalaConnect"

# 2. Create .env from template
Copy-Item .env.example .env
# Edit .env — set DB_PASSWORD to your MySQL root password

# 3. Install and start backend
cd backend
npm install
npm run dev        # runs on http://localhost:5000

# 4. Install and start frontend (new terminal)
cd ..\frontend
npm install
npm run dev        # runs on http://localhost:5173
```

### MySQL database initialisation (MySQL Workbench)

```
1. Connect to localhost:3306 with your root credentials
2. Open and run: database/schema.sql
3. Open and run: database/sample_data.sql
4. Open and run: database/trigger.sql
5. Open and run: database/views.sql
```

---

## Handoff Note for Member 2

The following are ready and stable for Member 2 to build on:

- **Tables**: `participants`, `cultural_activities`, `skills`, `participant_skills`, `availability` — fully seeded
- **Stub tables**: `organizers`, `events`, `event_requirements`, `participation` — seeded with sample data in `sample_data.sql`
- **Trigger**: `trg_validate_participant_availability_before_booking` (Member 2's trigger) is preserved in `trigger.sql` unchanged
- **Procedure**: `procedure.sql` is untouched
- **API contract**: All Member 1 endpoints are under `/api/participants`, `/api/activities`, `/api/talents`, `/api/availability`
- **Schema**: No column names or table names were changed — Member 2's queries and procedure will work against the same schema
- **CORS**: Backend allows `http://localhost:5173` by default; update `CLIENT_URL` in `.env` if Member 2's frontend runs on a different port
