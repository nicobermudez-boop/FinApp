/**
 * Shared currency formatting utilities.
 *
 * Two families of formatters:
 *  - fmt / fmtCompact / fmtLabel  — display-oriented (Intl.NumberFormat)
 *  - fmtForm                       — form-input oriented (Carga / TransactionForm)
 */

// ── Display formatters (analysis pages, historial, etc.) ────────────────────

export function fmt(value, currency) {
  if (value === null || value === undefined || isNaN(value)) return '\u2013'
  if (currency === 'USD')
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

export function fmtCompact(value, currency) {
  if (value == null || isNaN(value)) return '\u2013'
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0, notation: 'compact',
  }).format(value)
}

export function fmtLabel(value) {
  if (!value) return ''
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`
  return `${sign}$${Math.round(abs)}`
}

export function fmtSmart(value, currency) {
  if (value == null || isNaN(value)) return '\u2013'
  const abs = Math.abs(value)
  const threshold = currency === 'USD' ? 1000 : 100000
  return abs >= threshold ? fmtCompact(value, currency) : fmt(value, currency)
}

// ── Form-input formatters (Carga, TransactionForm, RecentTransactions) ──────

export function fmtForm(n, c = 'ARS') {
  if (!n && n !== 0) return ''
  const a = Math.abs(Number(n))
  return c === 'USD'
    ? `US$ ${a.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$ ${a.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function fmtInput(raw, currency) {
  if (!raw) return ''
  if (currency === 'USD') {
    const parts = raw.split('.')
    const int = (parseInt(parts[0], 10) || 0).toString()
    const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')
    return parts.length > 1 ? formatted + ',' + parts[1] : formatted
  }
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ''
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')
}
