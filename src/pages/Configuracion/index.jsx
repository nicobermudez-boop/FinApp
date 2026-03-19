import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import RatesTab from './RatesTab'
import CategoriesTab from './CategoriesTab'
import PersonsTab from './PersonsTab'
import ImportTab from './ImportTab'
import AccountTab from './AccountTab'

const TABS = [
  { key: 'rates', label: '💱 Cotizaciones' },
  { key: 'categories', label: '📂 Categorías' },
  { key: 'persons', label: '👤 Personas' },
  { key: 'import', label: '📥 Importar' },
  { key: 'account', label: '🔒 Cuenta' },
]

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
        {activeTab === 'import' && <ImportTab user={user} />}
        {activeTab === 'account' && <AccountTab user={user} />}
      </div>
    </div>
  )
}
