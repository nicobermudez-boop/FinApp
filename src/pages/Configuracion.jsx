import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { RefreshCw, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function Configuracion() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [result, setResult] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [latestRate, setLatestRate] = useState(null)
  const [latestRateDate, setLatestRateDate] = useState(null)
  const [ratesCount, setRatesCount] = useState(0)

  async function loadStats() {
    setLoading(true)

    // Count pending transactions (no exchange rate, date <= today)
    const today = new Date().toISOString().slice(0, 10)
    const { count: pending } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .lte('date', today)
      .is('exchange_rate', null)

    setPendingCount(pending || 0)

    // Get latest rate
    const { data: rateData } = await supabase
      .from('exchange_rates')
      .select('rate, date')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (rateData) {
      setLatestRate(rateData.rate)
      setLatestRateDate(rateData.date)
    }

    // Count total rates
    const { count: rc } = await supabase
      .from('exchange_rates')
      .select('*', { count: 'exact', head: true })

    setRatesCount(rc || 0)

    setLoading(false)
  }

  useEffect(() => { loadStats() }, [])

  async function runUpdate() {
    setUpdating(true)
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        'https://uujhejfkbdjgerbbqwtv.supabase.co/functions/v1/update-rates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      const data = await res.json()
      if (data.success) {
        setResult({ type: 'success', data })
        // Reload stats
        await loadStats()
      } else {
        setResult({ type: 'error', msg: data.error || 'Error desconocido' })
      }
    } catch (e) {
      setResult({ type: 'error', msg: e.message })
    }

    setUpdating(false)
  }

  function fmtDate(d) {
    if (!d) return '–'
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 20,
  }

  const statStyle = {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '-0.02em',
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    marginBottom: 6,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text-muted)' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Cargando...</span>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Configuración</h1>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {/* Exchange Rates Section */}
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Cotizaciones MEP
        </h2>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={cardStyle}>
            <div style={labelStyle}>Última cotización</div>
            <div style={{ ...statStyle, color: 'var(--color-income)' }}>
              {latestRate ? `$${latestRate.toLocaleString('es-AR')}` : '–'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              {latestRateDate ? fmtDate(latestRateDate) : 'Sin datos'}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={labelStyle}>Registros pendientes</div>
            <div style={{ ...statStyle, color: pendingCount > 0 ? 'var(--color-expense)' : 'var(--text-dim)' }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              {pendingCount > 0 ? 'Sin cotización asignada' : 'Todo actualizado'}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={labelStyle}>Cotizaciones guardadas</div>
            <div style={{ ...statStyle, color: 'var(--color-savings)' }}>
              {ratesCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              Días con cotización en DB
            </div>
          </div>
        </div>

        {/* Update button */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Actualizar cotizaciones</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Consulta la API del dólar MEP, guarda la cotización de hoy y actualiza todos los registros que no tienen cotización asignada (cuotas y recurrencias que ya vencieron).
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={runUpdate}
              disabled={updating}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--color-accent)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.6 : 1,
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {updating ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshCw size={16} />
              )}
              {updating ? 'Actualizando...' : 'Actualizar ahora'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
              <Clock size={13} />
              <span>Automático: todos los días a las 20:00 ARG</span>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              ...(result.type === 'success'
                ? { background: 'var(--color-income-bg)', border: '1px solid var(--color-income-border)' }
                : { background: 'var(--color-expense-bg)', border: '1px solid var(--color-expense-border)' }
              ),
            }}>
              {result.type === 'success' ? (
                <CheckCircle size={16} style={{ color: 'var(--color-income)', flexShrink: 0, marginTop: 2 }} />
              ) : (
                <AlertCircle size={16} style={{ color: 'var(--color-expense)', flexShrink: 0, marginTop: 2 }} />
              )}
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                {result.type === 'success' ? (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--color-income)' }}>Actualización exitosa</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      Cotización hoy: <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>${result.data.today_rate?.toLocaleString('es-AR')}</strong>
                      {' · '}Registros actualizados: <strong>{result.data.transactions_updated}</strong> de {result.data.pending_found} pendientes
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--color-expense)' }}>Error</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{result.msg}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cron info */}
        <div style={{ ...cardStyle, opacity: 0.7 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            🕐 Cron Job Automático
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Configurado un proceso automático diario a las 20:00 hs (Argentina) que consulta la cotización MEP y actualiza los registros pendientes. Si necesitás actualizar antes, usá el botón de arriba.
          </div>
        </div>
      </div>
    </div>
  )
}
