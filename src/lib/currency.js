/**
 * Resolve the display amount of a transaction for a given target currency.
 *
 * Handles ARS↔USD conversion using the stored exchange_rate when needed.
 */
export function getAmount(t, currency) {
  if (currency === 'USD') {
    if (t.amount_usd) return parseFloat(t.amount_usd)
    if (t.currency === 'USD') return parseFloat(t.amount) || 0
    const rate = parseFloat(t.exchange_rate)
    return rate ? (parseFloat(t.amount) || 0) / rate : 0
  }
  if (t.currency === 'ARS') return parseFloat(t.amount) || 0
  const rate = parseFloat(t.exchange_rate)
  return rate ? (parseFloat(t.amount) || 0) * rate : 0
}
