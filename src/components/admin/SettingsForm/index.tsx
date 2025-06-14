import React from 'react';
import { SettingsFormProps } from './types';
import { sectionConfigs } from './configs';
import FieldRenderer from './components/FieldRenderer';
import { Info } from 'lucide-react';

const SettingsForm: React.FC<SettingsFormProps> = ({ section, data, onChange }) => {
  const config = sectionConfigs[section];

  if (!config) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>설정 섹션을 찾을 수 없습니다: {section}</p>
      </div>
    );
  }

  // 카테고리별로 필드 그룹화
  const groupedFields = Object.entries(config).reduce((acc, [key, field]) => {
    const category = field.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ key, field });
    return acc;
  }, {} as Record<string, Array<{ key: string; field: any }>>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([category, fields]) => (
        <div key={category} className="bg-white shadow rounded-lg">
          {category !== 'general' && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {category === 'general' ? '일반 설정' : category}
              </h3>
            </div>
          )}
          <div className="p-6 space-y-6">
            {fields.map(({ key, field }) => (
              <FieldRenderer
                key={key}
                name={key}
                config={field}
                value={data[key]}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SettingsForm;
