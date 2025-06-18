import React from 'react';
import { FieldConfig } from '../types';
import TextInput from './fields/TextInput';
import NumberInput from './fields/NumberInput';
import BooleanSwitch from './fields/BooleanSwitch';
import SelectInput from './fields/SelectInput';
import TextareaInput from './fields/TextareaInput';
import PasswordInput from './fields/PasswordInput';
import TimeInput from './fields/TimeInput';
import ColorPicker from './fields/ColorPicker';
import MultiSelectInput from './fields/MultiSelectInput';

interface FieldRendererProps {
  name: string;
  config: FieldConfig;
  value: unknown;
  onChange: (field: string, value: unknown) => void;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  name,
  config,
  value,
  onChange
}) => {
  const commonProps = {
    name,
    label: config.label,
    value,
    onChange: (newValue: unknown) => onChange(name, newValue),
    description: config.description,
    required: config.required,
    help: config.help,
    icon: config.icon
  };

  switch (config.type) {
    case 'text':
      return (
        <TextInput
          {...commonProps}
          placeholder={config.placeholder}
        />
      );

    case 'number':
      return (
        <NumberInput
          {...commonProps}
          min={config.min}
          max={config.max}
          placeholder={config.placeholder}
        />
      );

    case 'boolean':
      return (
        <BooleanSwitch {...commonProps} />
      );

    case 'select':
      return (
        <SelectInput
          {...commonProps}
          options={config.options || []}
        />
      );

    case 'textarea':
      return (
        <TextareaInput
          {...commonProps}
          placeholder={config.placeholder}
        />
      );

    case 'password':
      return (
        <PasswordInput
          {...commonProps}
          placeholder={config.placeholder}
        />
      );

    case 'time':
      return (
        <TimeInput {...commonProps} />
      );

    case 'color':
      return (
        <ColorPicker {...commonProps} />
      );

    case 'multiselect':
      return (
        <MultiSelectInput
          {...commonProps}
          options={config.options || []}
        />
      );

    default:
      return null;
  }
};

export default FieldRenderer;
