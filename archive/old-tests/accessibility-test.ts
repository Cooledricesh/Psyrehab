import React from 'react'
import ReactDOM from 'react-dom'
import axe from '@axe-core/react'

/**
 * Accessibility testing utilities for PsyRehab
 */

export const initializeAccessibilityTesting = () => {
  if (process.env.NODE_ENV === 'development') {
    axe(React, ReactDOM, 1000, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-markup': { enabled: true },
        'focus-management': { enabled: true },
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
      locale: 'ko', // Korean locale
    })
  }
}

/**
 * Manual accessibility testing checklist
 */
export const accessibilityTestChecklist = {
  keyboard: [
    '탭 키로 모든 인터랙티브 요소에 접근 가능',
    '엔터/스페이스 키로 버튼 및 링크 활성화',
    '화살표 키로 메뉴 및 탭 네비게이션',
    '이스케이프 키로 모달 및 드롭다운 닫기',
    '포커스 표시기가 명확하게 보임',
    '포커스 순서가 논리적',
  ],
  screenReader: [
    '모든 이미지에 적절한 alt 텍스트',
    '폼 라벨과 입력 필드 연결',
    '에러 메시지 스크린 리더로 읽힘',
    '동적 콘텐츠 변경 시 알림',
    '테이블 헤더와 셀 연결',
    '버튼과 링크 목적 명확',
  ],
  visual: [
    '텍스트 대비율 4.5:1 이상',
    '200% 확대 시 텍스트 읽기 가능',
    '색상 외 다른 표시로 정보 전달',
    '애니메이션 비활성화 옵션',
    '고대비 모드 지원',
  ],
  cognitive: [
    '명확하고 일관된 네비게이션',
    '에러 메시지 이해하기 쉬움',
    '복잡한 작업 단계별 분할',
    '시간 제한 있는 작업 경고',
    '실행 취소 기능 제공',
  ]
}

/**
 * Automated accessibility test runner
 */
export const runAccessibilityTests = async (element?: HTMLElement): Promise<axe.AxeResults> => {
  if (typeof window === 'undefined') {
    throw new Error('Accessibility tests can only run in browser environment')
  }

  const target = element || document.body
  
  try {
    const results = await axe.run(target, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'frame-title': { enabled: true },
        'html-has-lang': { enabled: true },
        'image-alt': { enabled: true },
        'input-image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'meta-refresh': { enabled: true },
        'region': { enabled: true },
        'skip-link': { enabled: true },
        'tabindex': { enabled: true },
        'table-caption': { enabled: true },
        'td-headers-attr': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'valid-lang': { enabled: true },
        'video-caption': { enabled: true },
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    })

    return results
  } catch {
    console.error("Error occurred")
    throw error
  }
}

/**
 * Format accessibility test results for console output
 */
export const formatAccessibilityResults = (results: axe.AxeResults): string => {
  const { violations, passes, incomplete } = results
  
  let output = '\n=== 접근성 테스트 결과 ===\n'
  
  output += `✅ 통과: ${passes.length}개\n`
  output += `❌ 위반: ${violations.length}개\n`
  output += `⚠️ 불완전: ${incomplete.length}개\n\n`
  
  if (violations.length > 0) {
    output += '🚨 접근성 위반 사항:\n'
    violations.forEach((violation, index) => {
      output += `${index + 1}. ${violation.help}\n`
      output += `   영향: ${violation.impact}\n`
      output += `   태그: ${violation.tags.join(', ')}\n`
      output += `   요소 수: ${violation.nodes.length}개\n`
      output += `   자세한 정보: ${violation.helpUrl}\n\n`
    })
  }
  
  if (incomplete.length > 0) {
    output += '⚠️ 수동 확인 필요:\n'
    incomplete.forEach((item, index) => {
      output += `${index + 1}. ${item.help}\n`
      output += `   요소 수: ${item.nodes.length}개\n\n`
    })
  }
  
  return output
}

/**
 * Generate accessibility report
 */
export const generateAccessibilityReport = async (): Promise<{
  summary: {
    passes: number
    violations: number
    incomplete: number
    score: number
  }
  details: axe.AxeResults
  recommendations: string[]
}> => {
  const results = await runAccessibilityTests()
  
  const summary = {
    passes: results.passes.length,
    violations: results.violations.length,
    incomplete: results.incomplete.length,
    score: Math.round((results.passes.length / (results.passes.length + results.violations.length)) * 100)
  }
  
  const recommendations = [
    '정기적인 접근성 테스트 실행',
    '스크린 리더로 직접 테스트',
    '키보드만으로 전체 앱 네비게이션 테스트',
    '실제 사용자 피드백 수집',
    '접근성 가이드라인 팀 교육'
  ]
  
  return {
    summary,
    details: results,
    recommendations
  }
}

export default {
  initializeAccessibilityTesting,
  runAccessibilityTests,
  formatAccessibilityResults,
  generateAccessibilityReport,
  accessibilityTestChecklist
} 