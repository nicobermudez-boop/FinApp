import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function WizardModal({ wizard, user, onComplete, setWizard }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (wizard.step === 'sub') {
      const { data } = await supabase.from('subcategories').insert({ name: name.trim(), category_id: wizard.catId, user_id: user.id }).select().single()
      if (data) { setName(''); setWizard({ step: 'concept', catId: wizard.catId, subId: data.id, catName: wizard.catName, subName: name.trim() }) }
    } else if (wizard.step === 'concept') {
      await supabase.from('concepts').insert({ name: name.trim(), subcategory_id: wizard.subId, user_id: user.id })
      onComplete()
    }
    setSaving(false)
  }

  const inputS = { width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }
  const stepLabel = wizard.step === 'sub' ? 'Subcategoría' : 'Concepto'
  const breadcrumb = wizard.step === 'sub' ? wizard.catName : `${wizard.catName} › ${wizard.subName}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 28, maxWidth: 420, width: '100%', border: '1px solid var(--border-subtle)' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
          {['Categoría', 'Subcategoría', 'Concepto'].map((s, i) => {
            const stepIdx = wizard.step === 'sub' ? 1 : 2
            return <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= stepIdx ? 'var(--color-accent)' : 'var(--border-subtle)', transition: 'background 0.2s' }} />
          })}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>{breadcrumb}</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Crear {stepLabel}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          {wizard.step === 'sub'
            ? `La categoría "${wizard.catName}" necesita al menos una subcategoría.`
            : `La subcategoría "${wizard.subName}" necesita al menos un concepto.`}
        </div>

        <input value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onComplete() }}
          placeholder={`Nombre del ${stepLabel.toLowerCase()}...`} style={inputS} autoFocus />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onComplete} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Omitir</button>
          <button onClick={handleSubmit} disabled={!name.trim() || saving} style={{
            padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            background: name.trim() ? 'var(--color-accent)' : 'var(--bg-tertiary)', color: name.trim() ? '#fff' : 'var(--text-dim)',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }}>{saving ? '...' : wizard.step === 'concept' ? 'Crear y finalizar' : 'Siguiente →'}</button>
        </div>
      </div>
    </div>
  )
}
