import { useIsDark } from '@/hooks/useIsDark'

export type ChartTheme = {
  gridStroke: string
  axisTick: { fill: string; fontSize: number }
  tooltip: { wrapperStyle: React.CSSProperties; contentStyle: React.CSSProperties; labelStyle: React.CSSProperties }
  legend: { wrapperStyle: React.CSSProperties }
  colors: {
    primary: string
    success: string
    warning: string
    danger: string
    indigo: string
    neutral: string
  }
}

export function useChartTheme(): ChartTheme {
  const isDark = useIsDark()
  const text = isDark ? '#e2e8f0' : '#334155'
  const grid = isDark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)'
  const surface = isDark ? '#0f172a' : '#ffffff'

  return {
    gridStroke: grid,
    axisTick: { fill: text, fontSize: 12 },
    tooltip: {
      wrapperStyle: { border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderRadius: 8 },
      contentStyle: { background: surface, color: text, borderRadius: 8 },
      labelStyle: { color: text },
    },
    legend: {
      wrapperStyle: { color: text },
    },
    colors: {
      primary: '#2c7be5',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      indigo: '#6366f1',
      neutral: '#94a3b8',
    },
  }
}

export const PIE_COLORS: string[] = [
  '#2c7be5',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#059669',
  '#22c55e',
  '#84cc16',
  '#14b8a6',
]


