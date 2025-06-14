import { Palette } from 'lucide-react';
import { SectionConfig } from '../types';

export const uiConfig: SectionConfig = {
  theme: {
    label: '테마',
    type: 'select',
    options: [
      { label: '라이트', value: 'light' },
      { label: '다크', value: 'dark' },
      { label: '자동', value: 'auto' }
    ],
    icon: Palette
  }
};
