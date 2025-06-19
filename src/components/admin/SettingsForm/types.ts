// 설정 폼 관련 타입 정의

export interface SettingsFormProps {
  section: string;
  data: unknown;
  onChange: (field: string, value: unknown) => void;
}

export interface FieldConfig {
  label: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'password' | 'time' | 'color' | 'multiselect';
  options?: { label: string; value: unknown }[];
  min?: number;
  max?: number;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  category?: string;
  required?: boolean;
  help?: string;
}

export interface SectionConfig {
  [key: string]: FieldConfig;
}
