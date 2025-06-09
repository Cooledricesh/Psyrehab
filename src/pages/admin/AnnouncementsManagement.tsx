import React, { useState, useEffect } from 'react';
import type { 
  Announcement as AnnouncementType
} from '../../types/announcement';
import { 
  AnnouncementType as Type, 
  Priority, 
  Status,
  getTypeEmoji,
  getPriorityColor,
  getStatusColor,
  getTypeLabel,
  getPriorityLabel,
  getStatusLabel
} from '../../types/announcement';
import { announcementService } from '../../services/announcements';

// 공지사항 타입
interface Announcement {
  id: number;
  dbId?: string; // DB의 실제 UUID 저장
  title: string;
  content: string;
  type: string;
  priority: string;
  status: string;
  date: string;
}

// 모달 Props 타입
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  newAnnouncement: {
    title: string;
    content: string;
    type: string;
    priority: string;
  };
  setNewAnnouncement: React.Dispatch<React.SetStateAction<{
    title: string;
    content: string;
    type: string;
    priority: string;
  }>>;
  onAdd: () => void;
  editingAnnouncement?: Announcement | null;
}

// 모달 컴포넌트 (함수 외부로 이동)
const AnnouncementModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  newAnnouncement, 
  setNewAnnouncement, 
  onAdd,
  editingAnnouncement 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onAdd();
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    // 편집 모드 종료 시 폼 초기화는 부모 컴포넌트에서 처리
  };

  if (!isOpen) return null;

  const isEditMode = editingAnnouncement !== null && editingAnnouncement !== undefined;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? '공지사항 편집' : '새 공지사항 작성'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement(prev => ({...prev, title: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="공지사항 제목을 입력하세요"
              disabled={isSubmitting}
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              유형
            </label>
            <select
              value={newAnnouncement.type}
              onChange={(e) => setNewAnnouncement(prev => ({...prev, type: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="system">⚙️ 시스템</option>
              <option value="maintenance">🔧 점검</option>
              <option value="update">🆕 업데이트</option>
              <option value="event">🎉 이벤트</option>
              <option value="warning">⚠️ 경고</option>
            </select>
          </div>

          {/* 우선순위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              우선순위
            </label>
            <select
              value={newAnnouncement.priority}
              onChange={(e) => setNewAnnouncement(prev => ({...prev, priority: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement(prev => ({...prev, content: e.target.value}))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="공지사항 내용을 입력하세요"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : (isEditMode ? '수정 완료' : '공지사항 추가')}
          </button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementsManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: 1, title: '시스템 점검 안내', content: '정기 시스템 점검이 예정되어 있습니다.', type: '⚙️ 시스템', status: '활성', priority: '높음', date: '2024-01-15' },
    { id: 2, title: '새로운 기능 업데이트', content: '새로운 기능이 추가되었습니다.', type: '🆕 업데이트', status: '활성', priority: '보통', date: '2024-01-10' },
    { id: 3, title: '보안 패치 적용', content: '보안 업데이트가 적용되었습니다.', type: '⚠️ 경고', status: '완료', priority: '긴급', date: '2024-01-05' },
  ]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'system',
    priority: 'medium'
  });

  // Supabase에서 데이터 로드하는 함수
  const loadAnnouncementsFromDB = async () => {
    try {
      setLoading(true);
      const dbAnnouncements = await announcementService.getAnnouncements();
      
      // DB 데이터를 기존 형식으로 변환
      const convertedAnnouncements: Announcement[] = dbAnnouncements.map((item, index) => ({
        id: index + 1, // 임시 ID
        dbId: item.id, // 실제 DB ID 저장
        title: item.title,
        content: item.content,
        type: `${getTypeEmoji(item.type)} ${getTypeLabel(item.type)}`,
        priority: getPriorityLabel(item.priority),
        status: item.status === 'active' ? '활성' : item.status === 'inactive' ? '비활성' : '완료',
        date: new Date(item.created_at).toISOString().split('T')[0]
      }));
      
      setAnnouncements(convertedAnnouncements);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      // 오류 시 기본 데이터 유지
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 로드 함수
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalViews: 0,
    critical: 0
  });

  const loadStats = async () => {
    try {
      const statsData = await announcementService.getAnnouncementStats();
      setStats({
        total: statsData.total,
        active: statsData.active,
        totalViews: statsData.totalViews,
        critical: statsData.byPriority.critical || 0
      });
    } catch (error) {
      console.error('통계 로드 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      await loadAnnouncementsFromDB();
      await loadStats();
    };
    loadData();
  }, []);

  // 편집 기능
  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      type: 'system', // 기본값으로 설정
      priority: 'medium' // 기본값으로 설정
    });
    setIsModalOpen(true);
  };

  // 수정된 추가/편집 함수
  const handleAddOrUpdateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      // 타입 매핑
      const typeMapping: { [key: string]: Type } = {
        system: Type.SYSTEM,
        maintenance: Type.SYSTEM,
        update: Type.GENERAL,
        event: Type.EVENT,
        warning: Type.EMERGENCY
      };

      const priorityMapping: { [key: string]: Priority } = {
        low: Priority.LOW,
        medium: Priority.MEDIUM,
        high: Priority.HIGH,
        urgent: Priority.CRITICAL
      };

      if (editingAnnouncement && editingAnnouncement.dbId) {
        // 편집 모드: 기존 공지사항 업데이트
        await announcementService.updateAnnouncement(editingAnnouncement.dbId, {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: typeMapping[newAnnouncement.type] || Type.GENERAL,
          priority: priorityMapping[newAnnouncement.priority] || Priority.MEDIUM
        });
        alert('공지사항이 성공적으로 수정되었습니다!');
      } else {
        // 생성 모드: 새 공지사항 생성
        await announcementService.createAnnouncement({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: typeMapping[newAnnouncement.type] || Type.GENERAL,
          priority: priorityMapping[newAnnouncement.priority] || Priority.MEDIUM,
          status: Status.ACTIVE
        });
        alert('공지사항이 성공적으로 추가되었습니다!');
      }

      // 성공 시 데이터 새로고침
      await loadAnnouncementsFromDB();
      await loadStats();
      
      setNewAnnouncement({ title: '', content: '', type: 'system', priority: 'medium' });
      setEditingAnnouncement(null);
      setIsModalOpen(false);
      
    } catch (error) {
      console.error('공지사항 처리 오류:', error);
      alert('공지사항 처리 중 오류가 발생했습니다.');
      
      if (!editingAnnouncement) {
        // 생성 실패 시 기존 방식으로 폴백
        const typeEmojis: { [key: string]: string } = {
          system: '⚙️ 시스템',
          maintenance: '🔧 점검',
          update: '🆕 업데이트',
          event: '🎉 이벤트',
          warning: '⚠️ 경고'
        };

        const newId = Math.max(...announcements.map(a => a.id), 0) + 1;
        const today = new Date().toISOString().split('T')[0];

        const announcement: Announcement = {
          id: newId,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: typeEmojis[newAnnouncement.type] || '📢 일반',
          priority: newAnnouncement.priority,
          status: '활성',
          date: today
        };

        setAnnouncements([announcement, ...announcements]);
        setNewAnnouncement({ title: '', content: '', type: 'system', priority: 'medium' });
        setIsModalOpen(false);
        alert('공지사항이 추가되었습니다! (로컬 저장)');
      }
    } finally {
      setLoading(false);
    }
  };

  // 기존 함수 이름 변경
  const handleAddAnnouncement = handleAddOrUpdateAnnouncement;

  // 공지사항 삭제
  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      
      // 해당 항목의 실제 DB ID 찾기
      const targetAnnouncement = announcements.find(a => a.id === id);
      if (targetAnnouncement && targetAnnouncement.dbId) {
        // 실제 DB에서 삭제
        await announcementService.deleteAnnouncement(targetAnnouncement.dbId);
        // 성공 시 데이터 새로고침
        await loadAnnouncementsFromDB();
        await loadStats();
        alert('공지사항이 삭제되었습니다.');
      } else {
        // dbId가 없는 경우 (로컬 데이터)
        setAnnouncements(announcements.filter(a => a.id !== id));
        alert('공지사항이 삭제되었습니다. (로컬 삭제)');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      // 오류 시 기존 방식으로 폴백
      setAnnouncements(announcements.filter(a => a.id !== id));
      alert('공지사항이 삭제되었습니다. (로컬 삭제)');
    } finally {
      setLoading(false);
    }
  };

  // 새 공지사항 모달 열기
  const handleOpenNewModal = () => {
    setEditingAnnouncement(null);
    setNewAnnouncement({ title: '', content: '', type: 'system', priority: 'medium' });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    setNewAnnouncement({ title: '', content: '', type: 'system', priority: 'medium' });
  };

  // 공지사항 조회 (조회수 증가)
  const handleViewAnnouncement = async (announcement: Announcement) => {
    if (announcement.dbId) {
      try {
        await announcementService.incrementViews(announcement.dbId);
        // 조회수 증가 후 통계 새로고침
        await loadStats();
      } catch (error) {
        console.error('조회수 증가 오류:', error);
        // 조회수 증가 실패해도 계속 진행
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
        <p className="mt-2 text-gray-600">시스템 공지사항을 작성하고 관리합니다</p>
        {loading && (
          <div className="mt-2 text-blue-600">
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              데이터 처리 중...
            </span>
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📢</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">총 공지사항</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">✅</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">활성 공지</h3>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">👁️</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">총 조회수</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🚨</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">긴급 공지</h3>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">공지사항 목록</h2>
            <button 
              onClick={handleOpenNewModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              ➕ 새 공지사항
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        {announcement.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        announcement.status === '활성' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        announcement.priority === '긴급' 
                          ? 'bg-red-100 text-red-800'
                          : announcement.priority === '높음'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {announcement.priority}
                      </span>
                    </div>
                    <h3 
                      className="text-lg font-medium text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleViewAnnouncement(announcement)}
                      title="클릭하여 조회수 증가"
                    >
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {announcement.content}
                    </p>
                    <p className="text-sm text-gray-600">
                      작성일: {announcement.date}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditAnnouncement(announcement)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700"
                      disabled={loading}
                    >
                      편집
                    </button>
                    <button 
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="px-3 py-1 border border-red-300 rounded text-sm hover:bg-red-50 text-red-700"
                      disabled={loading}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 모달 */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        newAnnouncement={newAnnouncement}
        setNewAnnouncement={setNewAnnouncement}
        onAdd={handleAddAnnouncement}
        editingAnnouncement={editingAnnouncement}
      />
    </div>
  );
};

export default AnnouncementsManagement; 