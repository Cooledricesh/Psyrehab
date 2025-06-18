-- 사용자 목록을 가져오는 함수 생성
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role_name TEXT,
    employee_id TEXT,
    department TEXT,
    contact_number TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    patient_count BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- 관리자 권한 확인
    IF NOT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    -- 사회복지사 조회
    SELECT 
        sw.user_id,
        u.email,
        sw.full_name,
        'social_worker'::TEXT as role_name,
        sw.employee_id,
        sw.department,
        sw.contact_number,
        sw.is_active,
        sw.created_at,
        COALESCE(
            (SELECT COUNT(*) FROM patients p WHERE p.primary_social_worker_id = sw.user_id),
            0
        ) as patient_count
    FROM social_workers sw
    INNER JOIN auth.users u ON u.id = sw.user_id
    
    UNION ALL
    
    -- 관리자 조회
    SELECT 
        a.user_id,
        u.email,
        a.full_name,
        'administrator'::TEXT as role_name,
        a.employee_id,
        a.department,
        a.contact_number,
        a.is_active,
        a.created_at,
        0::BIGINT as patient_count
    FROM administrators a
    INNER JOIN auth.users u ON u.id = a.user_id
    
    ORDER BY created_at DESC;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;
