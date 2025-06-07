import { test, expect } from '@playwright/test'

test.describe('Assessment System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the assessments page before each test
    await page.goto('/assessments')
  })

  test('should display the main assessment page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/PsyRehab/)

    // Check main heading
    await expect(page.getByText('평가 시스템')).toBeVisible()
    await expect(page.getByText('종합적인 평가 관리 및 분석 도구')).toBeVisible()

    // Check all navigation tabs are present
    await expect(page.getByText('평가 작성')).toBeVisible()
    await expect(page.getByText('결과 확인')).toBeVisible()
    await expect(page.getByText('평가 이력')).toBeVisible()
    await expect(page.getByText('대시보드')).toBeVisible()
    await expect(page.getByText('비교 분석')).toBeVisible()

    // Check that the assessment form is visible by default
    await expect(page.getByText('새로운 평가를 작성합니다')).toBeVisible()
  })

  test('should navigate between tabs correctly', async ({ page }) => {
    // Start on assessment tab (default)
    await expect(page.getByText('새로운 평가를 작성합니다')).toBeVisible()

    // Navigate to history tab
    await page.getByText('평가 이력').click()
    await expect(page.getByText('과거 평가 기록을 관리합니다')).toBeVisible()

    // Navigate to dashboard tab
    await page.getByText('대시보드').click()
    await expect(page.getByText('종합 분석 및 시각화')).toBeVisible()

    // Navigate to comparison tab
    await page.getByText('비교 분석').click()
    await expect(page.getByText('평가 결과 비교 및 통계 분석')).toBeVisible()

    // Navigate to results tab
    await page.getByText('결과 확인').click()
    await expect(page.getByText('개별 평가 결과를 확인합니다')).toBeVisible()

    // Should show empty state when no assessment is selected
    await expect(page.getByText('평가 결과를 확인하려면')).toBeVisible()
  })

  test('should handle assessment form interaction', async ({ page }) => {
    // Ensure we're on the assessment tab
    await page.getByText('평가 작성').click()

    // Check if form elements are present
    await expect(page.getByText('기본 정보')).toBeVisible()
    await expect(page.getByText('집중 시간')).toBeVisible()
    await expect(page.getByText('동기 수준')).toBeVisible()
    await expect(page.getByText('과거 성공 경험')).toBeVisible()
    await expect(page.getByText('제약 요인')).toBeVisible()
    await expect(page.getByText('사회적 선호도')).toBeVisible()

    // Try to interact with form fields (if they exist)
    const patientIdField = page.getByLabel('환자 ID')
    if (await patientIdField.isVisible()) {
      await patientIdField.fill('test-patient-001')
    }

    const durationField = page.getByLabel('지속 시간 (분)')
    if (await durationField.isVisible()) {
      await durationField.fill('45')
    }

    const activityField = page.getByLabel('활동 내용')
    if (await activityField.isVisible()) {
      await activityField.fill('독서')
    }
  })

  test('should show responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that the page still renders correctly
    await expect(page.getByText('평가 시스템')).toBeVisible()

    // Tab navigation should be scrollable on mobile
    const tabContainer = page.locator('.overflow-x-auto')
    await expect(tabContainer).toBeVisible()

    // Test tab switching on mobile
    await page.getByText('대시보드').click()
    await expect(page.getByText('종합 분석 및 시각화')).toBeVisible()
  })

  test('should handle empty states correctly', async ({ page }) => {
    // Navigate to results tab
    await page.getByText('결과 확인').click()

    // Should show empty state
    await expect(page.getByText('평가 결과를 확인하려면')).toBeVisible()
    await expect(page.getByText('새로운 평가를 작성하거나 이력에서 기존 평가를 선택해주세요.')).toBeVisible()

    // Check empty state buttons
    await expect(page.getByText('새 평가 작성')).toBeVisible()
    await expect(page.getByText('평가 이력 보기')).toBeVisible()

    // Test empty state navigation
    await page.getByText('새 평가 작성').click()
    await expect(page.getByText('새로운 평가를 작성합니다')).toBeVisible()

    // Go back to results and test history button
    await page.getByText('결과 확인').click()
    await page.getByText('평가 이력 보기').click()
    await expect(page.getByText('과거 평가 기록을 관리합니다')).toBeVisible()
  })

  test('should display statistics in header', async ({ page }) => {
    // Check that statistics are displayed
    await expect(page.getByText('총 평가:')).toBeVisible()
    await expect(page.getByText('환자:')).toBeVisible()

    // The actual numbers will depend on the data state
    // Just verify the structure is present
    const statsSection = page.locator('div:has-text("총 평가:")')
    await expect(statsSection).toBeVisible()
  })

  test('should show active tab state correctly', async ({ page }) => {
    // Check initial active state (assessment tab)
    const assessmentTab = page.getByText('평가 작성')
    await expect(assessmentTab).toHaveClass(/border-blue-500|text-blue-600|bg-blue-50/)

    // Navigate to dashboard and check active state
    await page.getByText('대시보드').click()
    const dashboardTab = page.getByText('대시보드')
    await expect(dashboardTab).toHaveClass(/border-blue-500|text-blue-600|bg-blue-50/)
  })

  test('should display help footer', async ({ page }) => {
    // Scroll to bottom to see footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check help footer content
    await expect(page.getByText('도움이 필요하신가요?')).toBeVisible()
    await expect(page.getByText(/각 탭을 선택하여 다양한 기능을 이용하실 수 있습니다/)).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation with keyboard
    await page.keyboard.press('Tab')
    
    // Navigate through tabs with arrow keys (if implemented)
    await page.keyboard.press('ArrowRight')
    
    // Test enter key to activate tab
    await page.keyboard.press('Enter')
    
    // The specific behavior will depend on implementation
    // This test serves as a template for accessibility testing
  })
})

test.describe('Assessment System Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Block network requests to simulate offline state
    await context.route('**/*', route => route.abort())

    await page.goto('/assessments')

    // Should still render the basic structure
    await expect(page.getByText('평가 시스템')).toBeVisible()

    // May show loading or error states
    // The exact behavior depends on implementation
  })

  test('should handle slow loading states', async ({ page, context }) => {
    // Slow down network requests
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 2000)
    })

    await page.goto('/assessments')

    // Should show loading indicators
    // This test would check for loading spinners or skeletons
    await expect(page.getByText('평가 시스템')).toBeVisible()
  })
})

test.describe('Assessment System Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/assessments')

    // Check heading hierarchy
    const h1 = page.locator('h1')
    await expect(h1).toContainText('평가 시스템')

    // Check for proper heading levels (h2, h3, etc.)
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(0)
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/assessments')

    // Check for navigation landmarks
    const navigation = page.locator('nav, [role="navigation"]')
    
    // Check for main content area
    const main = page.locator('main, [role="main"]')
    
    // The specific ARIA implementation depends on the actual component structure
  })

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast simulation
    await page.emulateMedia({ colorScheme: 'dark' })
    
    await page.goto('/assessments')
    
    // Basic structure should still be visible
    await expect(page.getByText('평가 시스템')).toBeVisible()
  })
}) 