-- Test script to verify user deletion works properly
-- This script tests the deletion process after updating foreign key constraints

-- Step 1: Check current foreign key constraints for social_workers
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table,
    CASE confdeltype 
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS delete_rule
FROM 
    pg_constraint
    JOIN pg_attribute AS a ON a.attnum = ANY(conkey) AND a.attrelid = conrelid
WHERE 
    contype = 'f'
    AND confrelid::regclass::text = 'social_workers'
ORDER BY conrelid::regclass::text, conname;

-- Step 2: Check if there are any social workers without assigned patients
SELECT 
    sw.user_id,
    sw.full_name,
    sw.employee_id,
    COUNT(p.id) as patient_count,
    COUNT(a.id) as assessment_count,
    COUNT(rg.id) as goal_count
FROM social_workers sw
LEFT JOIN patients p ON p.primary_social_worker_id = sw.user_id
LEFT JOIN assessments a ON a.assessed_by = sw.user_id
LEFT JOIN rehabilitation_goals rg ON rg.created_by_social_worker_id = sw.user_id
GROUP BY sw.user_id, sw.full_name, sw.employee_id
ORDER BY patient_count, sw.full_name;

-- Step 3: Verify that administrators can be deleted
SELECT 
    a.user_id,
    a.full_name,
    COUNT(ann.id) as announcement_count
FROM administrators a
LEFT JOIN announcements ann ON ann.created_by = a.user_id
GROUP BY a.user_id, a.full_name
ORDER BY announcement_count, a.full_name;