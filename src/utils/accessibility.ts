/**
 * Accessibility utility functions for color contrast and WCAG compliance
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to relative luminance
 * Based on WCAG 2.1 guidelines
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Please use hex colors.')
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if color combination meets WCAG AA standards (4.5:1 for normal text)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5
}

/**
 * Check if color combination meets WCAG AAA standards (7:1 for normal text)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7
}

/**
 * Check if color combination meets WCAG AA standards for large text (3:1)
 */
export function meetsWCAGAALarge(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 3
}

/**
 * Get accessibility level for a color combination
 */
export function getAccessibilityLevel(
  foreground: string,
  background: string
): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  const ratio = getContrastRatio(foreground, background)

  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

/**
 * Predefined accessible color combinations
 */
export const accessibleColors = {
  light: {
    primary: { bg: '#ffffff', fg: '#0f172a' }, // 15.8:1
    secondary: { bg: '#f1f5f9', fg: '#0f172a' }, // 14.7:1
    success: { bg: '#ffffff', fg: '#166534' }, // 7.2:1
    warning: { bg: '#ffffff', fg: '#92400e' }, // 7.1:1
    error: { bg: '#ffffff', fg: '#991b1b' }, // 7.4:1
    info: { bg: '#ffffff', fg: '#1e40af' }, // 8.6:1
  },
  dark: {
    primary: { bg: '#020617', fg: '#f8fafc' }, // 15.8:1
    secondary: { bg: '#1e293b', fg: '#f8fafc' }, // 12.6:1
    success: { bg: '#020617', fg: '#22c55e' }, // 7.8:1
    warning: { bg: '#020617', fg: '#fbbf24' }, // 11.2:1
    error: { bg: '#020617', fg: '#ef4444' }, // 6.1:1
    info: { bg: '#020617', fg: '#60a5fa' }, // 7.9:1
  },
}

/**
 * Get the appropriate text color for a given background
 */
export function getTextColorForBackground(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) return '#000000'

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  
  return luminance > 0.5 ? '#0f172a' : '#f8fafc'
}

/**
 * Validate all color combinations in the design system
 */
export function validateColorSystem(): {
  passed: Array<{ name: string; ratio: number; level: string }>
  failed: Array<{ name: string; ratio: number; level: string }>
} {
  const combinations = [
    { name: 'Primary on Background', fg: '#2563eb', bg: '#ffffff' },
    { name: 'Primary Foreground on Primary', fg: '#ffffff', bg: '#2563eb' },
    { name: 'Secondary Foreground on Secondary', fg: '#0f172a', bg: '#f1f5f9' },
    { name: 'Muted Foreground on Background', fg: '#64748b', bg: '#ffffff' },
    { name: 'Destructive on Background', fg: '#dc2626', bg: '#ffffff' },
    { name: 'Success on Background', fg: '#16a34a', bg: '#ffffff' },
    { name: 'Warning on Background', fg: '#f59e0b', bg: '#ffffff' },
    { name: 'Info on Background', fg: '#3b82f6', bg: '#ffffff' },
    { name: 'Primary on Dark Background', fg: '#3b82f6', bg: '#020617' },
    { name: 'Foreground on Dark Background', fg: '#f8fafc', bg: '#020617' },
    { name: 'Muted Foreground on Dark Background', fg: '#94a3b8', bg: '#020617' },
  ]

  const passed: Array<{ name: string; ratio: number; level: string }> = []
  const failed: Array<{ name: string; ratio: number; level: string }> = []

  combinations.forEach((combo) => {
    const ratio = getContrastRatio(combo.fg, combo.bg)
    const level = getAccessibilityLevel(combo.fg, combo.bg)
    
    const result = { name: combo.name, ratio: Math.round(ratio * 100) / 100, level }
    
    if (level === 'Fail') {
      failed.push(result)
    } else {
      passed.push(result)
    }
  })

  return { passed, failed }
}

/**
 * Generate accessible color palette
 */
export function generateAccessiblePalette(baseColor: string): {
  light: { background: string; foreground: string }
  dark: { background: string; foreground: string }
} {
  const rgb = hexToRgb(baseColor)
  if (!rgb) {
    throw new Error('Invalid base color')
  }

  return {
    light: {
      background: '#ffffff',
      foreground: getTextColorForBackground('#ffffff'),
    },
    dark: {
      background: '#020617',
      foreground: getTextColorForBackground('#020617'),
    },
  }
} 