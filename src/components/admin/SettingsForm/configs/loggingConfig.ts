import { Activity } from 'lucide-react';
import { SectionConfig } from '../types';

export const loggingConfig: SectionConfig = {
  logLevel: {
    label: '로그 레벨',
    type: 'select',
    options: [
      { label: '디버그', value: 'debug' },
      { label: '정보', value: 'info' },
      { label: '경고', value: 'warning' },
      { label: '오류', value: 'error' }
    ],
    icon: Activity
  }
};
