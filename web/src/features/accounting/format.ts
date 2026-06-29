export const formatMoney = (amount: number, currency = 'Toman') => {
  const normalized = (currency || 'Toman').trim().toLowerCase()
  const value = Number.isFinite(amount) ? amount : 0
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

  if (['toman', 'tmn', 'تومان'].includes(normalized)) {
    return `${formatter.format(value)} Toman`
  }

  if (normalized === 'irr' || normalized === 'rial' || normalized === 'ریال') {
    return `${formatter.format(value / 10)} Toman`
  }

  return `${formatter.format(value)} ${currency || 'Toman'}`
}

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value || 0)
