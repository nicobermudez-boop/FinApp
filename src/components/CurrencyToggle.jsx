export default function CurrencyToggle({ currency, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      padding: 3,
      border: '1px solid var(--border-subtle)',
    }}>
      {['ARS', 'USD'].map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: currency === c ? 'var(--color-accent)' : 'transparent',
            color: currency === c ? 'white' : 'var(--text-muted)',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            letterSpacing: '0.05em',
          }}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
