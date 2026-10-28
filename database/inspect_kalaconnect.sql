-- =====================================================================
-- KalaConnect — Database Inspection Script (READ-ONLY)
-- Target Database: kalaconnect
-- Tool: MySQL Workbench (Run these queries one by one or all together)
-- Safety: 100% Read-Only. NO INSERT, UPDATE, DROP, ALTER, OR DELETE.
-- =====================================================================

USE kalaconnect;

-- ---------------------------------------------------------------------
-- QUERY 1: List All Tables in the 'kalaconnect' Database
-- Tells us every table that currently exists in your MySQL schema.
-- ---------------------------------------------------------------------
SELECT 
    TABLE_NAME AS `Table Name`,
    TABLE_ROWS AS `Estimated Rows (InnoDB)`,
    DATA_LENGTH AS `Data Size (Bytes)`,
    CREATE_TIME AS `Creation Date`,
    TABLE_COLLATION AS `Collation`
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'kalaconnect'
ORDER BY TABLE_NAME;


-- ---------------------------------------------------------------------
-- QUERY 2: Check Row Counts in Suspected Extra / Legacy Tables
-- (Run this to see if tables like artistprofiles or bookings have data)
-- ---------------------------------------------------------------------
SELECT 'artistprofiles' AS `Table`, COUNT(*) AS `Actual Row Count` FROM kalaconnect.artistprofiles
UNION ALL
SELECT 'artisttalents', COUNT(*) FROM kalaconnect.artisttalents
UNION ALL
SELECT 'bookings', COUNT(*) FROM kalaconnect.bookings;


-- ---------------------------------------------------------------------
-- QUERY 3: Check Row Counts Across the 9 Intended Schema Tables
-- (Tells us if any of the intended tables already contain records)
-- ---------------------------------------------------------------------
SELECT 'participants' AS `Table`, COUNT(*) AS `Row Count` FROM kalaconnect.participants
UNION ALL
SELECT 'organizers', COUNT(*) FROM kalaconnect.organizers
UNION ALL
SELECT 'cultural_activities', COUNT(*) FROM kalaconnect.cultural_activities
UNION ALL
SELECT 'skills', COUNT(*) FROM kalaconnect.skills
UNION ALL
SELECT 'participant_skills', COUNT(*) FROM kalaconnect.participant_skills
UNION ALL
SELECT 'events', COUNT(*) FROM kalaconnect.events
UNION ALL
SELECT 'event_requirements', COUNT(*) FROM kalaconnect.event_requirements
UNION ALL
SELECT 'availability', COUNT(*) FROM kalaconnect.availability
UNION ALL
SELECT 'participation', COUNT(*) FROM kalaconnect.participation;


-- ---------------------------------------------------------------------
-- QUERY 4: Inspect Columns, Types, Nullability, and Keys for All Tables
-- ---------------------------------------------------------------------
SELECT 
    TABLE_NAME AS `Table`,
    ORDINAL_POSITION AS `Col #`,
    COLUMN_NAME AS `Column Name`,
    COLUMN_TYPE AS `Data Type`,
    IS_NULLABLE AS `Nullable?`,
    COLUMN_KEY AS `Key (PRI/UNI/MUL)`,
    COLUMN_DEFAULT AS `Default Value`,
    EXTRA AS `Extra (e.g. auto_increment)`
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'kalaconnect'
ORDER BY TABLE_NAME, ORDINAL_POSITION;


-- ---------------------------------------------------------------------
-- QUERY 5: Inspect Existing Foreign Key Relationships
-- Identifies parent-child dependencies so we never break referential integrity.
-- ---------------------------------------------------------------------
SELECT 
    kcu.TABLE_NAME AS `Child Table`,
    kcu.COLUMN_NAME AS `Foreign Key Column`,
    kcu.REFERENCED_TABLE_NAME AS `Parent Table`,
    kcu.REFERENCED_COLUMN_NAME AS `Parent Primary Key`,
    rc.UPDATE_RULE AS `On Update`,
    rc.DELETE_RULE AS `On Delete`,
    kcu.CONSTRAINT_NAME AS `Constraint Name`
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
    ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = 'kalaconnect'
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME;


-- ---------------------------------------------------------------------
-- QUERY 6: Dependency Check on Suspected Legacy Tables
-- Checks if any other table references 'artistprofiles', 'artisttalents', or 'bookings'.
-- ---------------------------------------------------------------------
SELECT 
    TABLE_NAME AS `Dependent Table`,
    COLUMN_NAME AS `FK Column`,
    REFERENCED_TABLE_NAME AS `Referenced Legacy Table`,
    CONSTRAINT_NAME AS `Constraint Name`
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'kalaconnect'
  AND REFERENCED_TABLE_NAME IN ('artistprofiles', 'artisttalents', 'bookings');


-- ---------------------------------------------------------------------
-- QUERY 7: Sample Data (First 3-5 Rows) from Extra Tables
-- (Uncomment and run to see what kind of records exist inside them)
-- ---------------------------------------------------------------------
-- SELECT * FROM kalaconnect.artistprofiles LIMIT 5;
-- SELECT * FROM kalaconnect.artisttalents LIMIT 5;
-- SELECT * FROM kalaconnect.bookings LIMIT 5;
