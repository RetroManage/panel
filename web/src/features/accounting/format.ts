export const formatMoney = (amount: number, currency = 'Toman') => {
  const normalized = (currency || 'Toman').trim().toLowerCase()
  const value = Number.isFinite(amount) ? amount : 0

  if (['toman', 'tmn', 'تومان'].includes(normalized)) {
    return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(value)} تومان`
  }

  if (normalized === 'irr' || normalized === 'rial' || normalized === 'ریال') {
    return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(value / 10)} تومان`
  }

  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value || 0)
