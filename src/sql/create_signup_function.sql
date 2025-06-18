-- 회원가입을 위한 서버사이드 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user_signup(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_role TEXT,
    p_employee_id TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_contact_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role_id UUID;
    v_result JSONB;
BEGIN
    -- 역할 ID 매핑
    CASE p_role
        WHEN 'social_worker' THEN
            v_role_id := '6a5037f6-5553-47f9-824f-bf1e767bda95';
        WHEN 'administrator' THEN
            v_role_id := 'd7fcf425-85bc-42b4-8806-917ef6939a40';
        WHEN 'patient' THEN
            v_role_id := 'b3ec265d-07cc-45a3-9f3e-5bdd0f529890';
        ELSE
            RAISE EXCEPTION 'Invalid role: %', p_role;
    END CASE;

    -- 트랜잭션 시작
    BEGIN
        -- 1. user_roles에 역할 할당
        INSERT INTO user_roles (user_id, role_id)
        VALUES (p_user_id, v_role_id);

        -- 2. 역할에 따른 프로필 생성
        IF p_role = 'social_worker' THEN
            INSERT INTO social_workers (
                user_id, 
                full_name, 
                employee_id, 
                department, 
                contact_number, 
                is_active
            )
            VALUES (
                p_user_id, 
                p_full_name, 
                p_employee_id, 
                p_department, 
                p_contact_number, 
                true
            );
        ELSIF p_role = 'administrator' THEN
            INSERT INTO administrators (
                user_id, 
                full_name, 
                employee_id, 
                department, 
                contact_number, 
                is_active
            )
            VALUES (
                p_user_id, 
                p_full_name, 
                p_employee_id, 
                p_department, 
                p_contact_number, 
                true
            );
        END IF;

        -- 성공 응답
        v_result := jsonb_build_object(
            'success', true,
            'message', 'User profile created successfully'
        );
        
        RETURN v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- 에러 발생 시 롤백
            RAISE WARNING 'Error in handle_new_user_signup: %', SQLERRM;
            v_result := jsonb_build_object(
                'success', false,
                'error', SQLERRM
            );
            RETURN v_result;
    END;
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup TO authenticated;
