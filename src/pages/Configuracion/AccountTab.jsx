import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AccountTab({ user }) {
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
