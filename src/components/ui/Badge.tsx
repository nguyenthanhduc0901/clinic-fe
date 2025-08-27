type BadgeColor = 'primary' | 'neutral' | 'success' | 'warning' | 'danger'
type Props = {
  children: React.ReactNode
  color?: BadgeColor
}

export default function Badge({ children, color = 'primary' }: Props) {
  const colorMap: Record<BadgeColor, string> = {
    primary: 'bg-primary text-white',
    neutral: 'bg-neutral-400 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-amber-500 text-white',
    danger: 'bg-red-600 text-white',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${colorMap[color]}`}>{children}</span>
}


