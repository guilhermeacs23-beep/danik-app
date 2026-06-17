'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function VendedoraMaletas() {
  const supabase = createClient()
  const [suits, setSuits] = useState<any[]>([])
  const fmt = (v:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

  useEffect(() => {
    supabase.from('suitcases').select('id, code, status, total_value, total_items, expected_return, customers(name)')
      .in('status',['open','overdue']).order('expected_return').then(({data})=>setSuits(data||[]))
  }, [])

  return (
    <div>
      <div style={{background:'#F0E4E4',padding:'16px'}}>
        <div style={{fontSize:'16px',fontWeight:'600',color:'#3d2010'}}>Minhas maletas</div>
        <div style={{fontSize:'12px',color:'#8B5E3C',marginTop:'2px'}}>{suits.length} ativas</div>
      </div>
      {suits.length===0 && <div style={{textAlign:'center',padding:'48px',color:'#aaa',fontSize:'13px'}}>Nenhuma maleta aberta</div>}
      {suits.map(s => {
        const over = s.status==='overdue'
        const ret = s.expected_return ? new Date(s.expected_return+'T12:00:00').toLocaleDateString('pt-BR') : '—'
        return (
          <Link key={s.id} href={`/vendedora/maleta/${s.id}`} style={{textDecoration:'none'}}>
            <div style={{background:'#fff',borderBottom:'1px solid #f0ece7',padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontSize:'15px',fontWeight:'600',color:'#3d2010'}}>{s.customers?.name||'Cliente'}</div>
                  <div style={{fontSize:'12px',color:'#999',marginTop:'2px'}}>{s.code} · {s.total_items} peças · {fmt(s.total_value||0)}</div>
                </div>
                <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:over?'#FAEEDA':'#E6F1FB',color:over?'#854F0B':'#185FA5'}}>
                  {over?'Atrasada':'Aberta'}
                </span>
              </div>
              <div style={{fontSize:'12px',color:'#8B5E3C',marginTop:'8px'}}>📅 Retorno: {ret} →</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
