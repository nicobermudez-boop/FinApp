import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import CurrencyToggle from '../components/CurrencyToggle'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar, Line, LabelList
} from 'recharts'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const PERIODS = [
  { key: 'all', label: 'All' },
  { key: 'ytd', label: 'YTD' },
  { key: '1m', label: '1m' },
  { key: '3m', label: '3m' },
  { key: '6m', label: '6m' },
  { key: '1y', label: '1y' },
]
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#64748b','#84cc16','#14b8a6','#f43f5e']

function getAmount(t, currency) {
  if (currency === 'USD') {
    if (t.amount_usd) return parseFloat(t.amount_usd)
    if (t.currency === 'USD') return parseFloat(t.amount) || 0
    const r = parseFloat(t.exchange_rate)
    return r ? (parseFloat(t.amount) || 0) / r : 0
  }
  if (t.currency === 'ARS') return parseFloat(t.amount) || 0
  const r = parseFloat(t.exchange_rate)
  return r ? (parseFloat(t.amount) || 0) * r : 0
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
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, boxShadow: 'var(--shadow-md)', maxWidth: 320 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.filter(p => p.value > 0 || p.dataKey === '% Ingresos').map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill || p.stroke, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{p.name}:</span>
          <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
            {p.dataKey === '% Ingresos' ? `${p.value}%` : fmt(p.value, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Drawer filter component for mobile
function FilterDrawer({ title, items, selected, onToggle, icon }) {
  const [open, setOpen] = useState(false)
  const count = selected.length
  const Icon = open ? ChevronUp : ChevronDown
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)',
        background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: 13,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <span>{icon} {title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {count > 0 && <span style={{ background: 'var(--color-accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{count}</span>}
          <Icon size={14} />
        </span>
      </button>
      {open && (
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 8, marginTop: 4, padding: 8, maxHeight: 240, overflowY: 'auto' }}>
          {items.map(item => {
            const on = selected.includes(item.id)
            return (
              <div key={item.id} onClick={() => onToggle(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px',
                borderRadius: 6, cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: on ? 'none' : '2px solid var(--border-default)',
                  background: on ? 'var(--color-accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#fff', fontWeight: 700,
                }}>{on && '\u2713'}</div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.icon || ''} {item.name}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Gastos() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [concepts, setConcepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('ARS')
  const [period, setPeriod] = useState('ytd')
  const [excludeExtra, setExcludeExtra] = useState(false)
  const [pieGroup, setPieGroup] = useState('category')
  const [tableGroup, setTableGroup] = useState('concept')
  const [filterCats, setFilterCats] = useState([])
  const [filterCons, setFilterCons] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const [txR, catR, subR, conR] = await Promise.all([
        supabase.from('transactions').select('*, categories(name, icon)').order('date', { ascending: true }),
        supabase.from('categories').select('*').eq('type', 'expense'),
        supabase.from('subcategories').select('*'),
        supabase.from('concepts').select('*'),
      ])
      setTransactions(txR.data || [])
      setCategories(catR.data || [])
      setSubcategories(subR.data || [])
      setConcepts(conR.data || [])
      setLoading(false)
    })()
  }, [])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const subMap = useMemo(() => Object.fromEntries(subcategories.map(s => [s.id, s])), [subcategories])
  const conMap = useMemo(() => Object.fromEntries(concepts.map(c => [c.id, c])), [concepts])

  // Concepts available based on selected categories
  const availableConcepts = useMemo(() => {
    if (!filterCats.length) return concepts.filter(c => {
      const sub = subMap[c.subcategory_id]
      return sub && categories.some(cat => cat.id === sub.category_id)
    })
    const catSubs = subcategories.filter(s => filterCats.includes(s.category_id))
    const subIds = new Set(catSubs.map(s => s.id))
    return concepts.filter(c => subIds.has(c.subcategory_id))
  }, [filterCats, concepts, subcategories, subMap, categories])

  const toggleCat = (id) => {
    setFilterCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setFilterCons([])
  }
  const toggleCon = (id) => setFilterCons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const { kpis, barData, pieData, tableData, catColors } = useMemo(() => {
    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
    let startDate

    if (period === 'all') {
      const times = transactions.map(t => new Date(t.date + 'T00:00:00').getTime()).filter(x => !isNaN(x))
      const minT = times.length ? Math.min(...times) : endDate.getTime()
      startDate = new Date(new Date(minT).getFullYear(), new Date(minT).getMonth(), 1)
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

    // Year ago
    const yaStart = new Date(startDate.getFullYear() - 1, startDate.getMonth(), 1)
    const yaEnd = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())

    const inR = (t, s, e) => { const d = new Date(t.date + 'T00:00:00'); return d >= s && d <= e }

    const expenses = transactions.filter(t => t.type === 'expense')
    let incomes = transactions.filter(t => t.type === 'income')
    if (excludeExtra) incomes = incomes.filter(t => t.income_subtype !== 'extraordinario')

    let curE = expenses.filter(t => inR(t, startDate, endDate))
    let prevE = expenses.filter(t => inR(t, prevStart, prevEnd))
    let yaE = expenses.filter(t => inR(t, yaStart, yaEnd))
    const curI = incomes.filter(t => inR(t, startDate, endDate))
    const prevI = incomes.filter(t => inR(t, prevStart, prevEnd))
    const yaI = incomes.filter(t => inR(t, yaStart, yaEnd))

    // Apply filters
    const applyFilters = (arr) => {
      let r = arr
      if (filterCats.length) r = r.filter(t => filterCats.includes(t.category_id))
      if (filterCons.length) r = r.filter(t => filterCons.includes(t.concept_id))
      return r
    }
    curE = applyFilters(curE); prevE = applyFilters(prevE); yaE = applyFilters(yaE)

    const totalExp = curE.reduce((s, t) => s + getAmount(t, currency), 0)
    const prevTotalExp = prevE.reduce((s, t) => s + getAmount(t, currency), 0)
    const yaTotalExp = yaE.reduce((s, t) => s + getAmount(t, currency), 0)
    const totalInc = curI.reduce((s, t) => s + getAmount(t, currency), 0)
    const prevTotalInc = prevI.reduce((s, t) => s + getAmount(t, currency), 0)
    const yaTotalInc = yaI.reduce((s, t) => s + getAmount(t, currency), 0)

    const avgM = totalExp / (totalM || 1)
    const prevAvgM = prevTotalExp / (totalM || 1)
    const yaAvgM = yaTotalExp / (totalM || 1)

    const pctInc = totalInc > 0 ? (totalExp / totalInc * 100) : null
    const prevPctInc = prevTotalInc > 0 ? (prevTotalExp / prevTotalInc * 100) : null
    const yaPctInc = yaTotalInc > 0 ? (yaTotalExp / yaTotalInc * 100) : null

    // Months
    const months = []
    const d = new Date(startDate)
    while (d <= endDate) { months.push({ y: d.getFullYear(), m: d.getMonth() }); d.setMonth(d.getMonth() + 1) }

    // Cat colors
    const uniqCats = [...new Set(curE.map(t => t.category_id).filter(Boolean))]
    const cCol = {}
    uniqCats.forEach((id, i) => { cCol[id] = COLORS[i % COLORS.length] })

    // Bar data
    const bData = months.map(({ y, m }) => {
      const label = MONTHS_SHORT[m] + ' ' + String(y).slice(2)
      const entry = { name: label }
      let mTotal = 0
      uniqCats.forEach(cid => {
        const a = curE.filter(t => { const td = new Date(t.date + 'T00:00:00'); return td.getFullYear() === y && td.getMonth() === m && t.category_id === cid }).reduce((s, t) => s + getAmount(t, currency), 0)
        entry[catMap[cid]?.name || cid] = Math.round(a)
        mTotal += a
      })
      entry._total = Math.round(mTotal)
      const mInc = curI.filter(t => { const td = new Date(t.date + 'T00:00:00'); return td.getFullYear() === y && td.getMonth() === m }).reduce((s, t) => s + getAmount(t, currency), 0)
      entry['% Ingresos'] = mInc > 0 ? Math.round((mTotal / mInc) * 100) : 0
      return entry
    })

    // Pie data
    const pMap = {}
    curE.forEach(t => {
      let key, name
      if (pieGroup === 'category') { key = t.category_id; name = catMap[t.category_id]?.name || '\u2013' }
      else if (pieGroup === 'subcategory') { key = t.subcategory_id; name = subMap[t.subcategory_id]?.name || '\u2013' }
      else { key = t.concept_id; name = conMap[t.concept_id]?.name || '\u2013' }
      if (!pMap[key]) pMap[key] = { name, value: 0 }
      pMap[key].value += getAmount(t, currency)
    })
    const pData = Object.values(pMap).map(d => ({ ...d, value: Math.round(d.value) })).sort((a, b) => b.value - a.value)
    const pieTotal = pData.reduce((s, d) => s + d.value, 0)

    // Table data with YA comparison
    const buildGroup = (arr, period2) => {
      const gMap = {}
      arr.forEach(t => {
        let key, name, parent
        if (tableGroup === 'concept') { key = t.concept_id; name = conMap[t.concept_id]?.name || '\u2013'; parent = subMap[t.subcategory_id]?.name || '\u2013' }
        else { key = t.description || conMap[t.concept_id]?.name || '(sin desc)'; name = t.description || conMap[t.concept_id]?.name || '(sin desc)'; parent = conMap[t.concept_id]?.name || '\u2013' }
        if (!gMap[key]) gMap[key] = { name, parent, total: 0 }
        gMap[key].total += getAmount(t, currency)
      })
      return gMap
    }

    const curGroup = buildGroup(curE)
    const yaGroup = buildGroup(yaE)

    const tData = Object.entries(curGroup).map(([key, row]) => {
      const yaRow = yaGroup[key]
      const yaTotal = yaRow ? yaRow.total : 0
      const diffAbs = row.total - yaTotal
      const diffPct = yaTotal > 0 ? ((row.total - yaTotal) / yaTotal * 100) : null
      const curPctI = totalInc > 0 ? (row.total / totalInc * 100) : 0
      const yaPctI = yaTotalInc > 0 ? (yaTotal / yaTotalInc * 100) : 0
      const bpsDiff = (curPctI - yaPctI) * 100
      return {
        ...row, total: Math.round(row.total),
        pctIncome: totalInc > 0 ? (row.total / totalInc * 100).toFixed(1) : '\u2013',
        avg: Math.round(row.total / (totalM || 1)),
        yaTotal: Math.round(yaTotal), diffAbs: Math.round(diffAbs),
        diffPct, bpsDiff: Math.round(bpsDiff),
      }
    }).sort((a, b) => b.total - a.total)

    return {
      kpis: {
        totalExp, prevTotalExp, yaTotalExp,
        totalInc, prevTotalInc, yaTotalInc,
        avgM, prevAvgM, yaAvgM,
        pctInc, prevPctInc, yaPctInc,
      },
      barData: bData, pieData: pData, tableData: tData, catColors: cCol,
    }
  }, [transactions, currency, period, excludeExtra, filterCats, filterCons, pieGroup, tableGroup, catMap, subMap, conMap, categories, concepts, subcategories])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text-muted)' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /><span>Cargando...</span></div>

  const pillS = (active) => ({
    padding: '4px 12px', borderRadius: 16, border: '1px solid',
    borderColor: active ? 'var(--color-accent)' : 'var(--border-subtle)',
    background: active ? 'var(--color-accent-bg)' : 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--text-muted)',
    fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  })

  const pieTotal = pieData.reduce((s, d) => s + d.value, 0)

  // Variation helpers
  const vPct = (cur, prev) => (!prev || prev === 0) ? null : ((cur - prev) / Math.abs(prev)) * 100
  const vColor = (v, upBad) => v == null ? 'var(--text-dim)' : (v > 0 === upBad) ? 'var(--color-expense-light)' : 'var(--color-income)'
  const fPct = (v) => v == null ? '' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
  const fBps = (cur, prev) => {
    if (cur == null || prev == null) return ''
    const diff = (cur - prev) * 100
    return `${diff >= 0 ? '+' : ''}${Math.round(diff)} bps`
  }

  // Custom bar label for total
  const TotalLabel = (props) => {
    const { x, y, width, value } = props
    if (!value) return null
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="'JetBrains Mono', monospace">{fmtC(value, currency)}</text>
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="page-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>🔍 Gastos</h1>
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: period === p.key ? 'var(--color-accent)' : 'transparent', color: period === p.key ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: period === p.key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>{p.label}</button>
            ))}
          </div>
          <button onClick={() => setExcludeExtra(!excludeExtra)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid',
            ...(excludeExtra ? { background: 'var(--color-expense-bg)', borderColor: 'var(--color-expense-border)', color: 'var(--color-expense-light)', textDecoration: 'line-through' } : { background: 'var(--color-accent-bg)', borderColor: 'rgba(139,92,246,0.3)', color: 'var(--color-accent)' }),
          }}>💰 Extraordinarios</button>
        </div>

        {/* Filters: Drawer on mobile, Pills on desktop */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FilterDrawer title="Categorías" icon="📂" items={categories} selected={filterCats} onToggle={toggleCat} />
            <FilterDrawer title="Conceptos" icon="🏷️" items={availableConcepts} selected={filterCons} onToggle={toggleCon} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => { setFilterCats([]); setFilterCons([]) }} style={pillS(!filterCats.length)}>Todas</button>
              {categories.map(c => (
                <button key={c.id} onClick={() => toggleCat(c.id)} style={pillS(filterCats.includes(c.id))}>{c.icon} {c.name}</button>
              ))}
            </div>
            {availableConcepts.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setFilterCons([])} style={pillS(!filterCons.length)}>Todos conceptos</button>
                {availableConcepts.map(c => (
                  <button key={c.id} onClick={() => toggleCon(c.id)} style={pillS(filterCons.includes(c.id))}>{c.name}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
          {/* Total Gastos */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>Total Gastos</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-expense)' }}>{fmt(kpis.totalExp, currency)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.6 }}>
              {kpis.yaTotalExp > 0 && <div>vs año ant: <span style={{ color: vColor(kpis.totalExp - kpis.yaTotalExp, true), fontWeight: 600 }}>{fPct(vPct(kpis.totalExp, kpis.yaTotalExp))}</span> <span style={{ color: 'var(--text-dim)' }}>({(kpis.totalExp - kpis.yaTotalExp) >= 0 ? '+' : ''}{fmtC(kpis.totalExp - kpis.yaTotalExp, currency)})</span></div>}
              {kpis.prevTotalExp > 0 && <div>vs per. ant: <span style={{ color: vColor(kpis.totalExp - kpis.prevTotalExp, true), fontWeight: 600 }}>{fPct(vPct(kpis.totalExp, kpis.prevTotalExp))}</span> <span style={{ color: 'var(--text-dim)' }}>({(kpis.totalExp - kpis.prevTotalExp) >= 0 ? '+' : ''}{fmtC(kpis.totalExp - kpis.prevTotalExp, currency)})</span></div>}
            </div>
          </div>
          {/* Promedio Mensual */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>Promedio Mensual</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{fmt(kpis.avgM, currency)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.6 }}>
              {kpis.yaAvgM > 0 && <div>vs año ant: <span style={{ color: vColor(kpis.avgM - kpis.yaAvgM, true), fontWeight: 600 }}>{fPct(vPct(kpis.avgM, kpis.yaAvgM))}</span> <span>({(kpis.avgM - kpis.yaAvgM) >= 0 ? '+' : ''}{fmtC(kpis.avgM - kpis.yaAvgM, currency)})</span></div>}
              {kpis.prevAvgM > 0 && <div>vs per. ant: <span style={{ color: vColor(kpis.avgM - kpis.prevAvgM, true), fontWeight: 600 }}>{fPct(vPct(kpis.avgM, kpis.prevAvgM))}</span> <span>({(kpis.avgM - kpis.prevAvgM) >= 0 ? '+' : ''}{fmtC(kpis.avgM - kpis.prevAvgM, currency)})</span></div>}
            </div>
          </div>
          {/* % sobre Ingresos */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>% sobre Ingresos</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: kpis.pctInc > 100 ? 'var(--color-expense)' : 'var(--text-primary)' }}>
              {kpis.pctInc != null ? `${kpis.pctInc.toFixed(1)}%` : '\u2013'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.6 }}>
              {kpis.yaPctInc != null && <div>vs año ant: <span style={{ color: vColor(kpis.pctInc - kpis.yaPctInc, true), fontWeight: 600 }}>{fBps(kpis.pctInc, kpis.yaPctInc)}</span></div>}
              {kpis.prevPctInc != null && <div>vs per. ant: <span style={{ color: vColor(kpis.pctInc - kpis.prevPctInc, true), fontWeight: 600 }}>{fBps(kpis.pctInc, kpis.prevPctInc)}</span></div>}
            </div>
          </div>
        </div>

        {/* Stacked bar chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>Evolución mensual de gastos</div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={barData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtC(v, currency)} width={60} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={45} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.keys(catColors).map((cid, i, arr) => (
                  <Bar key={cid} yAxisId="left" dataKey={catMap[cid]?.name || cid} stackId="exp" fill={catColors[cid]}>
                    {i === arr.length - 1 && <LabelList dataKey="_total" content={TotalLabel} position="top" />}
                  </Bar>
                ))}
                <Line yAxisId="right" type="monotone" dataKey="% Ingresos" stroke="rgba(239,68,68,0.5)" strokeWidth={2} dot={{ fill: 'rgba(239,68,68,0.7)', r: 3 }} label={{ position: 'top', fill: 'rgba(239,68,68,0.7)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", formatter: v => `${v}%` }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie + Table */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, 1fr) minmax(350px, 2fr)', gap: 16 }}>
          {/* Pie */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Distribución</div>
              <div style={{ display: 'flex', gap: 3, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                {[{k:'category',l:'Cat'},{k:'subcategory',l:'Sub'},{k:'concept',l:'Con'}].map(o => (
                  <button key={o.k} onClick={() => setPieGroup(o.k)} style={{ padding: '3px 8px', borderRadius: 4, border: 'none', background: pieGroup === o.k ? 'var(--color-accent)' : 'transparent', color: pieGroup === o.k ? '#fff' : 'var(--text-dim)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{o.l}</button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}
                    label={({ name, percent }) => percent > 0.04 ? `${(percent*100).toFixed(0)}%` : ''} labelLine={false} style={{ fontSize: 10 }}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => fmt(value, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend with values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
              {pieData.slice(0, 12).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', fontWeight: 500 }}>{fmtC(d.value, currency)}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', fontSize: 11, width: 36, textAlign: 'right' }}>
                    {pieTotal > 0 ? `${(d.value / pieTotal * 100).toFixed(0)}%` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Detalle</div>
              <div style={{ display: 'flex', gap: 3, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                {[{k:'concept',l:'Concepto'},{k:'description',l:'Descripción'}].map(o => (
                  <button key={o.k} onClick={() => setTableGroup(o.k)} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: tableGroup === o.k ? 'var(--color-accent)' : 'transparent', color: tableGroup === o.k ? '#fff' : 'var(--text-dim)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{o.l}</button>
                ))}
              </div>
            </div>
            <div style={{ overflow: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
                    <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'left' }}>{tableGroup === 'concept' ? 'Sub / Concepto' : 'Con / Descripción'}</th>
                    <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>% Ing.</th>
                    <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Prom/m</th>
                    <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>vs YA</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '6px 8px' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{r.parent}</div>
                      </td>
                      <td style={{ padding: '6px 8px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', color: 'var(--color-expense-light)' }}>{fmt(r.total, currency)}</td>
                      <td style={{ padding: '6px 8px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', color: 'var(--text-muted)' }}>{r.pctIncome}%</td>
                      <td style={{ padding: '6px 8px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', color: 'var(--text-muted)' }}>{fmtC(r.avg, currency)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: vColor(r.diffAbs, true), fontWeight: 500 }}>
                          {r.diffPct != null ? fPct(r.diffPct) : '\u2013'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                          {r.diffAbs !== 0 ? `${r.diffAbs >= 0 ? '+' : ''}${fmtC(r.diffAbs, currency)}` : ''}
                          {r.bpsDiff !== 0 ? ` \u00b7 ${r.bpsDiff >= 0 ? '+' : ''}${r.bpsDiff}bps` : ''}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
