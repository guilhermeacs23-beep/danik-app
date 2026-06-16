'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Shirt, Briefcase, Users, CreditCard,
  Car, Route, PackagePlus, Settings, LogOut, TrendingUp,
  Trophy, ChevronLeft, ChevronRight, Moon, Sun,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const NAV = [
  { section: 'Principal' },
  { href: '/dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/estoque',         label: 'Estoque',          icon: Shirt },
  { href: '/maletas',         label: 'Maletas',          icon: Briefcase },
  { section: 'Comercial' },
  { href: '/clientes',        label: 'Clientes',         icon: Users },
  { href: '/ranking',         label: 'Ranking & Pontos', icon: Trophy },
  { href: '/crediario',       label: 'Crediário',        icon: CreditCard },
  { section: 'Operação' },
  { href: '/entrada-estoque', label: 'Entrada Estoque',  icon: PackagePlus },
  { href: '/deslocamentos',   label: 'Deslocamentos',    icon: Car },
  { href: '/rastreio',        label: 'Rastreio',         icon: Route },
  { href: '/financeiro',      label: 'Financeiro',       icon: TrendingUp },
  { section: 'Config' },
  { href: '/configuracoes',   label: 'Configurações',    icon: Settings },
]

const SIDEBAR_BG   = '#F0E4E4'
const SIDEBAR_TEXT = '#5C3D3D'
const BRAND        = '#C4956A'

export function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark]           = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    const s = localStorage.getItem('danik-sidebar')
    if (s === 'collapsed') setCollapsed(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('danik-sidebar', next ? 'collapsed' : 'expanded')
  }

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('danik-theme', next ? 'dark' : 'light')
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'h-screen flex flex-col flex-shrink-0 relative transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-14' : 'w-52'
      )}
      style={{ background: SIDEBAR_BG, borderRight: '1px solid #E0CECE' }}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b transition-all duration-300',
        collapsed ? 'justify-center px-0 py-4' : 'px-4 py-4 gap-2'
      )}
        style={{ borderColor: '#E0CECE' }}
      >
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            {!logoError ? (
              <Image
                src="/logo-danik.png"
                alt="DANIK"
                width={120}
                height={40}
                className="object-contain object-left"
                onError={() => setLogoError(true)}
                priority
              />
            ) : (
              /* fallback enquanto logo não é enviada */
              <div>
                <div className="flex items-baseline gap-0">
                  <span className="text-[22px] font-black tracking-[-1px]"
                        style={{ fontFamily: 'Georgia,serif', color: '#8B5E3C' }}>
                    DANI
                  </span>
                  <span className="text-[22px] font-black tracking-[-1px]"
                        style={{ fontFamily: 'Georgia,serif', color: BRAND }}>
                    K
                  </span>
                </div>
                <p className="text-[7px] tracking-[3px] uppercase" style={{ color: '#B07878' }}>
                  Elegance in every detail
                </p>
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <span className="text-[20px] font-black" style={{ fontFamily: 'Georgia,serif', color: BRAND }}>
            K
          </span>
        )}
      </div>

      {/* Toggle expand/collapse */}
      <button
        onClick={toggleSidebar}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className="absolute -right-3 top-[56px] z-10 w-6 h-6 rounded-full flex items-center justify-center
                   border shadow-sm transition-colors hover:opacity-90"
        style={{ background: BRAND, borderColor: '#E0CECE', color: '#fff' }}
      >
        {collapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft  size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5">
        {NAV.map((item, i) => {
          if ('section' in item) {
            if (collapsed) return null
            return (
              <p key={i} className="text-[9px] font-bold uppercase tracking-[2px] px-2 pt-4 pb-1 first:pt-2"
                 style={{ color: '#C4A0A0' }}>
                {item.section}
              </p>
            )
          }
          const Icon = item.icon!
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href!}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg mb-0.5 transition-all text-[12.5px]',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                active
                  ? 'font-semibold shadow-sm'
                  : 'hover:opacity-90'
              )}
              style={active
                ? { background: BRAND, color: '#fff' }
                : { color: SIDEBAR_TEXT }
              }
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(196,149,106,0.12)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}
            >
              <Icon size={15} className="flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-1.5 space-y-0.5" style={{ borderTop: '1px solid #E0CECE' }}>
        <button
          onClick={toggleTheme}
          title={dark ? 'Modo claro' : 'Modo escuro'}
          className={cn(
            'flex items-center gap-2 rounded-lg text-[12px] transition-colors w-full',
            collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-1.5'
          )}
          style={{ color: SIDEBAR_TEXT }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(196,149,106,0.12)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed && (dark ? 'Modo claro' : 'Modo escuro')}
        </button>

        <button
          onClick={handleLogout}
          title="Sair"
          className={cn(
            'flex items-center gap-2 rounded-lg text-[12px] transition-colors w-full',
            collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-1.5'
          )}
          style={{ color: '#B07878' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(176,60,60,0.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <LogOut size={14} />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}
