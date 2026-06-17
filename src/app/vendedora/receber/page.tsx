'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VendedoraReceber() {
  const supabase = createClient()
  const [pending, setPending] = useState<any[]>([])
  const fmt = (v:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

  useEffect(() => {
    supabase.from('credit_installments')
      .select('*, store_credit_accounts(customers(name))')
      .eq('status','pending')
      .order('due_date')
      .limit(30)
      .then(({data}) => setPending(data||[]))
  }, [])

  const total = pending.reduce((a,p)=>a+(p.amount||0),0)
  const today = new Date().toISOString().slice(0,10)
  const overdue = pending.filter(p=>p.due_date<today)

  return (
    <div>
      <div style={{background:'#F0E4E4',padding:'16px'}}>
        <div style={{fontSize:'16px',fontWeight:'600',color:'#3d2010'}}>Crediário pendente</div>
        <div style={{fontSize:'12px',color:'#8B5E3C',marginTop:'2px'}}>{fmt(total)} a receber</div>
      </div>

      {overdue.length>0 && (
        <div style={{margin:'12px 14px 0',background:'#FAEEDA',borderRadius:'12px',padding:'12px 14px',border:'1px solid #FAC775'}}>
          <div style={{fontSize:'13px',fontWeight:'600',color:'#854F0B'}}>⚠ {overdue.length} parcela{overdue.length!==1?'s':''} vencida{overdue.length!==1?'s':''}</div>
          <div style={{fontSize:'11px',color:'#854F0B',marginTop:'2px'}}>{fmt(overdue.reduce((a,p)=>a+(p.amount||0),0))} em atraso</div>
        </div>
      )}

      {pending.length===0 && <div style={{textAlign:'center',padding:'48px',color:'#aaa',fontSize:'13px'}}>Nenhuma parcela pendente 🎉</div>}

      <div style={{padding:'12px 0'}}>
        {pending.map(p => {
          const name = p.store_credit_accounts?.customers?.name || '—'
          const venc = new Date(p.due_date+'T12:00:00').toLocaleDateString('pt-BR')
          const isLate = p.due_date < today
          return (
            <div key={p.id} style={{background:'#fff',borderBottom:'1px solid #f0ece7',padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#3d2010'}}>{name}</div>
                <div style={{fontSize:'11px',color:isLate?'#854F0B':'#999',marginTop:'2px'}}>
                  Parcela {p.installment_num} · Vence {venc}{isLate?' ⚠':''}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'15px',fontWeight:'700',color:'#3d2010'}}>{fmt(p.amount)}</div>
                <div style={{fontSize:'10px',color:'#aaa',marginTop:'2px'}}>toque p/ registrar</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
