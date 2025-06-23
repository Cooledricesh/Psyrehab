-- Check if signup_requests table exists
SELECT 
    table_name,
    table_schema
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name = 'signup_requests';

-- If table exists, list all constraints
SELECT 
    c.conname AS constraint_name,
    c.contype AS constraint_type,
    CASE c.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 't' THEN 'TRIGGER'
        WHEN 'x' THEN 'EXCLUSION'
    END AS constraint_type_desc,
    pg_get_constraintdef(c.oid) AS constraint_definition,
    n.nspname AS schema_name,
    t.relname AS table_name
FROM 
    pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class t ON t.oid = c.conrelid
WHERE 
    t.relname = 'signup_requests'
    AND n.nspname = 'public'
ORDER BY 
    c.conname;

-- Check all columns if table exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'signup_requests'
ORDER BY 
    ordinal_position;

-- Check for any references to signup_requests in foreign keys
SELECT 
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'signup_requests' OR tc.table_name = 'signup_requests');