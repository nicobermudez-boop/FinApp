import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { RefreshCw, Loader2, CheckCircle, AlertCircle, Clock, Plus, Pencil, ArrowRightLeft, Trash2, ChevronRight } from 'lucide-react'

const TABS = [
  { key: 'rates', label: '💱 Cotizaciones' },
  { key: 'categories', label: '📂 Categorías' },
  { key: 'persons', label: '👤 Personas' },
  { key: 'account', label: '🔒 Cuenta' },
]

// ─── Reusable CRUD List ─────────────────────────────────────────
function CrudList({ items, onAdd, onRename, onMove, onDelete, entityName, onNavigate, moveTargets, moveLabel }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [moveId, setMoveId] = useState(null)
  const [moveTo, setMoveTo] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [reassignTo, setReassignTo] = useState('')

  const handleAdd = () => { if (!newName.trim()) return; onAdd(newName.trim()); setNewName(''); setAdding(false) }
  const handleRename = () => { if (!editName.trim() || !editId) return; onRename(editId, editName.trim()); setEditId(null) }
  const handleMove = () => { if (!moveId || !moveTo) return; onMove(moveId, moveTo); setMoveId(null); setMoveTo('') }
  const handleDelete = (item) => {
    if (item.txCount > 0) { setDeleteConfirm(item); setReassignTo('') }
    else { setDeleteConfirm(item); setReassignTo('__none__') }
  }
  const confirmDelete = () => {
    if (!deleteConfirm) return
    onDelete(deleteConfirm.id, reassignTo === '__none__' ? null : reassignTo)
    setDeleteConfirm(null); setReassignTo('')
  }

  const inputS = { padding: '7px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', flex: 1, minWidth: 0 }
  const btnSm = (color = 'var(--text-dim)') => ({ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color, display: 'flex', alignItems: 'center' })

  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 'var(--radius-sm)', borderBottom: '1px solid var(--border-subtle)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {editId === item.id ? (
            <>
              <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditId(null) }} style={inputS} autoFocus />
              <button onClick={handleRename} style={{ ...btnSm('var(--color-income)'), fontSize: 13, fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditId(null)} style={{ ...btnSm(), fontSize: 13 }}>✕</button>
            </>
          ) : moveId === item.id ? (
            <>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>Mover <strong>{item.name}</strong> a:</div>
              <select value={moveTo} onChange={e => setMoveTo(e.target.value)} style={{ ...inputS, flex: 'none', minWidth: 150 }}>
                <option value="">{moveLabel || 'Seleccionar...'}</option>
                {(moveTargets || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={handleMove} disabled={!moveTo} style={{ ...btnSm(moveTo ? 'var(--color-income)' : 'var(--text-dim)'), fontSize: 13, fontWeight: 700 }}>✓</button>
              <button onClick={() => { setMoveId(null); setMoveTo('') }} style={{ ...btnSm(), fontSize: 13 }}>✕</button>
            </>
          ) : (
            <>
              <div style={{ flex: 1, minWidth: 0, cursor: onNavigate ? 'pointer' : 'default' }} onClick={() => onNavigate && onNavigate(item.id)}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.icon ? `${item.icon} ` : ''}{item.name}</div>
                {item.parentName && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.parentName}</div>}
              </div>
              {item.txCount > 0 && <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{item.txCount} tx</span>}
              <button onClick={() => { setEditId(item.id); setEditName(item.name) }} style={btnSm()} title="Renombrar"><Pencil size={13} /></button>
              {onMove && <button onClick={() => setMoveId(item.id)} style={btnSm()} title="Mover"><ArrowRightLeft size={13} /></button>}
              <button onClick={() => handleDelete(item)} style={btnSm('var(--color-expense-light)')} title="Eliminar"><Trash2 size={13} /></button>
              {onNavigate && <ChevronRight size={14} style={{ color: 'var(--text-dim)', cursor: 'pointer' }} onClick={() => onNavigate(item.id)} />}
            </>
          )}
        </div>
      ))}

      {/* Add new */}
      {adding ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, padding: '4px 8px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }} placeholder={`Nuevo ${entityName}...`} style={inputS} autoFocus />
          <button onClick={handleAdd} style={{ ...btnSm('var(--color-income)'), fontSize: 13, fontWeight: 700 }}>✓</button>
          <button onClick={() => { setAdding(false); setNewName('') }} style={{ ...btnSm(), fontSize: 13 }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 10px', background: 'none', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
          <Plus size={13} /> Agregar {entityName}
        </button>
      )}

      {/* Delete/Reassign modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 24, maxWidth: 420, width: '100%', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              {deleteConfirm.txCount > 0 ? 'Reasignar y eliminar' : 'Confirmar eliminación'}
            </div>
            {deleteConfirm.txCount > 0 ? (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                  <strong>"{deleteConfirm.name}"</strong> tiene <strong>{deleteConfirm.txCount}</strong> transacciones. Elegí a dónde reasignarlas:
                </div>
                <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} style={{ ...inputS, width: '100%', marginBottom: 16, flex: 'none' }}>
                  <option value="">Seleccionar destino...</option>
                  {items.filter(i => i.id !== deleteConfirm.id).map(i => <option key={i.id} value={i.id}>{i.icon ? `${i.icon} ` : ''}{i.name}</option>)}
                </select>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                ¿Estás seguro de eliminar <strong>"{deleteConfirm.name}"</strong>? Esta acción no se puede deshacer.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setDeleteConfirm(null); setReassignTo('') }} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={confirmDelete} disabled={deleteConfirm.txCount > 0 && !reassignTo} style={{
                padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                background: (deleteConfirm.txCount === 0 || reassignTo) ? 'var(--color-expense)' : 'var(--bg-tertiary)',
                color: (deleteConfirm.txCount === 0 || reassignTo) ? '#fff' : 'var(--text-dim)',
                cursor: (deleteConfirm.txCount === 0 || reassignTo) ? 'pointer' : 'not-allowed',
              }}>{deleteConfirm.txCount > 0 ? 'Reasignar y eliminar' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Categories Tab ─────────────────────────────────────────
function CategoriesTab({ user }) {
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [concepts, setConcepts] = useState([])
  const [txCounts, setTxCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState(null)
  const [selectedSub, setSelectedSub] = useState(null)
  const [catType, setCatType] = useState('expense')

  const loadAll = async () => {
    setLoading(true)
    const [catR, subR, conR] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('subcategories').select('*').order('name'),
      supabase.from('concepts').select('*').order('name'),
    ])
    setCategories(catR.data || [])
    setSubcategories(subR.data || [])
    setConcepts(conR.data || [])
    const { data: txData } = await supabase.from('transactions').select('category_id, subcategory_id, concept_id')
    const counts = {}
    ;(txData || []).forEach(t => {
      if (t.category_id) counts[`cat_${t.category_id}`] = (counts[`cat_${t.category_id}`] || 0) + 1
      if (t.subcategory_id) counts[`sub_${t.subcategory_id}`] = (counts[`sub_${t.subcategory_id}`] || 0) + 1
      if (t.concept_id) counts[`con_${t.concept_id}`] = (counts[`con_${t.concept_id}`] || 0) + 1
    })
    setTxCounts(counts)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const filteredCats = categories.filter(c => c.type === catType)
  const filteredSubs = selectedCat ? subcategories.filter(s => s.category_id === selectedCat) : []
  const filteredCons = selectedSub ? concepts.filter(c => c.subcategory_id === selectedSub) : []

  // Category CRUD
  const addCat = async (name) => { await supabase.from('categories').insert({ name, type: catType, user_id: user.id }); loadAll() }
  const renameCat = async (id, name) => { await supabase.from('categories').update({ name }).eq('id', id); loadAll() }
  const deleteCat = async (id, reassignId) => {
    if (reassignId) {
      await supabase.from('transactions').update({ category_id: reassignId }).eq('category_id', id)
      await supabase.from('subcategories').update({ category_id: reassignId }).eq('category_id', id)
    } else {
      const subIds = subcategories.filter(s => s.category_id === id).map(s => s.id)
      if (subIds.length) { await supabase.from('concepts').delete().in('subcategory_id', subIds); await supabase.from('subcategories').delete().eq('category_id', id) }
    }
    await supabase.from('categories').delete().eq('id', id)
    setSelectedCat(null); setSelectedSub(null); loadAll()
  }

  // Subcategory CRUD
  const addSub = async (name) => { await supabase.from('subcategories').insert({ name, category_id: selectedCat, user_id: user.id }); loadAll() }
  const renameSub = async (id, name) => { await supabase.from('subcategories').update({ name }).eq('id', id); loadAll() }
  const moveSub = async (id, newCatId) => { await supabase.from('subcategories').update({ category_id: newCatId }).eq('id', id); loadAll() }
  const deleteSub = async (id, reassignId) => {
    if (reassignId) {
      await supabase.from('transactions').update({ subcategory_id: reassignId }).eq('subcategory_id', id)
      await supabase.from('concepts').update({ subcategory_id: reassignId }).eq('subcategory_id', id)
    } else {
      await supabase.from('concepts').delete().eq('subcategory_id', id)
    }
    await supabase.from('subcategories').delete().eq('id', id)
    setSelectedSub(null); loadAll()
  }

  // Concept CRUD
  const addCon = async (name) => { await supabase.from('concepts').insert({ name, subcategory_id: selectedSub, user_id: user.id }); loadAll() }
  const renameCon = async (id, name) => { await supabase.from('concepts').update({ name }).eq('id', id); loadAll() }
  const moveCon = async (id, newSubId) => { await supabase.from('concepts').update({ subcategory_id: newSubId }).eq('id', id); loadAll() }
  const deleteCon = async (id, reassignId) => {
    if (reassignId) await supabase.from('transactions').update({ concept_id: reassignId }).eq('concept_id', id)
    await supabase.from('concepts').delete().eq('id', id); loadAll()
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Cargando...</div>

  const catItems = filteredCats.map(c => ({ ...c, txCount: txCounts[`cat_${c.id}`] || 0 }))
  const subItems = filteredSubs.map(s => ({ ...s, txCount: txCounts[`sub_${s.id}`] || 0, parentName: categories.find(c => c.id === s.category_id)?.name }))
  const conItems = filteredCons.map(c => ({ ...c, txCount: txCounts[`con_${c.id}`] || 0, parentName: subcategories.find(s => s.id === c.subcategory_id)?.name }))

  const selectedCatName = categories.find(c => c.id === selectedCat)?.name
  const selectedSubName = subcategories.find(s => s.id === selectedSub)?.name
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16 }

  // Move targets
  const catMoveTargets = categories.filter(c => c.type === catType && c.id !== selectedCat).map(c => ({ id: c.id, name: `${c.icon || ''} ${c.name}`.trim() }))
  const subMoveTargets = subcategories.filter(s => s.id !== selectedSub).map(s => ({ id: s.id, name: `${s.name} (${categories.find(c => c.id === s.category_id)?.name || ''})` }))

  return (
    <div>
      <div style={{ display: 'flex', gap: 3, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)', marginBottom: 16, width: 'fit-content' }}>
        {[{ k: 'expense', l: 'Gastos' }, { k: 'income', l: 'Ingresos' }].map(t => (
          <button key={t.k} onClick={() => { setCatType(t.k); setSelectedCat(null); setSelectedSub(null) }} style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: catType === t.k ? 'var(--color-accent)' : 'transparent', color: catType === t.k ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: catType === t.k ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>{t.l}</button>
        ))}
      </div>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span onClick={() => { setSelectedCat(null); setSelectedSub(null) }} style={{ cursor: 'pointer', color: !selectedCat ? 'var(--text-primary)' : 'var(--color-accent)', fontWeight: !selectedCat ? 600 : 400 }}>Categorías</span>
        {selectedCat && <><ChevronRight size={12} /><span onClick={() => setSelectedSub(null)} style={{ cursor: 'pointer', color: !selectedSub ? 'var(--text-primary)' : 'var(--color-accent)', fontWeight: !selectedSub ? 600 : 400 }}>{selectedCatName}</span></>}
        {selectedSub && <><ChevronRight size={12} /><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedSubName}</span></>}
      </div>

      <div style={cardStyle}>
        {!selectedCat ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Categorías de {catType === 'expense' ? 'Gastos' : 'Ingresos'}</div>
            <CrudList items={catItems} onAdd={addCat} onRename={renameCat} onDelete={deleteCat} entityName="categoría" onNavigate={id => setSelectedCat(id)} />
          </>
        ) : !selectedSub ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Subcategorías de {selectedCatName}</div>
            <CrudList items={subItems} onAdd={addSub} onRename={renameSub} onMove={moveSub} onDelete={deleteSub} entityName="subcategoría" onNavigate={id => setSelectedSub(id)} moveTargets={catMoveTargets} moveLabel="Mover a categoría..." />
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Conceptos de {selectedSubName}</div>
            <CrudList items={conItems} onAdd={addCon} onRename={renameCon} onMove={moveCon} onDelete={deleteCon} entityName="concepto" moveTargets={subMoveTargets} moveLabel="Mover a subcategoría..." />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Persons Tab ─────────────────────────────────────────
function PersonsTab({ user }) {
  const [persons, setPersons] = useState([])
  const [txCounts, setTxCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    const { data } = await supabase.from('persons').select('*').order('name')
    setPersons(data || [])
    const { data: txData } = await supabase.from('transactions').select('person_id')
    const counts = {}
    ;(txData || []).forEach(t => { if (t.person_id) counts[t.person_id] = (counts[t.person_id] || 0) + 1 })
    setTxCounts(counts)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const add = async (name) => { await supabase.from('persons').insert({ name, user_id: user.id }); loadAll() }
  const rename = async (id, name) => {
    await supabase.from('persons').update({ name }).eq('id', id)
    // Also update the text field in transactions for backward compat
    const person = persons.find(p => p.id === id)
    if (person) await supabase.from('transactions').update({ person: name }).eq('person', person.name)
    loadAll()
  }
  const del = async (id, reassignId) => {
    if (reassignId) {
      const target = persons.find(p => p.id === reassignId)
      await supabase.from('transactions').update({ person_id: reassignId, person: target?.name }).eq('person_id', id)
    }
    await supabase.from('persons').delete().eq('id', id); loadAll()
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Cargando...</div>

  const items = persons.map(p => ({ ...p, txCount: txCounts[p.id] || 0 }))

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Personas</div>
      <CrudList items={items} onAdd={add} onRename={rename} onDelete={del} entityName="persona" />
    </div>
  )
}

// ─── Rates Tab ─────────────────────────────────────────
function RatesTab() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [result, setResult] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [latestRate, setLatestRate] = useState(null)
  const [latestRateDate, setLatestRateDate] = useState(null)
  const [ratesCount, setRatesCount] = useState(0)

  async function loadStats() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const { count: pending } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).lte('date', today).is('exchange_rate', null)
    setPendingCount(pending || 0)
    const { data: rateData } = await supabase.from('exchange_rates').select('rate, date').order('date', { ascending: false }).limit(1).single()
    if (rateData) { setLatestRate(rateData.rate); setLatestRateDate(rateData.date) }
    const { count: rc } = await supabase.from('exchange_rates').select('*', { count: 'exact', head: true })
    setRatesCount(rc || 0)
    setLoading(false)
  }

  useEffect(() => { loadStats() }, [])

  async function runUpdate() {
    setUpdating(true); setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('https://uujhejfkbdjgerbbqwtv.supabase.co/functions/v1/update-rates', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.success) { setResult({ type: 'success', data }); await loadStats() }
      else setResult({ type: 'error', msg: data.error || 'Error desconocido' })
    } catch (e) { setResult({ type: 'error', msg: e.message }) }
    setUpdating(false)
  }

  const fmtDate = (d) => { if (!d) return '–'; const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` }
  const cardS = { background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 20 }
  const statS = { fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }
  const labelS = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }

  if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={cardS}><div style={labelS}>Última cotización</div><div style={{ ...statS, color: 'var(--color-income)' }}>{latestRate ? `$${latestRate.toLocaleString('es-AR')}` : '–'}</div><div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{latestRateDate ? fmtDate(latestRateDate) : 'Sin datos'}</div></div>
        <div style={cardS}><div style={labelS}>Registros pendientes</div><div style={{ ...statS, color: pendingCount > 0 ? 'var(--color-expense)' : 'var(--text-dim)' }}>{pendingCount}</div><div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{pendingCount > 0 ? 'Sin cotización asignada' : 'Todo actualizado'}</div></div>
        <div style={cardS}><div style={labelS}>Cotizaciones guardadas</div><div style={{ ...statS, color: 'var(--color-savings)' }}>{ratesCount}</div><div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Días con cotización en DB</div></div>
      </div>
      <div style={{ ...cardS, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div><div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Actualizar cotizaciones</div><div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Consulta la API del dólar MEP, guarda la cotización de hoy y actualiza registros pendientes.</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={runUpdate} disabled={updating} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.6 : 1, fontFamily: 'inherit' }}>
            {updating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}{updating ? 'Actualizando...' : 'Actualizar ahora'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}><Clock size={13} /><span>Automático: todos los días a las 20:00 ARG</span></div>
        </div>
        {result && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 10, ...(result.type === 'success' ? { background: 'var(--color-income-bg)', border: '1px solid var(--color-income-border)' } : { background: 'var(--color-expense-bg)', border: '1px solid var(--color-expense-border)' }) }}>
            {result.type === 'success' ? <CheckCircle size={16} style={{ color: 'var(--color-income)', flexShrink: 0, marginTop: 2 }} /> : <AlertCircle size={16} style={{ color: 'var(--color-expense)', flexShrink: 0, marginTop: 2 }} />}
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {result.type === 'success' ? (<><div style={{ fontWeight: 600, color: 'var(--color-income)' }}>Actualización exitosa</div><div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>Cotización: <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>${result.data.today_rate?.toLocaleString('es-AR')}</strong> · Actualizados: <strong>{result.data.transactions_updated}</strong>/{result.data.pending_found}</div></>) : (<><div style={{ fontWeight: 600, color: 'var(--color-expense)' }}>Error</div><div style={{ color: 'var(--text-secondary)' }}>{result.msg}</div></>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Account Tab ─────────────────────────────────────────
function AccountTab({ user }) {
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = async () => {
    setResult(null)
    if (newPass.length < 6) { setResult({ type: 'error', msg: 'La contraseña debe tener al menos 6 caracteres' }); return }
    if (newPass !== confirmPass) { setResult({ type: 'error', msg: 'Las contraseñas no coinciden' }); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) setResult({ type: 'error', msg: error.message })
    else { setResult({ type: 'success', msg: 'Contraseña actualizada correctamente' }); setNewPass(''); setConfirmPass('') }
    setLoading(false)
  }

  const inputS = { width: '100%', maxWidth: 320, padding: '9px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 20 }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Conectado como <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong></div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Cambiar contraseña</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <input type="password" placeholder="Nueva contraseña" value={newPass} onChange={e => setNewPass(e.target.value)} style={inputS} />
        <input type="password" placeholder="Confirmar contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={inputS} />
      </div>
      <button onClick={handleChange} disabled={loading || !newPass || !confirmPass} style={{ padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || !newPass || !confirmPass) ? 0.5 : 1, fontFamily: 'inherit' }}>
        {loading ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
      {result && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, ...(result.type === 'success' ? { background: 'var(--color-income-bg)', border: '1px solid var(--color-income-border)', color: 'var(--color-income)' } : { background: 'var(--color-expense-bg)', border: '1px solid var(--color-expense-border)', color: 'var(--color-expense-light)' }) }}>
          {result.msg}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────
export default function Configuracion() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('rates')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Configuración</h1>
        <div style={{ display: 'flex', gap: 0, overflow: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '10px 18px', border: 'none', borderBottom: `2px solid ${activeTab === t.key ? 'var(--color-accent)' : 'transparent'}`,
              background: 'transparent', color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeTab === 'rates' && <RatesTab />}
        {activeTab === 'categories' && <CategoriesTab user={user} />}
        {activeTab === 'persons' && <PersonsTab user={user} />}
        {activeTab === 'account' && <AccountTab user={user} />}
      </div>
    </div>
  )
}
