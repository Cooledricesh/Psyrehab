import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    desktop: true
  })

  const [preferences, setPreferences] = useState({
    language: 'ko',
    timezone: 'Asia/Seoul',
    theme: 'light'
  })

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">설정</h1>
        <p className="text-muted-foreground">플랫폼 환경 설정을 관리하세요</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 일반 설정 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold font-display mb-4">일반 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">언어</label>
              <select 
                value={preferences.language}
                onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                className="w-full p-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">시간대</label>
              <select 
                value={preferences.timezone}
                onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                className="w-full p-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Asia/Seoul">서울 (GMT+9)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">테마</label>
              <select 
                value={preferences.theme}
                onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                className="w-full p-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="light">라이트 모드</option>
                <option value="dark">다크 모드</option>
                <option value="system">시스템 설정</option>
              </select>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold font-display mb-4">알림 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">이메일 알림</label>
                <p className="text-xs text-muted-foreground">중요한 업데이트를 이메일로 받기</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.email}
                onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                className="toggle"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">푸시 알림</label>
                <p className="text-xs text-muted-foreground">브라우저 푸시 알림 받기</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.push}
                onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                className="toggle"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">데스크톱 알림</label>
                <p className="text-xs text-muted-foreground">시스템 알림 받기</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.desktop}
                onChange={(e) => setNotifications({...notifications, desktop: e.target.checked})}
                className="toggle"
              />
            </div>
          </div>
        </div>

        {/* 보안 설정 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold font-display mb-4">보안 설정</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">비밀번호 변경</h3>
              <Button variant="outline" className="w-full">비밀번호 변경</Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">2단계 인증</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">추가 보안을 위한 2FA 활성화</span>
                <Button variant="outline" size="sm">설정</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">세션 관리</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">모든 기기에서 로그아웃</span>
                <Button variant="outline" size="sm">로그아웃</Button>
              </div>
            </div>
          </div>
        </div>

        {/* 데이터 설정 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold font-display mb-4">데이터 설정</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">데이터 내보내기</h3>
              <p className="text-xs text-muted-foreground mb-2">환자 데이터를 안전하게 내보내기</p>
              <Button variant="outline" className="w-full">데이터 내보내기</Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">백업 설정</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">자동 백업 활성화</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-border">
        <Button variant="outline">초기화</Button>
        <Button>변경사항 저장</Button>
      </div>
    </div>
  )
} 