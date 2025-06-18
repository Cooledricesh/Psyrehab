import { Mail, Server } from 'lucide-react';
import { SectionConfig } from '../types';

export const emailConfig: SectionConfig = {
  smtpHost: {
    label: 'SMTP 호스트',
    type: 'text',
    icon: Server,
    required: true,
    placeholder: 'smtp.gmail.com'
  },
  smtpPort: {
    label: 'SMTP 포트',
    type: 'number',
    min: 1,
    max: 65535,
    placeholder: '587'
  },
  smtpSecure: {
    label: 'TLS/SSL 사용',
    type: 'boolean'
  },
  smtpUsername: {
    label: 'SMTP 사용자명',
    type: 'text',
    placeholder: 'your-email@gmail.com'
  },
  smtpPassword: {
    label: 'SMTP 비밀번호',
    type: 'password'
  },
  fromEmail: {
    label: '발신자 이메일',
    type: 'text',
    icon: Mail,
    placeholder: 'noreply@psyrehab.com'
  },
  fromName: {
    label: '발신자 이름',
    type: 'text',
    placeholder: 'PsyRehab System'
  },
  replyToEmail: {
    label: '회신 이메일',
    type: 'text',
    placeholder: 'support@psyrehab.com'
  },
  emailSignature: {
    label: '이메일 서명',
    type: 'textarea',
    placeholder: '이 이메일은 자동으로 발송되었습니다.'
  },
  testEmail: {
    label: '테스트 이메일 주소',
    type: 'text',
    placeholder: 'test@example.com',
    help: '이메일 설정 테스트용'
  }
};
