import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { UserTable } from '@/components/admin/UserTable';
import { UserFilters } from '@/components/admin/UserFilters';
import { UserModal } from '@/components/admin/UserModal';
import { User, UserRole, UserStatus } from '@/types/auth';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  RefreshCw,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Crown
} from 'lucide-react';

interface UserFilter {
  search: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
  department: string;
  sortBy: 'name' | 'email' | 'role' | 'createdAt' | 'lastLogin';
  sortOrder: 'asc' | 'desc';
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  adminCount: number;
  therapistCount: number;
  userCount: number;
}

export const UserManagement: React.FC = () => {
  const { user, checkPermission } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [filters, setFilters] = useState<UserFilter>({
    search: '',
    role: 'all',
    status: 'all',
    department: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    adminCount: 0,
    therapistCount: 0,
    userCount: 0,
  });

  // 모의 사용자 데이터 생성
  const generateMockUsers = (): User[] => {
    return [
      {
        id: '1',
        email: 'admin@psyrehab.com',
        name: '관리자',
        role: UserRole.ADMIN,
        permissions: [],
        status: 'active' as UserStatus,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        lastLogin: '2024-01-20T08:30:00Z',
        emailVerified: true,
        department: '관리팀',
      },
      {
        id: '2',
        email: 'therapist1@psyrehab.com',
        name: '김치료사',
        role: UserRole.THERAPIST,
        permissions: [],
        status: 'active' as UserStatus,
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
        lastLogin: '2024-01-20T09:15:00Z',
        emailVerified: true,
        department: '치료팀',
      },
      {
        id: '3',
        email: 'manager@psyrehab.com',
        name: '박매니저',
        role: UserRole.MANAGER,
        permissions: [],
        status: 'active' as UserStatus,
        createdAt: '2024-01-17T10:00:00Z',
        updatedAt: '2024-01-17T10:00:00Z',
        lastLogin: '2024-01-19T14:20:00Z',
        emailVerified: true,
        department: '운영팀',
      },
      {
        id: '4',
        email: 'user1@psyrehab.com',
        name: '이사용자',
        role: UserRole.USER,
        permissions: [],
        status: 'inactive' as UserStatus,
        createdAt: '2024-01-18T10:00:00Z',
        updatedAt: '2024-01-18T10:00:00Z',
        emailVerified: false,
        department: '일반',
      },
      {
        id: '5',
        email: 'therapist2@psyrehab.com',
        name: '최치료사',
        role: UserRole.THERAPIST,
        permissions: [],
        status: 'pending' as UserStatus,
        createdAt: '2024-01-19T10:00:00Z',
        updatedAt: '2024-01-19T10:00:00Z',
        emailVerified: true,
        department: '치료팀',
      },
    ];
  };

  // 통계 계산
  const calculateStats = (userList: User[]): UserStats => {
    return {
      total: userList.length,
      active: userList.filter(u => u.status === 'active').length,
      inactive: userList.filter(u => u.status === 'inactive').length,
      adminCount: userList.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN).length,
      therapistCount: userList.filter(u => u.role === UserRole.THERAPIST).length,
      userCount: userList.filter(u => u.role === UserRole.USER).length,
    };
  };

  // 사용자 목록 필터링
  const applyFilters = (userList: User[], filterOptions: UserFilter): User[] => {
    let filtered = [...userList];

    // 검색 필터
    if (filterOptions.search) {
      const searchTerm = filterOptions.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      );
    }

    // 역할 필터
    if (filterOptions.role !== 'all') {
      filtered = filtered.filter(user => user.role === filterOptions.role);
    }

    // 상태 필터
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(user => user.status === filterOptions.status);
    }

    // 부서 필터
    if (filterOptions.department) {
      filtered = filtered.filter(user => 
        user.department?.toLowerCase().includes(filterOptions.department.toLowerCase())
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any = a[filterOptions.sortBy];
      let bValue: any = b[filterOptions.sortBy];

      if (filterOptions.sortBy === 'name' || filterOptions.sortBy === 'email') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filterOptions.sortBy === 'createdAt' || filterOptions.sortBy === 'lastLogin') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (filterOptions.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // 데이터 로드
  const loadUsers = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // 실제 환경에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUsers = generateMockUsers();
      setUsers(mockUsers);
      setStats(calculateStats(mockUsers));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 사용자 생성/수정
  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      // 실제 환경에서는 API 호출
      if (editingUser) {
        // 수정
        const updatedUsers = users.map(u => 
          u.id === editingUser.id 
            ? { ...u, ...userData, updatedAt: new Date().toISOString() }
            : u
        );
        setUsers(updatedUsers);
        setStats(calculateStats(updatedUsers));
      } else {
        // 생성
        const newUser: User = {
          id: Date.now().toString(),
          email: userData.email!,
          name: userData.name!,
          role: userData.role!,
          permissions: [],
          status: 'active' as UserStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: false,
          department: userData.department,
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        setStats(calculateStats(updatedUsers));
      }
      
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  // 사용자 삭제
  const handleDeleteUsers = async (userIds: string[]) => {
    try {
      const updatedUsers = users.filter(u => !userIds.includes(u.id));
      setUsers(updatedUsers);
      setStats(calculateStats(updatedUsers));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to delete users:', error);
    }
  };

  // 사용자 상태 변경
  const handleStatusChange = async (userIds: string[], newStatus: UserStatus) => {
    try {
      const updatedUsers = users.map(u => 
        userIds.includes(u.id) 
          ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
          : u
      );
      setUsers(updatedUsers);
      setStats(calculateStats(updatedUsers));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  // 필터 변경
  const handleFilterChange = (newFilters: Partial<UserFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  };

  // 새로고침
  const handleRefresh = () => {
    loadUsers(true);
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadUsers();
  }, []);

  // 필터 적용
  useEffect(() => {
    const filtered = applyFilters(users, filters);
    setFilteredUsers(filtered);
  }, [users, filters]);

  const statCards = [
    {
      title: '전체 사용자',
      value: stats.total,
      icon: UsersIcon,
      color: 'blue' as const,
    },
    {
      title: '활성 사용자',
      value: stats.active,
      icon: UserCheck,
      color: 'green' as const,
    },
    {
      title: '비활성 사용자',
      value: stats.inactive,
      icon: UserX,
      color: 'red' as const,
    },
    {
      title: '관리자',
      value: stats.adminCount,
      icon: Crown,
      color: 'purple' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* 메인 콘텐츠 */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* 헤더 */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />
        
        {/* 페이지 콘텐츠 */}
        <main className="p-6">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
                <p className="text-gray-600 mt-2">
                  시스템 사용자를 관리하고 권한을 설정하세요.
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {checkPermission('user:create') && (
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setShowUserModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    새 사용자
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${
                          card.color === 'blue' ? 'text-blue-600' :
                          card.color === 'green' ? 'text-green-600' :
                          card.color === 'red' ? 'text-red-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {card.title}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {card.value}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 필터 및 검색 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">사용자 목록</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
                    title="새로고침"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-md border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    title="필터"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 검색 바 */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  placeholder="이름, 이메일, 부서로 검색..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 필터 패널 */}
              {showFilters && (
                <UserFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
              )}
            </div>
          </div>

          {/* 사용자 테이블 */}
          <UserTable
            users={filteredUsers}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
            onEdit={(user) => {
              setEditingUser(user);
              setShowUserModal(true);
            }}
            onDelete={handleDeleteUsers}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </main>
      </div>

      {/* 사용자 모달 */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement; 