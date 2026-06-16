'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Shirt, Briefcase, Users, CreditCard,
  Car, Route, PackagePlus, Settings, LogOut, TrendingUp, Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

const NAV = [
  { section: 'Principal' },
  { href: '/dashboard',       label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/estoque',         label: 'Estoque',           icon: Shirt },
  { href: '/maletas',         label: 'Maletas',           icon: Briefcase },
  { section: 'Comercial' },
  { href: '/clientes',        label: 'Clientes',          icon: Users },
  { href: '/ranking',         label: 'Ranking & Pontos',  icon: Trophy },
  { href: '/crediario',       label: 'Crediário',         icon: CreditCard },
  { section: 'Operação' },
  { href: '/entrada-estoque', label: 'Entrada Estoque',   icon: PackagePlus },
  { href: '/deslocamentos',   label: 'Deslocamentos',     icon: Car },
  { href: '/rastreio',        label: 'Rastreio',          icon: Route },
  { href: '/financeiro',      label: 'Financeiro',        icon: TrendingUp },
  { section: 'Config' },
  { href: '/configuracoes',   label: 'Configurações',     icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-52 h-screen flex flex-col flex-shrink-0 border-r
                      bg-white border-brand-100
                      dark:bg-[#1C1410] dark:border-brand-900">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-brand-100 dark:border-brand-900">
        <div className="flex items-baseline gap-0.5">
          <span className="text-[22px] font-black tracking-[-1px] text-brand-900 dark:text-brand-100"
                style={{ fontFamily: 'Georgia, serif' }}>
            DAN
          </span>
          <span className="text-[22px] font-black tracking-[-1px] text-brand-400"
                style={{ fontFamily: 'Georgia, serif' }}>
            IK
          </span>
        </div>
        <p className="text-[8px] tracking-[3px] uppercase text-brand-400 mt-0.5">
          Elegance in every detail
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV.map((item, i) => {
          if ('section' in item) {
            return (
              <p key={i} className="text-[9px] font-bold uppercase tracking-[2px]
                                    text-brand-300 dark:text-brand-700
                                    px-2 pt-4 pb-1 first:pt-2">
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
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] mb-0.5 transition-all',
                active
                  ? 'bg-brand-400 text-white font-semibold shadow-sm'
                  : 'text-brand-700 hover:bg-brand-50 hover:text-brand-900 dark:text-brand-400 dark:hover:bg-brand-900/40 dark:hover:text-brand-200'
              )}
            >
              <Icon size={14} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-brand-100 dark:border-brand-900 space-y-0.5">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-lg text-[12px]
                     text-brand-400 hover:bg-red-50 hover:text-red-600 transition-colors
                     dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
