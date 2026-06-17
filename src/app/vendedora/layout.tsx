'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function VendedoraLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const active = (p: string) => path === p || path.startsWith(p + '/')

  const tabs = [
    { href: '/vendedora',         icon: '🏠', label: 'Hoje',    exact: true },
    { href: '/vendedora/maletas', icon: '👜', label: 'Maletas', exact: false },
    { href: '/vendedora/receber', icon: '💳', label: 'Receber', exact: false },
    { href: '/vendedora/rota',    icon: '📍', label: 'Rota',    exact: false },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', maxWidth:'480px', margin:'0 auto', background:'#faf9f7', fontFamily:'system-ui,sans-serif', position:'relative', overflow:'hidden' }}>
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
        {children}
      </div>
      <nav style={{ display:'flex', borderTop:'1px solid #e8e0d8', background:'#fff', flexShrink:0, paddingBottom:'env(safe-area-inset-bottom)' }}>
        {tabs.map(t => {
          const isActive = t.exact ? path === t.href : active(t.href)
          return (
            <Link key={t.href} href={t.href} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              gap:'2px', padding:'10px 0 8px', textDecoration:'none',
              color: isActive ? '#8B5E3C' : '#999',
              fontSize:'10px', fontWeight: isActive ? '600' : '400',
              borderTop: isActive ? '2px solid #C4956A' : '2px solid transparent',
              transition:'all .15s',
            }}>
              <span style={{ fontSize:'20px', lineHeight:1 }}>{t.icon}</span>
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
