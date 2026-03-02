export default function Evolucion() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      flexDirection: 'column',
      gap: 12,
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48, opacity: 0.3 }}>📈</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}>
        Evolución
      </div>
      <div style={{ fontSize: 14 }}>Próximamente — gráficos mensuales y acumulados</div>
    </div>
  )
}
