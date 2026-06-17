'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Dec = 'kept' | 'returned' | 'pending'
interface Row { id: string; dec: Dec; si_id: string; pi_id: string; code: string; name: string; size: string; color: string; price: number }

const S = {
  topbar: { background:'#F0E4E4', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' } as React.CSSProperties,
  btn: (active: boolean, color: 'green'|'amber') => ({
    flex:1, padding:'8px 0', borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer', border:'1px solid', transition:'all .15s',
    background: active ? (color==='green'?'#639922':'#BA7517') : '#f5f3f0',
    color: active ? '#fff' : '#999',
    borderColor: active ? (color==='green'?'#639922':'#BA7517') : '#e8e0d8',
  } as React.CSSProperties),
  fab: { position:'fixed' as const, bottom:'72px', right:'16px', width:'52px', height:'52px', borderRadius:'50%', background:'#C4956A', border:'none', color:'#fff', fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(196,149,106,.4)' },
}

export default function VendedoraMaleta() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const router = useRouter()

  const [suit, setSuit]     = useState<any>(null)
  const [rows, setRows]     = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [step, setStep]       = useState<'list'|'pay'>('list')
  const [payMode, setPayMode] = useState<'pix'|'card'|'cash'|'cred'>('pix')
  const [entrada, setEntrada] = useState('')
  const [parcelas, setParcelas] = useState(2)
  const [discount, setDiscount] = useState('')
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    const [{ data: s }, { data: items }] = await Promise.all([
      supabase.from('suitcases').select('*, customers(id,name,whatsapp)').eq('id', id).single(),
      supabase.from('suitcase_items')
        .select('id, consignment_price, product_items(id, item_code, size, color, products(name, sale_price))')
        .eq('suitcase_id', id).eq('status', 'with_customer'),
    ])
    setSuit(s)
    setRows((items||[]).map((i:any) => ({
      id: crypto.randomUUID(), dec: 'pending' as Dec,
      si_id: i.id, pi_id: i.product_items?.id,
      code: i.product_items?.item_code||'',
      name: i.product_items?.products?.name||'—',
      size: i.product_items?.size||'',
      color: i.product_items?.color||'',
      price: i.consignment_price || i.product_items?.products?.sale_price || 0,
    })))
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const decide  = (rid: string, d: Dec) => setRows(p => p.map(r => r.id===rid ? {...r, dec:d} : r))
  const all     = (d: Dec) => setRows(p => p.map(r => ({...r, dec:d})))

  const kept     = rows.filter(r => r.dec==='kept')
  const returned = rows.filter(r => r.dec==='returned')
  const pending  = rows.filter(r => r.dec==='pending')
  const subtotal = kept.reduce((a,r) => a+r.price, 0)
  const disc     = parseFloat(discount)||0
  const total    = Math.max(0, subtotal - disc)
  const entNum   = parseFloat(entrada)||0
  const cred     = Math.max(0, total - entNum)
  const fmt = (v:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

  async function confirm() {
    if (pending.length > 0) { setError('Defina todas as peças antes de confirmar.'); return }
    setSaving(true); setError('')
    const { data:{user} } = await supabase.auth.getUser()
    if (!user) { setError('Não autenticado'); setSaving(false); return }
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = prof?.tenant_id
    if (!tenantId) { setError('Sem tenant'); setSaving(false); return }

    if (returned.length > 0) {
      await supabase.from('suitcase_items').update({status:'returned'}).in('id', returned.map(r=>r.si_id))
      await supabase.from('product_items').update({status:'in_stock',current_suitcase_id:null,current_customer_id:null}).in('id', returned.map(r=>r.pi_id))
    }
    if (kept.length > 0) {
      await supabase.from('suitcase_items').update({status:'sold'}).in('id', kept.map(r=>r.si_id))
      await supabase.from('product_items').update({status:'sold'}).in('id', kept.map(r=>r.pi_id))
      const { data: sale } = await supabase.from('sales').insert({
        tenant_id: tenantId, customer_id: suit?.customers?.id, suitcase_id: id,
        sale_type:'suitcase', code:`VND-${Date.now().toString().slice(-6)}`,
        subtotal, discount_value: disc, total,
        payment_method: payMode==='cred' ? 'credit' : payMode==='mixed' ? 'mixed' : payMode,
        installments: payMode==='cred' ? parcelas : 1,
        status: (payMode==='cred' && cred>0) ? 'partial' : 'completed',
      }).select().single()

      if (sale && payMode==='cred' && cred>0) {
        const firstDue = new Date(); firstDue.setMonth(firstDue.getMonth()+1)
        const { data: acc } = await supabase.from('store_credit_accounts').insert({
          tenant_id: tenantId, customer_id: suit?.customers?.id, sale_id: sale.id,
          total_amount: cred, installments: parcelas, installment_value: cred/parcelas,
          first_due_date: firstDue.toISOString().slice(0,10), status:'open', amount_paid:0, amount_pending:cred,
        }).select().single()
        if (acc) {
          await supabase.from('credit_installments').insert(
            Array.from({length:parcelas},(_,i)=>{
              const d=new Date(firstDue); d.setMonth(d.getMonth()+i)
              return { tenant_id:tenantId, account_id:acc.id, customer_id:suit?.customers?.id, installment_num:i+1, amount:cred/parcelas, due_date:d.toISOString().slice(0,10), status:'pending' }
            })
          )
        }
      }
    }
    await supabase.from('suitcases').update({ status:'closed', value_sold:total, returned_at:new Date().toISOString() }).eq('id', id)
    router.push('/vendedora')
  }

  if (loading) return <div style={{padding:'40px',textAlign:'center',color:'#aaa'}}>Carregando...</div>

  const PAY_OPTS = [
    { id:'pix',  icon:'📱', label:'PIX' },
    { id:'card', icon:'💳', label:'Cartão' },
    { id:'cash', icon:'💵', label:'Dinheiro' },
    { id:'cred', icon:'📅', label:'Crediário' },
  ]

  if (step === 'pay') return (
    <div>
      <div style={{background:'#F0E4E4',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
        <button onClick={()=>setStep('list')} style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#8B5E3C'}}>←</button>
        <div>
          <div style={{fontSize:'15px',fontWeight:'600',color:'#3d2010'}}>Receber pagamento</div>
          <div style={{fontSize:'11px',color:'#8B5E3C'}}>{suit?.customers?.name} · {kept.length} peça{kept.length!==1?'s':''}</div>
        </div>
      </div>
      <div style={{padding:'16px'}}>
        <div style={{fontSize:'11px',color:'#999',fontWeight:'600',letterSpacing:'.5px',textTransform:'uppercase',marginBottom:'6px'}}>Total</div>
        <div style={{fontSize:'36px',fontWeight:'700',color:'#3d2010',marginBottom:'4px'}}>{fmt(total)}</div>
        {disc>0 && <div style={{fontSize:'12px',color:'#854F0B'}}>Desconto de {fmt(disc)} aplicado</div>}

        {disc===0 && (
          <div style={{marginBottom:'16px',marginTop:'8px'}}>
            <input placeholder="Desconto (R$)" type="number" value={discount} onChange={e=>setDiscount(e.target.value)}
              style={{width:'100%',padding:'10px 14px',border:'1px solid #e8e0d8',borderRadius:'10px',fontSize:'14px',background:'#faf9f7'}} />
          </div>
        )}

        <div style={{fontSize:'11px',color:'#999',fontWeight:'600',letterSpacing:'.5px',textTransform:'uppercase',marginBottom:'10px',marginTop:'8px'}}>Como pagou?</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px'}}>
          {PAY_OPTS.map(p => (
            <button key={p.id} onClick={()=>setPayMode(p.id as any)} style={{
              padding:'14px 10px', borderRadius:'12px', border: payMode===p.id ? '2px solid #C4956A' : '1px solid #e8e0d8',
              background: payMode===p.id ? '#F5EDE3' : '#fff', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
            }}>
              <span style={{fontSize:'22px'}}>{p.icon}</span>
              <span style={{fontSize:'12px',fontWeight:'600',color: payMode===p.id ? '#8B5E3C' : '#666'}}>{p.label}</span>
            </button>
          ))}
        </div>

        {payMode==='cred' && (
          <div style={{background:'#F5EDE3',borderRadius:'12px',padding:'14px',marginBottom:'16px'}}>
            <div style={{fontSize:'12px',fontWeight:'600',color:'#8B5E3C',marginBottom:'10px'}}>Configurar crediário</div>
            <label style={{fontSize:'11px',color:'#8B5E3C',display:'block',marginBottom:'4px'}}>Entrada agora (R$)</label>
            <input placeholder="0,00" type="number" value={entrada} onChange={e=>setEntrada(e.target.value)}
              style={{width:'100%',padding:'10px',border:'1px solid #ddd5ca',borderRadius:'8px',fontSize:'14px',marginBottom:'10px',background:'#fff'}} />
            <label style={{fontSize:'11px',color:'#8B5E3C',display:'block',marginBottom:'4px'}}>Parcelas</label>
            <select value={parcelas} onChange={e=>setParcelas(+e.target.value)}
              style={{width:'100%',padding:'10px',border:'1px solid #ddd5ca',borderRadius:'8px',fontSize:'14px',background:'#fff'}}>
              {[2,3,4,5,6,8,10,12].map(n=><option key={n} value={n}>{n}x de {fmt(Math.max(0,total-entNum)/n)}</option>)}
            </select>
            {cred>0 && <div style={{marginTop:'10px',fontSize:'12px',color:'#8B5E3C'}}>💳 Vai pro crediário: <strong>{fmt(cred)}</strong></div>}
          </div>
        )}

        {error && <div style={{color:'#E24B4A',fontSize:'13px',marginBottom:'10px'}}>{error}</div>}
        <button onClick={confirm} disabled={saving} style={{
          width:'100%',padding:'16px',borderRadius:'14px',background:'#C4956A',color:'#fff',border:'none',
          fontSize:'15px',fontWeight:'700',cursor:'pointer',opacity:saving?0.6:1,
        }}>
          {saving ? 'Processando...' : `✓ Confirmar · ${fmt(total)}`}
        </button>
        {returned.length>0 && <div style={{textAlign:'center',fontSize:'11px',color:'#aaa',marginTop:'8px'}}>{returned.length} peça{returned.length!==1?'s':''} volta{returned.length===1?'':' m'} pro estoque</div>}
      </div>
    </div>
  )

  return (
    <div style={{paddingBottom:'80px'}}>
      <div style={S.topbar}>
        <Link href="/vendedora" style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#8B5E3C',textDecoration:'none'}}>←</Link>
        <div style={{flex:1}}>
          <div style={{fontSize:'15px',fontWeight:'600',color:'#3d2010'}}>{suit?.customers?.name}</div>
          <div style={{fontSize:'11px',color:'#8B5E3C'}}>{suit?.code} · {rows.length} peças</div>
        </div>
        <div style={{fontSize:'12px',color:'#3B6D11',fontWeight:'600'}}>{kept.length} ficou · {returned.length} voltou</div>
      </div>

      <div style={{display:'flex',gap:'6px',padding:'10px 14px',background:'#faf9f7',borderBottom:'1px solid #ede8e1'}}>
        <button onClick={()=>all('kept')}   style={{flex:1,padding:'8px',borderRadius:'10px',background:'#EAF3DE',color:'#3B6D11',border:'1px solid #C0DD97',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>✓ Tudo ficou</button>
        <button onClick={()=>all('returned')} style={{flex:1,padding:'8px',borderRadius:'10px',background:'#FAEEDA',color:'#854F0B',border:'1px solid #FAC775',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>↩ Tudo voltou</button>
        <button onClick={()=>all('pending')} style={{flex:1,padding:'8px',borderRadius:'10px',background:'#f0ece7',color:'#888',border:'1px solid #e8e0d8',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>✕ Limpar</button>
      </div>

      {rows.map(row => (
        <div key={row.id} style={{
          display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',
          borderBottom:'1px solid #f0ece7',
          background: row.dec==='kept'?'#f0fae8' : row.dec==='returned'?'#fef8ee' : '#fff',
          transition:'background .15s',
        }}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#3d2010',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{row.name}</div>
            <div style={{fontSize:'11px',color:'#999',marginTop:'1px'}}>{row.size}{row.color?' · '+row.color:''} · {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(row.price)}</div>
          </div>
          <div style={{display:'flex',gap:'4px',flexShrink:0}}>
            <button onClick={()=>decide(row.id, row.dec==='kept'?'pending':'kept')} style={S.btn(row.dec==='kept','green')}>Ficou</button>
            <button onClick={()=>decide(row.id, row.dec==='returned'?'pending':'returned')} style={S.btn(row.dec==='returned','amber')}>Voltou</button>
          </div>
        </div>
      ))}

      {rows.length===0 && <div style={{textAlign:'center',padding:'40px',color:'#aaa',fontSize:'13px'}}>Nenhuma peça ativa nesta maleta.</div>}

      <div style={{position:'fixed',bottom:'60px',left:0,right:0,maxWidth:'480px',margin:'0 auto',background:'#fff',borderTop:'1px solid #e8e0d8',padding:'12px 14px',display:'flex',gap:'10px',alignItems:'center'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:'12px',color:'#999'}}>{kept.length} comprada{kept.length!==1?'s':''} · {returned.length} devolvida{returned.length!==1?'s':''}</div>
          <div style={{fontSize:'16px',fontWeight:'700',color:'#3B6D11'}}>{fmt(kept.reduce((a,r)=>a+r.price,0))}</div>
        </div>
        <button onClick={()=>{ if(pending.length>0){setError('Defina todas as peças.');return} setError(''); setStep('pay') }}
          disabled={rows.length===0}
          style={{padding:'12px 20px',borderRadius:'12px',background:'#C4956A',color:'#fff',border:'none',fontSize:'14px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap',opacity:rows.length===0?0.4:1}}>
          Pagar →
        </button>
      </div>
      {error && <div style={{position:'fixed',bottom:'120px',left:'14px',right:'14px',maxWidth:'452px',margin:'0 auto',background:'#FCEBEB',border:'1px solid #F09595',borderRadius:'10px',padding:'10px 14px',fontSize:'12px',color:'#A32D2D'}}>{error}</div>}
    </div>
  )
}
