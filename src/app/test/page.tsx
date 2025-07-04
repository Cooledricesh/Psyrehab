import { Button } from '@/components/ui/button'

export default function TestPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800">About.tsx Preview</h2>
        <p className="text-sm text-blue-600">아래는 About.tsx 페이지의 내용입니다:</p>
      </div>

      <header className="text-center">
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">
          PsyRehab 소개
        </h1>
        <p className="text-xl text-muted-foreground">
          정신장애인 재활을 위한 혁신적인 디지털 솔루션
        </p>
      </header>
      
      <section className="space-y-8">
        <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
          <h2 className="text-2xl font-semibold font-display mb-4 text-primary">
            플랫폼 목적
          </h2>
          <p className="text-foreground leading-relaxed">
            PsyRehab은 정신과 사회복지사들이 환자의 재활 목표를 더욱 체계적이고 
            효과적으로 관리할 수 있도록 도와주는 전문 플랫폼입니다. 
            AI 기술을 활용하여 개인화된 목표 설정과 진행 상황 추적을 지원합니다.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-semibold font-display mb-3 text-secondary">
              주요 기능
            </h3>
            <ul className="space-y-2 text-card-foreground">
              <li>• 개별화된 재활 목표 설정</li>
              <li>• AI 기반 목표 추천 시스템</li>
              <li>• 실시간 진행 상황 모니터링</li>
              <li>• 종합적인 평가 및 보고서</li>
              <li>• 사회복지사 협업 도구</li>
            </ul>
          </div>
          
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-semibold font-display mb-3 text-accent">
              대상 사용자
            </h3>
            <ul className="space-y-2 text-card-foreground">
              <li>• 정신과 사회복지사</li>
              <li>• 정신건강 전문가</li>
              <li>• 재활 관련 기관</li>
              <li>• 정신장애인 지원 센터</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-muted/50 p-6 rounded-lg border border-border">
          <h2 className="text-2xl font-semibold font-display mb-4 text-foreground">
            기술 스택
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="font-semibold text-primary">Frontend</div>
              <div className="text-sm text-muted-foreground">React + TypeScript</div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="font-semibold text-secondary">Backend</div>
              <div className="text-sm text-muted-foreground">Supabase</div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="font-semibold text-accent">AI/ML</div>
              <div className="text-sm text-muted-foreground">OpenAI API</div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="font-semibold text-success">UI/UX</div>
              <div className="text-sm text-muted-foreground">Tailwind CSS</div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Button size="lg">홈으로 돌아가기</Button>
        </div>
      </section>
    </div>
  )
} 