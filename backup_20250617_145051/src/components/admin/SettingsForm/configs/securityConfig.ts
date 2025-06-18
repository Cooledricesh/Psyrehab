import { Key, Clock, Shield, AlertTriangle } from 'lucide-react';
import { SectionConfig } from '../types';

export const securityConfig: SectionConfig = {
  passwordMinLength: {
    label: '최소 비밀번호 길이',
    type: 'number',
    min: 4,
    max: 32,
    icon: Key
  },
  passwordRequireUppercase: {
    label: '대문자 필수',
    description: '비밀번호에 대문자가 포함되어야 합니다',
    type: 'boolean'
  },
  passwordRequireLowercase: {
    label: '소문자 필수',
    description: '비밀번호에 소문자가 포함되어야 합니다',
    type: 'boolean'
  },
  passwordRequireNumbers: {
    label: '숫자 필수',
    description: '비밀번호에 숫자가 포함되어야 합니다',
    type: 'boolean'
  },
  passwordRequireSymbols: {
    label: '특수문자 필수',
    description: '비밀번호에 특수문자가 포함되어야 합니다',
    type: 'boolean'
  },
  sessionTimeout: {
    label: '세션 만료 시간 (분)',
    type: 'number',
    min: 5,
    max: 1440,
    icon: Clock
  },
  maxLoginAttempts: {
    label: '최대 로그인 시도 횟수',
    type: 'number',
    min: 3,
    max: 10,
    icon: Shield
  },
  lockoutDuration: {
    label: '계정 잠금 시간 (분)',
    type: 'number',
    min: 5,
    max: 1440
  },
  twoFactorEnabled: {
    label: '2단계 인증',
    description: '추가 보안을 위한 2단계 인증 활성화',
    type: 'boolean',
    icon: Shield
  },
  ipWhitelist: {
    label: 'IP 화이트리스트',
    description: '접속 허용 IP 주소 (줄바꿈으로 구분)',
    type: 'textarea',
    placeholder: '192.168.1.0/24\n10.0.0.0/8'
  },
  allowMultipleSessions: {
    label: '다중 세션 허용',
    description: '한 계정으로 여러 곳에서 동시 접속 허용',
    type: 'boolean'
  },
  forcePasswordChange: {
    label: '비밀번호 변경 주기 (일)',
    type: 'number',
    min: 0,
    max: 365,
    help: '0으로 설정 시 비활성화'
  },
  securityAlerts: {
    label: '보안 알림',
    description: '의심스러운 활동 감지 시 관리자에게 알림',
    type: 'boolean',
    icon: AlertTriangle
  }
};
