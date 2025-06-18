import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { User, UserRole, UserStatus, Permission } from '@/types/auth';
import { 
  Edit2, 
  Trash2, 
  Eye, 
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Crown,
  User as UserIcon,
  UserCog,
  UserPlus,
  UserX,
  Mail,
  MailOpen
} from 'lucide-react';

interface UserTableProps {
  users: User[];
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
  onEdit: (user: User) => void;
  onDelete: (userIds: string[]) => void;
  onStatusChange: (userIds: string[], status: UserStatus) => void;
  isLoading?: boolean;
}

interface SortConfig {
  key: keyof User | null;
  direction: 'asc' | 'desc';
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onSelectionChange,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}) => {
  const { checkPermission } = useAdminAuth();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  // Bulk actions UI reserved for future implementation
  // const [showBulkActions, setShowBulkActions] = useState(false);

  // 역할별 아이콘 및 색상
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return { icon: Crown, color: 'text-purple-600 bg-purple-100', label: '슈퍼 관리자' };
      case UserRole.ADMIN:
        return { icon: Shield, color: 'text-blue-600 bg-blue-100', label: '관리자' };
      case UserRole.THERAPIST:
        return { icon: UserCog, color: 'text-green-600 bg-green-100', label: '치료사' };
      case UserRole.MANAGER:
        return { icon: UserPlus, color: 'text-orange-600 bg-orange-100', label: '매니저' };
      case UserRole.USER:
        return { icon: UserIcon, color: 'text-gray-600 bg-gray-100', label: '사용자' };
      default:
        return { icon: UserIcon, color: 'text-gray-600 bg-gray-100', label: '게스트' };
    }
  };

  // 상태별 아이콘 및 색상
  const getStatusConfig = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: '활성' };
      case 'inactive':
        return { icon: XCircle, color: 'text-red-600 bg-red-100', label: '비활성' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: '대기중' };
      case 'suspended':
        return { icon: UserX, color: 'text-red-600 bg-red-100', label: '정지' };
      default:
        return { icon: Clock, color: 'text-gray-600 bg-gray-100', label: '알 수 없음' };
    }
  };

  // 정렬 처리
  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableUsers = users.filter(() => 
        checkPermission(Permission.USER_UPDATE) || checkPermission(Permission.USER_DELETE)
      );
      onSelectionChange(selectableUsers.map(user => user.id));
    } else {
      onSelectionChange([]);
    }
  };

  // 개별 선택/해제
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedUsers, userId]);
    } else {
      onSelectionChange(selectedUsers.filter(id => id !== userId));
    }
  };

  // 정렬된 사용자 목록
  const sortedUsers = React.useMemo(() => {
    const sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  // 로딩 스켈레톤
  const LoadingSkeleton = () => (
    <tr>
      <td colSpan={8} className="px-6 py-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );

  const SortableHeader = ({ 
    children, 
    sortKey, 
    className = "" 
  }: { 
    children: React.ReactNode; 
    sortKey: keyof User; 
    className?: string; 
  }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'asc' ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* 선택된 항목 액션 바 */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedUsers.length}명 선택됨
            </span>
            <div className="flex items-center space-x-2">
              {checkPermission(Permission.USER_UPDATE) && (
                <>
                  <button
                    onClick={() => onStatusChange(selectedUsers, 'active')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    활성화
                  </button>
                  <button
                    onClick={() => onStatusChange(selectedUsers, 'inactive')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    비활성화
                  </button>
                </>
              )}
              {checkPermission(Permission.USER_DELETE) && (
                <button
                  onClick={() => onDelete(selectedUsers)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <SortableHeader sortKey="name">사용자</SortableHeader>
              <SortableHeader sortKey="role">역할</SortableHeader>
              <SortableHeader sortKey="status">상태</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                부서
              </th>
              <SortableHeader sortKey="lastLogin">마지막 로그인</SortableHeader>
              <SortableHeader sortKey="createdAt">생성일</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <LoadingSkeleton />
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">사용자가 없습니다</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    검색 조건을 변경하거나 새 사용자를 추가해보세요.
                  </p>
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => {
                const roleConfig = getRoleConfig(user.role);
                const statusConfig = getStatusConfig(user.status);
                const RoleIcon = roleConfig.icon;
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    
                    {/* 사용자 정보 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar}
                              alt={user.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            {user.emailVerified ? (
                              <MailOpen className="w-3 h-3 mr-1 text-green-500" />
                            ) : (
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            )}
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 역할 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.color}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {roleConfig.label}
                      </span>
                    </td>

                    {/* 상태 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* 부서 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.department || '-'}
                    </td>

                    {/* 마지막 로그인 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? (
                        <span title={new Date(user.lastLogin).toLocaleString('ko-KR')}>
                          {formatDistanceToNow(new Date(user.lastLogin), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400">없음</span>
                      )}
                    </td>

                    {/* 생성일 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span title={new Date(user.createdAt).toLocaleString('ko-KR')}>
                        {formatDistanceToNow(new Date(user.createdAt), { 
                          addSuffix: true, 
                          locale: ko 
                        })}
                      </span>
                    </td>

                    {/* 작업 */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {checkPermission(Permission.USER_READ) && (
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title="상세 보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {checkPermission(Permission.USER_UPDATE) && (
                          <button
                            onClick={() => onEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {checkPermission(Permission.USER_DELETE) && user.role !== UserRole.SUPER_ADMIN && (
                          <button
                            onClick={() => onDelete([user.id])}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 (향후 추가) */}
      {!isLoading && users.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              이전
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              다음
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                총 <span className="font-medium">{users.length}</span>명의 사용자
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable; 