export const formatMoney = (amount: number, currency = 'IRR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value || 0)
