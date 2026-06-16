'use client'
import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('danik-theme', next ? 'dark' : 'light') } catch {}
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Modo claro' : 'Modo escuro'}
      className="flex items-center gap-2 px-2.5 py-1.5 w-full rounded-lg text-[12px]
                 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
      {dark ? 'Modo claro' : 'Modo escuro'}
    </button>
  )
}
