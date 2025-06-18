# Accessibility Guidelines for PsyRehab

## Text Alternatives for Non-Text Content

This document provides guidelines for implementing proper text alternatives for images, icons, and other non-text content in the PsyRehab application.

### Icon Accessibility

#### Using AccessibleIcon Component

For Lucide React icons, use the `AccessibleIcon` component:

```tsx
import { AccessibleIcon, IconLabels } from '@/components/ui/accessible-icon'
import { Save } from 'lucide-react'

// Meaningful icon (provides information)
<AccessibleIcon 
  icon={Save} 
  label={IconLabels.save} 
  size={16}
/>

// Decorative icon (doesn't add information)
<AccessibleIcon 
  icon={Save} 
  label="저장" 
  decorative={true}
  size={16}
/>
```

#### Using EmojiIcon Component

For emoji characters, use the `EmojiIcon` component:

```tsx
import { EmojiIcon } from '@/components/ui/accessible-icon'

// Meaningful emoji
<EmojiIcon 
  emoji="🔔" 
  label="알림 설정"
  decorative={false}
/>

// Decorative emoji
<EmojiIcon 
  emoji="🎉" 
  label="축하"
  decorative={true}
/>
```

#### Using IconButton Component

For clickable icons, use the `IconButton` component:

```tsx
import { IconButton } from '@/components/ui/accessible-icon'
import { Trash2 } from 'lucide-react'

<IconButton 
  icon={Trash2}
  label="항목 삭제"
  onClick={handleDelete}
  variant="destructive"
/>
```

### Image Accessibility

#### Required Attributes

All images must have appropriate `alt` attributes:

```tsx
// Informative image
<img 
  src="/chart.png" 
  alt="2024년 환자 진행률 차트: 85% 개선 보임"
  className="w-full h-64"
/>

// Decorative image
<img 
  src="/decoration.png" 
  alt=""
  aria-hidden="true"
  className="absolute top-0 right-0"
/>

// Complex image with description
<img 
  src="/complex-chart.png" 
  alt="월별 평가 결과 차트"
  aria-describedby="chart-description"
/>
<div id="chart-description" className="sr-only">
  1월부터 12월까지 월별 평가 결과를 보여주는 차트입니다. 
  1월 60점에서 시작하여 꾸준히 상승하여 12월 92점에 도달했습니다.
</div>
```

### Status Indicators

#### Using Accessible Status Badges

```tsx
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge'

<GoalStatusBadge 
  status="completed"
  size="md"
  showIcon={true}
/>
```

#### Screen Reader Announcements

```tsx
import { useLiveAnnouncement } from '@/components/ui/live-region'

const announce = useLiveAnnouncement()

const handleStatusChange = (newStatus: string) => {
  announce(`상태가 ${newStatus}로 변경되었습니다`)
}
```

### Charts and Graphs

#### Accessible Chart Implementation

```tsx
// Chart component with text alternative
<div className="relative">
  <canvas 
    ref={chartRef}
    aria-label="월별 진행률 차트"
    aria-describedby="chart-data-table"
  />
  
  {/* Data table as text alternative */}
  <table id="chart-data-table" className="sr-only">
    <caption>월별 진행률 데이터</caption>
    <thead>
      <tr>
        <th>월</th>
        <th>진행률 (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1월</td>
        <td>65%</td>
      </tr>
      {/* ... more data rows */}
    </tbody>
  </table>
</div>
```

### Form Elements

#### Input Field Icons

```tsx
// Password visibility toggle (already implemented)
<button
  type="button"
  onClick={toggleVisibility}
  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
  aria-pressed={showPassword}
>
  <AccessibleIcon 
    icon={showPassword ? EyeOff : Eye}
    label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
    decorative={true}
  />
</button>

// Validation status icons
<AccessibleIcon 
  icon={error ? AlertCircle : CheckCircle}
  label={error ? '입력 오류' : '입력 성공'}
  decorative={false}
/>
```

### Loading States

#### Accessible Loading Indicators

```tsx
// Loading spinner
<AccessibleIcon 
  icon={Loader2}
  label="로딩 중"
  className="animate-spin"
/>

// Loading announcement
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isLoading ? '데이터를 불러오는 중입니다' : '데이터 로딩이 완료되었습니다'}
</div>
```

### Best Practices

#### DO ✅

- Provide meaningful alt text that describes the content or function
- Use `decorative={true}` for purely decorative icons
- Include text alternatives for complex images like charts
- Use `aria-live` regions for dynamic content changes
- Test with screen readers

#### DON'T ❌

- Use generic alt text like "image" or "icon"
- Describe the appearance instead of the meaning
- Forget alt attributes on images
- Use color alone to convey information
- Make alt text too verbose

### Testing

#### Manual Testing

1. Navigate using only keyboard (Tab, Enter, Arrow keys)
2. Use screen reader (NVDA, JAWS, VoiceOver)
3. Test with high contrast mode
4. Verify focus indicators are visible

#### Automated Testing

```bash
# Install axe-core for accessibility testing
npm install --save-dev @axe-core/react

# Run accessibility tests
npm run test:a11y
```

### Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

*Updated: 2024-06-07*
*Version: 1.0* 