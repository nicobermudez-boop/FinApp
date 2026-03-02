import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => useContext(ThemeContext)

// 3 modes: 'auto' | 'light' | 'dark'
// 'auto' follows OS preference via prefers-color-scheme

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'auto'
    return localStorage.getItem('theme-mode') || 'auto'
  })

  const [resolved, setResolved] = useState('dark')

  // Resolve actual theme from mode + OS preference
  useEffect(() => {
    const resolve = () => {
      if (mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolved(prefersDark ? 'dark' : 'light')
      } else {
        setResolved(mode)
      }
    }

    resolve()

    // Listen for OS theme changes when in auto mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (mode === 'auto') resolve() }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  // Persist preference
  useEffect(() => {
    localStorage.setItem('theme-mode', mode)
  }, [mode])

  // Cycle: auto → light → dark → auto
  const cycleTheme = useCallback(() => {
    setMode(prev => {
      if (prev === 'auto') return 'light'
      if (prev === 'light') return 'dark'
      return 'auto'
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
