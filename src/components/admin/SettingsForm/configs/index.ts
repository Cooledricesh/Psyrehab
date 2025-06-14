import { systemConfig } from './systemConfig';
import { securityConfig } from './securityConfig';
import { emailConfig } from './emailConfig';
import { notificationConfig } from './notificationConfig';
import { backupConfig } from './backupConfig';
import { loggingConfig } from './loggingConfig';
import { performanceConfig } from './performanceConfig';
import { apiConfig } from './apiConfig';
import { uiConfig } from './uiConfig';
import { advancedConfig } from './advancedConfig';
import { SectionConfig } from '../types';

export const sectionConfigs: Record<string, SectionConfig> = {
  system: systemConfig,
  security: securityConfig,
  email: emailConfig,
  notifications: notificationConfig,
  backup: backupConfig,
  logging: loggingConfig,
  performance: performanceConfig,
  api: apiConfig,
  ui: uiConfig,
  advanced: advancedConfig
};

export {
  systemConfig,
  securityConfig,
  emailConfig,
  notificationConfig,
  backupConfig,
  loggingConfig,
  performanceConfig,
  apiConfig,
  uiConfig,
  advancedConfig
};
