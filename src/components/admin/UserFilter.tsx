import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, RefreshCw } from 'lucide-react'

interface UserFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterRole: string
  onFilterRoleChange: (value: string) => void
  onRefresh: () => void
}

export function UserFilter({ 
  searchTerm, 
  onSearchChange, 
  filterRole, 
  onFilterRoleChange, 
  onRefresh 
}: UserFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>사용자 검색</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="이름, 이메일, 직원번호로 검색..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterRole} onValueChange={onFilterRoleChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="역할 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="administrator">관리자</SelectItem>
              <SelectItem value="staff">사원</SelectItem>
              <SelectItem value="assistant_manager">주임</SelectItem>
              <SelectItem value="section_chief">계장</SelectItem>
              <SelectItem value="manager_level">과장</SelectItem>
              <SelectItem value="department_head">부장</SelectItem>
              <SelectItem value="vice_director">부원장</SelectItem>
              <SelectItem value="director">원장</SelectItem>
              <SelectItem value="attending_physician">주치의</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}