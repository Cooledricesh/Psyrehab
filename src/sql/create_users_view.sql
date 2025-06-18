-- auth.users 테이블에 대한 public 뷰 생성
-- 이 뷰를 통해 사용자 이메일 정보에 접근할 수 있습니다

CREATE OR REPLACE VIEW public.users AS
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users;

-- 뷰에 대한 권한 설정
GRANT SELECT ON public.users TO authenticated;

-- 보안을 위한 RLS 활성화
ALTER VIEW public.users SET (security_invoker = true);

-- 이제 social_workers와 administrators 테이블에서 users 뷰를 참조할 수 있습니다
COMMENT ON VIEW public.users IS 'auth.users 테이블에 대한 읽기 전용 뷰';
