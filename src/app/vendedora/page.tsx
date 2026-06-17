'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const S = {
  topbar: { background:'#F0E4E4', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' } as React.CSSProperties,
  title:  { fontSize:'16px', fontWeight:'600', color:'#3d2010' } as React.CSSProperties,
  sub:    { fontSize:'12px', color:'#8B5E3C', marginTop:'2px' } as React.CSSProperties,
  avatar: { width:'38px', height:'38px', borderRadius:'50%', background:'#C4956A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'600', color:'#fff' } as React.CSSProperties,
  section:{ padding:'0 14px 6px', fontSize:'11px', fontWeight:'600', color:'#999', letterSpacing:'.6px', textTransform:'uppercase' as const, marginTop:'14px' },
  card:   { background:'#fff', borderRadius:'14px', border:'1px solid #ede8e1', padding:'14px', margin:'0 14px 10px' } as React.CSSProperties,
  badge:  (color: string) => ({ display:'inline-block', fontSize:'10px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px', background: color === 'blue' ? '#E6F1FB' : color === 'green' ? '#EAF3DE' : color === 'amber' ? '#FAEEDA' : '#F0E4E4', color: color === 'blue' ? '#185FA5' : color === 'green' ? '#3B6D11' : color === 'amber' ? '#854F0B' : '#8B5E3C' }),
  kpi:    { background:'#fff', borderRadius:'12px', border:'1px solid #ede8e1', padding:'12px', flex:1 } as React.CSSProperties,
}

export default function VendedoraHoje() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [suitcases, setSuitcases] = useState<any[]>([])
  const [kmToday, setKmToday] = useState(0)
  const today = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'short' })
  const todayISO = new Date().toISOString().slice(0,10)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: suits }, { data: trip }] = await Promise.all([
        supabase.from('profiles').select('name, tenant_id').eq('id', user.id).single(),
        supabase.from('suitcases').select('id, code, status, total_value, total_items, expected_return, customers(name, whatsapp)').in('status', ['open','overdue']).order('expected_return'),
        supabase.from('trip_logs').select('km_end, km_start').eq('date', todayISO),
      ])
      setProfile(prof)
      setSuitcases(suits || [])
      const km = (trip || []).reduce((a: number, t: any) => a + Math.max(0, (t.km_end||0)-(t.km_start||0)), 0)
      setKmToday(km)
    }
    load()
  }, [])

  const firstName = profile?.name?.split(' ')[0] || 'Vendedora'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const initials = (profile?.name || 'V').split(' ').map((n: string) => n[0]).slice(0,2).join('')

  const overdue = suitcases.filter(s => s.status === 'overdue')
  const open    = suitcases.filter(s => s.status === 'open')

  return (
    <div>
      <div style={S.topbar}>
        <div>
          <div style={S.title}>{greeting}, {firstName}</div>
          <div style={S.sub}>{today.charAt(0).toUpperCase() + today.slice(1)}</div>
        </div>
        <div style={S.avatar}>{initials}</div>
      </div>

      {overdue.length > 0 && (
        <div style={{ margin:'12px 14px 0', background:'#FAEEDA', borderRadius:'12px', padding:'12px 14px', border:'1px solid #FAC775', display:'flex', gap:'10px', alignItems:'center' }}>
          <span style={{ fontSize:'18px' }}>⚠️</span>
          <div>
            <div style={{ fontSize:'13px', fontWeight:'600', color:'#854F0B' }}>{overdue.length} maleta{overdue.length>1?'s':''} em atraso</div>
            <div style={{ fontSize:'11px', color:'#854F0B', marginTop:'2px' }}>Clique para registrar retorno</div>
          </div>
        </div>
      )}

      <div style={S.section}>Maletas ativas hoje</div>

      {suitcases.length === 0 && (
        <div style={{ ...S.card, textAlign:'center', color:'#aaa', fontSize:'13px', padding:'28px' }}>
          Nenhuma maleta aberta 🎉
        </div>
      )}

      {suitcases.map(s => {
        const isOverdue = s.status === 'overdue'
        const retorno = s.expected_return ? new Date(s.expected_return + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }) : '—'
        return (
          <Link key={s.id} href={`/vendedora/maleta/${s.id}`} style={{ textDecoration:'none' }}>
            <div style={{ ...S.card, borderColor: isOverdue ? '#FAC775' : '#ede8e1' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:'#3d2010' }}>{s.customers?.name || 'Cliente'}</div>
                  <div style={{ fontSize:'11px', color:'#999', marginTop:'2px' }}>{s.code} · {s.total_items} peças · {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(s.total_value||0)}</div>
                </div>
                <span style={S.badge(isOverdue ? 'amber' : 'blue')}>{isOverdue ? 'Atrasada' : 'Aberta'}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:'12px', color: isOverdue ? '#854F0B' : '#8B5E3C' }}>
                  {isOverdue ? '⚠ ' : '📅 '}Retorno: {retorno}
                </div>
                <div style={{ fontSize:'12px', color:'#C4956A', fontWeight:'500' }}>Registrar retorno →</div>
              </div>
            </div>
          </Link>
        )
      })}

      <div style={S.section}>Resumo do dia</div>
      <div style={{ display:'flex', gap:'8px', padding:'0 14px 20px' }}>
        <div style={S.kpi}>
          <div style={{ fontSize:'10px', color:'#999', marginBottom:'4px' }}>Km rodados</div>
          <div style={{ fontSize:'22px', fontWeight:'600', color:'#3d2010' }}>{kmToday}</div>
          <div style={{ fontSize:'10px', color:'#999' }}>km hoje</div>
        </div>
        <div style={S.kpi}>
          <div style={{ fontSize:'10px', color:'#999', marginBottom:'4px' }}>Maletas</div>
          <div style={{ fontSize:'22px', fontWeight:'600', color:'#3B6D11' }}>{open.length}</div>
          <div style={{ fontSize:'10px', color:'#999' }}>abertas</div>
        </div>
        <div style={S.kpi}>
          <div style={{ fontSize:'10px', color:'#999', marginBottom:'4px' }}>Atrasadas</div>
          <div style={{ fontSize:'22px', fontWeight:'600', color: overdue.length > 0 ? '#854F0B' : '#3d2010' }}>{overdue.length}</div>
          <div style={{ fontSize:'10px', color:'#999' }}>maletas</div>
        </div>
      </div>
    </div>
  )
}
