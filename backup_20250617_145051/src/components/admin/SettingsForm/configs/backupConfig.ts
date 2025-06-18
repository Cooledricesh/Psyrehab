import { Database } from 'lucide-react';
import { SectionConfig } from '../types';

export const backupConfig: SectionConfig = {
  backupEnabled: {
    label: '자동 백업',
    type: 'boolean',
    icon: Database
  },
  frequency: {
    label: '백업 주기',
    type: 'select',
    options: [
      { label: '매일', value: 'daily' },
      { label: '매주', value: 'weekly' },
      { label: '매월', value: 'monthly' }
    ]
  },
  time: {
    label: '백업 시간',
    type: 'time'
  },
  retentionDays: {
    label: '백업 보관 기간 (일)',
    type: 'number',
    min: 1,
    max: 365
  }
};
