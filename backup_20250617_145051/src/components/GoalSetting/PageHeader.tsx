import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  onBack?: () => void;
  title: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ onBack, title }) => {
  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {onBack && (
              <button 
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                돌아가기
              </button>
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="w-20"></div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
