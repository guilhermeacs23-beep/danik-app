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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="w-52 h-screen flex flex-col flex-shrink-0"
      style={{ background: 'linear-gradient(180deg, #C4956A 0%, #A87850 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-baseline gap-0">
          <span className="text-[24px] font-black tracking-[-1px] text-white"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            DANI
          </span>
          <span className="text-[24px] font-black tracking-[-1px] text-white/70"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            K
          </span>
        </div>
        <p className="text-[7.5px] tracking-[3.5px] uppercase text-white/50 mt-0.5">
          Elegance in every detail
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV.map((item, i) => {
          if ('section' in item) {
            return (
              <p key={i} className="text-[9px] font-bold uppercase tracking-[2px]
                                    text-white/40 px-2 pt-4 pb-1 first:pt-2">
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
                  ? 'bg-white text-brand-700 font-semibold shadow-sm'
                  : 'text-white/80 hover:bg-white/15 hover:text-white'
              )}
            >
              <Icon size={14} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/10 space-y-0.5">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-lg text-[12px]
                     text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
