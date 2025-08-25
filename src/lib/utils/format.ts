export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN')
}


