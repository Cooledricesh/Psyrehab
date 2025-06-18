// 설정 폼 관련 타입 정의

export interface SettingsFormProps {
  section: string;
  data: Record<string, string | number | boolean | string[] | null>;
  onChange: (field: string, value: string | number | boolean | string[] | null) => void;
}

export interface FieldConfig {
  label: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'password' | 'time' | 'color' | 'multiselect';
  options?: { label: string; value: string | number | boolean }[];
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
