import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard,
  TrendingUp,
  PlusCircle,
  Table2,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  PieChart,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'

const navItems = [
  { path: '/detallado', label: 'Detallado', icon: Table2, description: 'Gastos por concepto' },
  { path: '/evolucion', label: 'Evolución', icon: TrendingUp, description: 'Ingresos vs Gastos' },
  { path: '/cargar', label: 'Cargar', icon: PlusCircle, description: 'Nuevo registro' },
  // Future items:
  // { path: '/zoom-gastos', label: 'Zoom Gastos', icon: PieChart, description: 'Drill-down' },
  // { path: '/resumen', label: 'Resumen', icon: LayoutDashboard, description: 'Dashboard general' },
  // { path: '/ajustes', label: 'Ajustes', icon: Settings, description: 'Categorías y config' },
]

const themeConfig = {
  auto: { icon: Monitor, label: 'Auto', next: 'light' },
  light: { icon: Sun, label: 'Claro', next: 'dark' },
  dark: { icon: Moon, label: 'Oscuro', next: 'auto' },
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 40,
    backdropFilter: 'blur(4px)',
  },
  sidebar: (collapsed, mobileOpen) => ({
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 50,
    overflow: 'hidden',
  }),
  logo: {
    padding: '20px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid var(--border-subtle)',
    minHeight: 64,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, var(--color-accent), #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  },
  navItem: (active, collapsed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: collapsed ? '11px 0' : '11px 14px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    background: active ? 'var(--bg-active)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    transition: 'all 0.15s ease',
    border: 'none',
    width: '100%',
    fontSize: 14,
    fontFamily: 'inherit',
    fontWeight: active ? 500 : 400,
    textDecoration: 'none',
    position: 'relative',
  }),
  navIcon: {
    width: 20,
    height: 20,
    flexShrink: 0,
  },
  footer: {
    padding: '12px 10px',
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  footerBtn: (collapsed) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: 12,
    padding: collapsed ? '11px 0' : '11px 14px',
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  }),
  mobileToggle: {
    position: 'fixed',
    top: 14,
    left: 14,
    zIndex: 60,
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  }
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { mode, cycleTheme } = useTheme()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const isCollapsed = collapsed && !isMobile

  const handleNav = (path) => {
    navigate(path)
    if (isMobile) setMobileOpen(false)
  }

  const ThemeIcon = themeConfig[mode].icon

  const sidebarContent = (
    <div style={{
      ...styles.sidebar(collapsed, mobileOpen),
      ...(isMobile ? {
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        width: 'var(--sidebar-width)',
      } : {})
    }}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>💰</div>
        {(!isCollapsed) && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
              Finanzas
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map(item => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={styles.navItem(active, isCollapsed)}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
              title={isCollapsed ? item.label : ''}
            >
              <Icon style={styles.navIcon} />
              {!isCollapsed && <span>{item.label}</span>}
              {active && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  borderRadius: '0 3px 3px 0',
                  background: 'var(--color-accent)',
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          style={styles.footerBtn(isCollapsed)}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
          title={isCollapsed ? `Tema: ${themeConfig[mode].label}` : ''}
        >
          <ThemeIcon size={18} />
          {!isCollapsed && <span>{themeConfig[mode].label}</span>}
        </button>

        {/* Sign out */}
        <button
          onClick={signOut}
          style={styles.footerBtn(isCollapsed)}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--color-expense-light)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={styles.footerBtn(collapsed)}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <ChevronLeft
              size={18}
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.25s ease'
              }}
            />
            {!collapsed && <span>Colapsar</span>}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          style={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div style={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {sidebarContent}
    </>
  )
}

export function useSidebarWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 260
  )
  return width
}
