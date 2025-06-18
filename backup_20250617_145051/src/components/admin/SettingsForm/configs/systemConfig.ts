import { Globe, Clock } from 'lucide-react';
import { SectionConfig } from '../types';

export const systemConfig: SectionConfig = {
  siteName: {
    label: '사이트 이름',
    description: '시스템에 표시될 사이트의 이름',
    type: 'text',
    icon: Globe,
    required: true,
    placeholder: 'PsyRehab'
  },
  siteDescription: {
    label: '사이트 설명',
    description: '사이트에 대한 간단한 설명',
    type: 'textarea',
    placeholder: '심리재활 및 치료 관리 시스템'
  },
  defaultLanguage: {
    label: '기본 언어',
    type: 'select',
    options: [
      { label: '한국어', value: 'ko' },
      { label: 'English', value: 'en' },
      { label: '日本語', value: 'ja' },
      { label: '中文', value: 'zh' }
    ],
    icon: Globe
  },
  timezone: {
    label: '시간대',
    type: 'select',
    options: [
      { label: 'Asia/Seoul', value: 'Asia/Seoul' },
      { label: 'UTC', value: 'UTC' },
      { label: 'America/New_York', value: 'America/New_York' },
      { label: 'Europe/London', value: 'Europe/London' }
    ],
    icon: Clock
  },
  dateFormat: {
    label: '날짜 형식',
    type: 'select',
    options: [
      { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
      { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
      { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' }
    ]
  },
  timeFormat: {
    label: '시간 형식',
    type: 'select',
    options: [
      { label: '24시간', value: '24h' },
      { label: '12시간 (AM/PM)', value: '12h' }
    ]
  },
  maintenance: {
    label: '유지보수 모드',
    description: '유지보수 모드 활성화 시 관리자만 접속 가능',
    type: 'boolean'
  }
};
