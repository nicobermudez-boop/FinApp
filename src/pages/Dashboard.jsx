import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import CurrencyToggle from '../components/CurrencyToggle'
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line
} from 'recharts'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const PERIODS = [
  { key: 'all', label: 'All' },
  { key: 'ytd', label: 'YTD' },
  { key: '1m', label: '1m' },
  { key: '3m', label: '3m' },
  { key: '6m', label: '6m' },
  { key: '1y', label: '1y' },
]
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getAmount(t, currency) {
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

function fmt(v, c) {
  if (v == null || isNaN(v)) return '\u2013'
  return new Intl.NumberFormat(c === 'USD' ? 'en-US' : 'es-AR', { style: 'currency', currency: c, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

function fmtC(v, c) {
  if (v == null || isNaN(v)) return '\u2013'
  return new Intl.NumberFormat(c === 'USD' ? 'en-US' : 'es-AR', { style: 'currency', currency: c, minimumFractionDigits: 1, maximumFractionDigits: 1, notation: 'compact' }).format(v)
}

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.stroke }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{fmt(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('ARS')
  const [period, setPeriod] = useState('ytd')
  const [excludeViajes, setExcludeViajes] = useState(false)
  const [excludeExtra, setExcludeExtra] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data } = await supabase.from('transactions').select('*, categories(name)').order('date', { ascending: true })
      setTransactions(data || [])
      setLoading(false)
    })()
  }, [])

  const { kpis, chartData } = useMemo(() => {
    let filtered = [...transactions]
    if (excludeViajes) filtered = filtered.filter(t => t.categories?.name !== 'Viajes')
    if (excludeExtra) filtered = filtered.filter(t => t.income_subtype !== 'extraordinario')

    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
    let startDate

    if (period === 'all') {
      const times = filtered.map(t => new Date(t.date + 'T00:00:00').getTime()).filter(x => !isNaN(x))
      const minT = times.length ? Math.min(...times) : endDate.getTime()
      const minD = new Date(minT)
      startDate = new Date(minD.getFullYear(), minD.getMonth(), 1)
    } else if (period === 'ytd') {
      startDate = new Date(now.getFullYear(), 0, 1)
    } else {
      const m = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }[period]
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - m + 1, 1)
    }

    const totalM = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() + 1

    // Previous period
    let prevStart, prevEnd
    if (period === 'ytd' || period === 'all') {
      prevStart = new Date(startDate.getFullYear() - 1, startDate.getMonth(), 1)
      prevEnd = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())
    } else {
      prevEnd = new Date(startDate); prevEnd.setDate(prevEnd.getDate() - 1)
      prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - totalM + 1, 1)
    }

    const inR = (t, s, e) => { const d = new Date(t.date + 'T00:00:00'); return d >= s && d <= e }
    const cur = filtered.filter(t => inR(t, startDate, endDate))
    const prev = filtered.filter(t => inR(t, prevStart, prevEnd))

    const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + getAmount(t, currency), 0)
    const cI = sum(cur, 'income'), cE = sum(cur, 'expense'), cS = cI - cE
    const pI = sum(prev, 'income'), pE = sum(prev, 'expense'), pS = pI - pE
    const vari = (c, p) => (!p || p === 0) ? null : ((c - p) / Math.abs(p)) * 100

    // Grouping
    const useQ = totalM > 12
    const bMap = {}
    cur.forEach(t => {
      const d = new Date(t.date + 'T00:00:00')
      let key, label
      if (useQ) { const q = Math.floor(d.getMonth() / 3) + 1; key = `${d.getFullYear()}-Q${q}`; label = `Q${q} ${String(d.getFullYear()).slice(2)}` }
      else { key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; label = MONTHS_SHORT[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) }
      if (!bMap[key]) bMap[key] = { label, income: 0, expense: 0 }
      const a = getAmount(t, currency)
      if (t.type === 'income') bMap[key].income += a; else bMap[key].expense += a
    })

    const buckets = []
    const seen = new Set()
    const it = new Date(startDate)
    while (it <= endDate) {
      let key, label
      if (useQ) { const q = Math.floor(it.getMonth() / 3) + 1; key = `${it.getFullYear()}-Q${q}`; label = `Q${q} ${String(it.getFullYear()).slice(2)}`; it.setMonth(it.getMonth() + 3) }
      else { key = `${it.getFullYear()}-${String(it.getMonth()+1).padStart(2,'0')}`; label = MONTHS_SHORT[it.getMonth()] + ' ' + String(it.getFullYear()).slice(2); it.setMonth(it.getMonth() + 1) }
      if (!seen.has(key)) { seen.add(key); const d = bMap[key] || { income: 0, expense: 0 }; buckets.push({ name: label, Ingresos: Math.round(d.income), Gastos: Math.round(d.expense), Ahorro: Math.round(d.income - d.expense) }) }
    }

    const nm = totalM || 1
    return {
      kpis: {
        income: { value: cI, diff: cI - pI, pct: vari(cI, pI) },
        expense: { value: cE, diff: cE - pE, pct: vari(cE, pE) },
        savings: { value: cS, diff: cS - pS, pct: vari(cS, pS) },
        avgIncome: cI / nm, avgExpense: cE / nm, avgSavings: cS / nm,
      },
      chartData: buckets,
    }
  }, [transactions, currency, period, excludeViajes, excludeExtra])

  const cards = [
    { label: 'Ingresos', ...kpis.income, color: 'var(--color-income)', upGood: true },
    { label: 'Gastos', ...kpis.expense, color: 'var(--color-expense)', upGood: false },
    { label: 'Ahorro', ...kpis.savings, color: '#3b82f6', upGood: true },
  ]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text-muted)' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /><span>Cargando...</span></div>

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard</h1>
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: period === p.key ? 'var(--color-accent)' : 'transparent', color: period === p.key ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: period === p.key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>{p.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ k: 'v', s: excludeViajes, f: setExcludeViajes, l: '✈️ Viajes' }, { k: 'e', s: excludeExtra, f: setExcludeExtra, l: '💰 Extraordinarios' }].map(c => (
              <button key={c.k} onClick={() => c.f(!c.s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', ...(c.s ? { background: 'var(--color-expense-bg)', borderColor: 'var(--color-expense-border)', color: 'var(--color-expense-light)', textDecoration: 'line-through' } : { background: 'var(--color-accent-bg)', borderColor: 'rgba(139,92,246,0.3)', color: 'var(--color-accent)' }) }}>{c.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
          {cards.map(k => {
            const up = k.diff > 0, neut = Math.abs(k.diff) < 0.01
            const Icon = neut ? Minus : up ? TrendingUp : TrendingDown
            const tc = neut ? 'var(--text-dim)' : (up === k.upGood) ? 'var(--color-income)' : 'var(--color-expense)'
            return (
              <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: k.color, letterSpacing: '-0.02em', marginBottom: 8 }}>{fmt(k.value, currency)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Icon size={14} style={{ color: tc }} />
                  <span style={{ color: tc, fontWeight: 600 }}>{k.pct != null ? `${k.pct >= 0 ? '+' : ''}${k.pct.toFixed(1)}%` : '\u2013'}</span>
                  <span style={{ color: 'var(--text-dim)' }}>({k.diff >= 0 ? '+' : ''}{fmtC(k.diff, currency)})</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Cashflow</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              <div>Prom. Ing: <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-income)' }}>{fmtC(kpis.avgIncome, currency)}</span></div>
              <div>Prom. Gas: <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-expense)' }}>{fmtC(kpis.avgExpense, currency)}</span></div>
              <div>Prom. Ah: <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#3b82f6' }}>{fmtC(kpis.avgSavings, currency)}</span></div>
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtC(v, currency)} width={60} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="#22c55e" opacity={0.8} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" opacity={0.8} radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="Ahorro" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
