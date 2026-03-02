import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Loader2, Check, AlertCircle } from 'lucide-react'

export default function Cargar() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [type, setType] = useState('expense')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ARS')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [conceptId, setConceptId] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Contado')
  const [installments, setInstallments] = useState(1)
  const [person, setPerson] = useState('Nico')
  const [destination, setDestination] = useState('')
  const [incomeConcept, setIncomeConcept] = useState('Sueldo')
  const [incomeSubtype, setIncomeSubtype] = useState('recurrente')

  // Reference data
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [concepts, setConcepts] = useState([])
  const [members, setMembers] = useState([])
  const [exchangeRate, setExchangeRate] = useState(null)

  // Fetch reference data
  useEffect(() => {
    async function fetchRefData() {
      const [catRes, subRes, conRes, memRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('subcategories').select('*').order('sort_order'),
        supabase.from('concepts').select('*').order('sort_order'),
        supabase.from('household_members').select('*'),
      ])
      setCategories(catRes.data || [])
      setSubcategories(subRes.data || [])
      setConcepts(conRes.data || [])
      setMembers(memRes.data || [])
      setLoading(false)
    }
    fetchRefData()
  }, [])

  // Fetch exchange rate
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares/bolsa')
        const data = await res.json()
        if (data?.promedio) {
          setExchangeRate(data.promedio)
        } else if (data?.compra && data?.venta) {
          setExchangeRate((data.compra + data.venta) / 2)
        }
      } catch (e) {
        console.error('Error fetching exchange rate:', e)
      }
    }
    fetchRate()
  }, [])

  // Filtered dropdowns
  const filteredCats = categories.filter(c => c.type === type)
  const filteredSubs = subcategories.filter(s => s.category_id === categoryId)
  const filteredConcepts = concepts.filter(c => c.subcategory_id === subcategoryId)

  const selectedCat = categories.find(c => c.id === categoryId)
  const isTravel = selectedCat?.name === 'Viajes'

  // Auto-set income subtype defaults
  useEffect(() => {
    if (type === 'income') {
      if (incomeConcept === 'Sueldo' || incomeConcept === 'Rentas') {
        setIncomeSubtype('recurrente')
      } else {
        setIncomeSubtype('extraordinario')
      }
    }
  }, [incomeConcept, type])

  // Reset dependent fields
  useEffect(() => {
    setSubcategoryId('')
    setConceptId('')
  }, [categoryId])

  useEffect(() => {
    setConceptId('')
  }, [subcategoryId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) throw new Error('Monto inválido')

      const rate = exchangeRate || null
      let amountUsd = null

      if (currency === 'USD') {
        amountUsd = numAmount
      } else if (rate) {
        amountUsd = numAmount / rate
      }

      // Base transaction
      const baseTx = {
        user_id: user.id,
        type,
        date,
        amount: numAmount,
        currency,
        description: description || null,
        person,
        exchange_rate: rate,
        amount_usd: amountUsd ? parseFloat(amountUsd.toFixed(2)) : null,
      }

      if (type === 'expense') {
        baseTx.category_id = categoryId || null
        baseTx.subcategory_id = subcategoryId || null
        baseTx.concept_id = conceptId || null
        baseTx.payment_method = paymentMethod
        baseTx.destination = isTravel ? destination || null : null

        if (paymentMethod === 'Crédito' && installments > 1) {
          // Create installment group
          const groupId = crypto.randomUUID()
          const installmentAmount = numAmount / installments
          const installmentUsd = amountUsd ? amountUsd / installments : null

          const records = []
          for (let i = 0; i < installments; i++) {
            const instDate = new Date(date)
            instDate.setMonth(instDate.getMonth() + i)
            const isFuture = instDate > new Date()

            records.push({
              ...baseTx,
              date: instDate.toISOString().split('T')[0],
              amount: parseFloat(installmentAmount.toFixed(2)),
              amount_usd: isFuture ? null : (installmentUsd ? parseFloat(installmentUsd.toFixed(2)) : null),
              exchange_rate: isFuture ? null : rate,
              installments,
              installment_number: i + 1,
              installment_group_id: groupId,
            })
          }

          const { error: insertErr } = await supabase.from('transactions').insert(records)
          if (insertErr) throw insertErr
        } else {
          baseTx.installments = 1
          baseTx.installment_number = 1
          const { error: insertErr } = await supabase.from('transactions').insert([baseTx])
          if (insertErr) throw insertErr
        }
      } else {
        // Income
        // Find income category/subcategory/concept
        const incCat = categories.find(c => c.type === 'income')
        const incSub = incCat ? subcategories.find(s => s.category_id === incCat.id) : null
        const incCon = incSub ? concepts.find(c => c.subcategory_id === incSub.id && c.name === incomeConcept) : null

        baseTx.category_id = incCat?.id || null
        baseTx.subcategory_id = incSub?.id || null
        baseTx.concept_id = incCon?.id || null
        baseTx.income_concept = incomeConcept
        baseTx.income_subtype = incomeSubtype

        const { error: insertErr } = await supabase.from('transactions').insert([baseTx])
        if (insertErr) throw insertErr
      }

      setSuccess(true)
      // Reset form
      setAmount('')
      setDescription('')
      setDestination('')
      setCategoryId('')
      setSubcategoryId('')
      setConceptId('')
      setInstallments(1)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 10, color: 'var(--text-muted)'
      }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Cargando...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const fieldGroup = { marginBottom: 16 }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '20px 24px',
    }}>
      <h1 style={{
        fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20
      }}>
        Cargar Transacción
      </h1>

      <div style={{ maxWidth: 560 }}>
        {/* Type toggle */}
        <div style={{ ...fieldGroup }}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: 3,
            border: '1px solid var(--border-subtle)',
          }}>
            {[
              { val: 'expense', label: 'Gasto', color: 'var(--color-expense)' },
              { val: 'income', label: 'Ingreso', color: 'var(--color-income)' },
            ].map(t => (
              <button
                key={t.val}
                onClick={() => { setType(t.val); setCategoryId(''); setSubcategoryId(''); setConceptId('') }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: type === t.val ? t.color : 'transparent',
                  color: type === t.val ? 'white' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Date + Amount + Currency row */}
          <div style={{ display: 'flex', gap: 12, ...fieldGroup }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Monto</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div style={{ flex: 0.6 }}>
              <label style={labelStyle}>Moneda</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={inputStyle}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {exchangeRate && (
            <div style={{
              fontSize: 12, color: 'var(--text-dim)', marginTop: -10, marginBottom: 14,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              MEP: ${exchangeRate.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </div>
          )}

          {type === 'expense' ? (
            <>
              {/* Category */}
              <div style={fieldGroup}>
                <label style={labelStyle}>Categoría</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle} required>
                  <option value="">Seleccionar...</option>
                  {filteredCats.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {categoryId && (
                <div style={fieldGroup}>
                  <label style={labelStyle}>Subcategoría</label>
                  <select value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} style={inputStyle} required>
                    <option value="">Seleccionar...</option>
                    {filteredSubs.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {subcategoryId && (
                <div style={fieldGroup}>
                  <label style={labelStyle}>Concepto</label>
                  <select value={conceptId} onChange={e => setConceptId(e.target.value)} style={inputStyle} required>
                    <option value="">Seleccionar...</option>
                    {filteredConcepts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment method */}
              <div style={{ display: 'flex', gap: 12, ...fieldGroup }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Medio de Pago</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
                    <option value="Contado">Contado</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>
                {paymentMethod === 'Crédito' && (
                  <div style={{ flex: 0.5 }}>
                    <label style={labelStyle}>Cuotas</label>
                    <input
                      type="number" min="1" max="48"
                      value={installments}
                      onChange={e => setInstallments(parseInt(e.target.value) || 1)}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              {isTravel && (
                <div style={fieldGroup}>
                  <label style={labelStyle}>Destino</label>
                  <input
                    type="text"
                    placeholder="Ej: Mar del Plata"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Income fields */}
              <div style={{ display: 'flex', gap: 12, ...fieldGroup }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Concepto</label>
                  <select value={incomeConcept} onChange={e => setIncomeConcept(e.target.value)} style={inputStyle}>
                    <option value="Sueldo">Sueldo</option>
                    <option value="Bono">Bono</option>
                    <option value="Rentas">Rentas</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tipo</label>
                  <select value={incomeSubtype} onChange={e => setIncomeSubtype(e.target.value)} style={inputStyle}>
                    <option value="recurrente">Recurrente</option>
                    <option value="extraordinario">Extraordinario</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Descripción (opcional)</label>
            <input
              type="text"
              placeholder="Ej: Supermercado DIA"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Person */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Persona</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Nico', 'Belu'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPerson(p)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: person === p ? 'var(--color-accent)' : 'var(--border-default)',
                    background: person === p ? 'var(--color-accent-bg)' : 'transparent',
                    color: person === p ? 'var(--color-accent)' : 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-expense-bg)',
              border: '1px solid var(--color-expense-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-expense-light)',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-income-bg)',
              border: '1px solid var(--color-income-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-income-light)',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Check size={16} />
              Transacción guardada correctamente
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 28px',
              background: type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}
