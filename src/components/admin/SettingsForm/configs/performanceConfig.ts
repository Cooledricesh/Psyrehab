import { Zap } from 'lucide-react';
import { SectionConfig } from '../types';

export const performanceConfig: SectionConfig = {
  cacheEnabled: {
    label: '캐시 활성화',
    type: 'boolean',
    icon: Zap
  }
};
