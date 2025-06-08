import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { CategoryTree } from '../../components/admin/CategoryTree';
import { AssessmentOptionsList } from '../../components/admin/AssessmentOptionsList';
import { AssessmentTemplateBuilder } from '../../components/admin/AssessmentTemplateBuilder';
import { AssessmentStatsDashboard } from '../../components/admin/AssessmentStatsDashboard';
import { 
  AssessmentCategory, 
  AssessmentOption, 
  AssessmentTemplate,
  AssessmentStatistics 
} from '../../types/assessment';
import {
  FolderTree,
  Settings,
  FileText,
  BarChart3,
  Plus,
  Search,
  RefreshCw,
  Upload,
  Download
} from 'lucide-react';

type ActiveTab = 'categories' | 'options' | 'templates' | 'statistics';

export default function AssessmentManagement() {
  const { user, checkPermission } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('categories');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 초기 데이터 로드
  const loadData = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // TODO: 실제 API 호출
    } catch (error) {
      console.error('Failed to load assessment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={user} />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">평가 데이터를 불러오는 중...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={user} />
        
        <main className="p-6">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">평가 관리</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                평가 카테고리, 옵션, 템플릿을 관리하고 통계를 확인하세요.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                새로고침
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                새로 만들기
              </button>
            </div>
          </div>

          {/* 임시 컨텐츠 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">평가 관리 시스템</h2>
            <p className="text-gray-600 dark:text-gray-400">
              평가 카테고리, 옵션, 템플릿 관리 기능이 곧 제공될 예정입니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
} 