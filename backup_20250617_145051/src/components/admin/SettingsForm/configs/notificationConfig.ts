import { Bell, BellOff } from 'lucide-react';
import { SectionConfig } from '../types';

export const notificationConfig: SectionConfig = {
  notificationsEnabled: {
    label: '알림 활성화',
    type: 'boolean',
    icon: Bell
  },
  emailNotifications: {
    label: '이메일 알림',
    type: 'boolean'
  },
  smsNotifications: {
    label: 'SMS 알림',
    type: 'boolean'
  },
  pushNotifications: {
    label: '푸시 알림',
    type: 'boolean'
  },
  notifyOnNewUser: {
    label: '신규 사용자 등록 알림',
    type: 'boolean'
  },
  notifyOnAssessment: {
    label: '평가 완료 알림',
    type: 'boolean'
  },
  notifyOnGoalCompletion: {
    label: '목표 달성 알림',
    type: 'boolean'
  },
  notifyOnSystemError: {
    label: '시스템 오류 알림',
    type: 'boolean'
  },
  notificationFrequency: {
    label: '알림 빈도',
    type: 'select',
    options: [
      { label: '즉시', value: 'immediate' },
      { label: '시간별', value: 'hourly' },
      { label: '일별', value: 'daily' },
      { label: '주별', value: 'weekly' }
    ]
  },
  quietHours: {
    label: '방해 금지 시간',
    description: '알림을 보내지 않을 시간대',
    type: 'boolean',
    icon: BellOff
  },
  quietHoursStart: {
    label: '방해 금지 시작 시간',
    type: 'time'
  },
  quietHoursEnd: {
    label: '방해 금지 종료 시간',
    type: 'time'
  }
};
