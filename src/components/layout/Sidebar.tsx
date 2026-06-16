'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Shirt, Briefcase, Users, CreditCard,
  Car, Route, PackagePlus, Settings, LogOut, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { label: 'Principal',   section: true },
  { href: '/dashboard',        label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/estoque',          label: 'Estoque',         icon: Shirt },
  { href: '/maletas',          label: 'Maletas',         icon: Briefcase, alertKey: 'overdue_suitcases' },
  { label: 'Comercial',   section: true },
  { href: '/clientes',         label: 'Clientes',        icon: Users },
  { href: '/crediario',        label: 'Crediário',       icon: CreditCard, alertKey: 'overdue_installments' },
  { label: 'Operação',    section: true },
  { href: '/entrada-estoque',  label: 'Entrada de Estoque', icon: PackagePlus },
  { href: '/deslocamentos',    label: 'Deslocamentos',   icon: Car },
  { href: '/rastreio',         label: 'Rastreio',        icon: Route },
  { href: '/financeiro',       label: 'Financeiro',      icon: TrendingUp },
  { label: 'Config',      section: true },
  { href: '/configuracoes',    label: 'Configurações',   icon: Settings },
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
    <aside className="w-48 h-screen flex flex-col bg-white border-r border-gray-200 flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200">
        <span className="text-lg font-medium tracking-tight text-gray-900">
          DA<span className="text-brand-600">NIK</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV.map((item, i) => {
          if ('section' in item && item.section) {
            return (
              <p key={i} className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-2 pt-3 pb-1">
                {item.label}
              </p>
            )
          }
          if (!item.href) return null
          const Icon = item.icon!
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] mb-0.5 transition-colors',
                active
                  ? 'bg-brand-50 text-brand-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={15} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-lg text-[12.5px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}
