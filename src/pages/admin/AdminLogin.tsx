import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const AdminLogin: React.FC = () => {
  const { isAuthenticated, isAdmin, login, isLoading } = useAdminAuth();
  const location = useLocation();
  
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // 이미 로그인된 관리자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      return;
    }
  }, [isAuthenticated, isAdmin]);

  // 로그인 시도 횟수 제한 (보안)
  const isBlocked = loginAttempts >= 5;
  const blockTimeRemaining = Math.max(0, 300 - ((Date.now() - localStorage.getItem('lastFailedLogin')!) / 1000));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // 에러 메시지 초기화
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError(`보안을 위해 ${Math.ceil(blockTimeRemaining)}초 후에 다시 시도해주세요.`);
      return;
    }

    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoginLoading(true);
    setError(null);

    try {
      const result = await login(form.email, form.password);
      
      if (result.success) {
        // 로그인 성공 시 시도 횟수 초기화
        setLoginAttempts(0);
        localStorage.removeItem('lastFailedLogin');
        
        // 기억하기 체크 시 로컬 스토리지에 이메일 저장
        if (form.rememberMe) {
          localStorage.setItem('adminEmail', form.email);
        } else {
          localStorage.removeItem('adminEmail');
        }
      } else {
        // 로그인 실패 시 시도 횟수 증가
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('lastFailedLogin', Date.now().toString());
        
        setError(result.error || '로그인에 실패했습니다.');
        
        // 5회 실패 시 경고
        if (newAttempts >= 5) {
          setError('로그인 시도 횟수를 초과했습니다. 5분 후에 다시 시도해주세요.');
        }
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 페이지 로드 시 저장된 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
      setForm(prev => ({
        ...prev,
        email: savedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  // 이미 로그인된 관리자 리다이렉트
  if (isAuthenticated && isAdmin) {
    const from = (location.state as any)?.from || '/admin';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 로그인
          </h2>
          <p className="text-gray-600">
            PsyRehab 관리 시스템에 로그인하세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleInputChange}
                disabled={loginLoading || isBlocked}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="admin@psyrehab.com"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleInputChange}
                  disabled={loginLoading || isBlocked}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginLoading || isBlocked}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 기억하기 */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={form.rememberMe}
                onChange={handleInputChange}
                disabled={loginLoading || isBlocked}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                이메일 기억하기
              </label>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loginLoading || isBlocked || !form.email || !form.password}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  로그인 중...
                </>
              ) : isBlocked ? (
                `${Math.ceil(blockTimeRemaining)}초 후 재시도`
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* 추가 링크들 */}
          <div className="mt-6 text-center">
            <div className="text-sm">
              <Link
                to="/admin/forgot-password"
                className="text-blue-600 hover:text-blue-500 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-500 hover:underline"
              >
                ← 메인 사이트로 돌아가기
              </Link>
            </div>
          </div>
        </div>

        {/* 보안 정보 */}
        <div className="text-center text-xs text-gray-500">
          <p>
            이 페이지는 SSL로 보호되며, 로그인 정보는 암호화되어 전송됩니다.
          </p>
          <p className="mt-1">
            무단 접근 시도는 기록되며 법적 조치를 받을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 