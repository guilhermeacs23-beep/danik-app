'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VendedoraRota() {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0,10)
  const [logs, setLogs]     = useState<any[]>([])
  const [kmStart, setKmStart] = useState('')
  const [kmEnd, setKmEnd]   = useState('')
  const [dest, setDest]     = useState('')
  const [fuel, setFuel]     = useState('')
  const [fuelPrice, setFuelPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  async function load() {
    const { data } = await supabase.from('trip_logs').select('*').eq('date', today).order('created_at')
    setLogs(data||[])
  }

  useEffect(() => { load() }, [])

  const totalKm  = logs.reduce((a,l)=>a+Math.max(0,(l.km_end||0)-(l.km_start||0)),0)
  const totalFuel = logs.reduce((a,l)=>a+(l.fuel_cost||0),0)

  async function addLeg() {
    if (!kmStart || !kmEnd) return
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    await supabase.from('trip_logs').insert({
      tenant_id: prof?.tenant_id, seller_id: user.id,
      date: today, km_start: parseFloat(kmStart), km_end: parseFloat(kmEnd),
      destination: dest || null,
      fuel_liters: fuel ? parseFloat(fuel) : null,
      fuel_cost: (fuel && fuelPrice) ? parseFloat(fuel)*parseFloat(fuelPrice) : null,
    })
    setKmStart(''); setKmEnd(''); setDest(''); setFuel(''); setFuelPrice('')
    setSaving(false); setSaved(true)
    setTimeout(()=>setSaved(false),1500)
    load()
  }

  return (
    <div style={{paddingBottom:'20px'}}>
      <div style={{background:'#F0E4E4',padding:'16px'}}>
        <div style={{fontSize:'16px',fontWeight:'600',color:'#3d2010'}}>Deslocamento do dia</div>
        <div style={{fontSize:'12px',color:'#8B5E3C',marginTop:'2px'}}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'short'})}</div>
      </div>

      <div style={{display:'flex',gap:'8px',padding:'12px 14px'}}>
        <div style={{flex:1,background:'#fff',borderRadius:'12px',border:'1px solid #ede8e1',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'#999',marginBottom:'4px'}}>KM rodados</div>
          <div style={{fontSize:'26px',fontWeight:'700',color:'#3d2010'}}>{totalKm.toFixed(0)}</div>
          <div style={{fontSize:'10px',color:'#999'}}>km hoje</div>
        </div>
        <div style={{flex:1,background:'#fff',borderRadius:'12px',border:'1px solid #ede8e1',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'#999',marginBottom:'4px'}}>Combustível</div>
          <div style={{fontSize:'22px',fontWeight:'700',color:'#854F0B'}}>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(totalFuel)}</div>
          <div style={{fontSize:'10px',color:'#999'}}>{logs.filter(l=>l.fuel_cost).length} abastec.</div>
        </div>
      </div>

      {logs.length>0 && (
        <div style={{padding:'0 14px 14px'}}>
          <div style={{fontSize:'11px',color:'#999',fontWeight:'600',letterSpacing:'.5px',textTransform:'uppercase',marginBottom:'8px'}}>Registro do dia</div>
          {logs.map((l,i)=>(
            <div key={l.id} style={{background:'#fff',borderRadius:'10px',border:'1px solid #ede8e1',padding:'10px 12px',marginBottom:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'600',color:'#3d2010'}}>{l.destination||`Trecho ${i+1}`}</div>
                <div style={{fontSize:'11px',color:'#999',marginTop:'1px'}}>Km {l.km_start} → {l.km_end} ({Math.max(0,(l.km_end||0)-(l.km_start||0)).toFixed(0)} km)</div>
              </div>
              {l.fuel_cost && <div style={{fontSize:'12px',color:'#854F0B',fontWeight:'600'}}>⛽ {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(l.fuel_cost)}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{margin:'0 14px',background:'#fff',borderRadius:'14px',border:'1px solid #ede8e1',padding:'16px'}}>
        <div style={{fontSize:'13px',fontWeight:'600',color:'#3d2010',marginBottom:'12px'}}>➕ Registrar trecho</div>

        <input placeholder="Destino (ex: Maria Souza)" value={dest} onChange={e=>setDest(e.target.value)}
          style={{width:'100%',padding:'10px 14px',border:'1px solid #e8e0d8',borderRadius:'10px',fontSize:'14px',marginBottom:'8px',background:'#faf9f7'}} />

        <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
          <input placeholder="KM saída" type="number" value={kmStart} onChange={e=>setKmStart(e.target.value)}
            style={{flex:1,padding:'10px 12px',border:'1px solid #e8e0d8',borderRadius:'10px',fontSize:'14px',background:'#faf9f7'}} />
          <input placeholder="KM chegada" type="number" value={kmEnd} onChange={e=>setKmEnd(e.target.value)}
            style={{flex:1,padding:'10px 12px',border:'1px solid #e8e0d8',borderRadius:'10px',fontSize:'14px',background:'#faf9f7'}} />
        </div>

        <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
          <input placeholder="Litros" type="number" value={fuel} onChange={e=>setFuel(e.target.value)}
            style={{flex:1,padding:'10px 12px',border:'1px solid #e8e0d8',borderRadius:'10px',fontSize:'14px',background:'#faf9f7'}} />
          <input placeholder="R$/litro" type="number" value={fuelPrice} onChange={e=>setFuelPrice(e.target.value)}
            style={{flex:1,padding:'10px 12px',border:'1px solid #e8e0d8',borderRadius:'10px',fontSize:'14px',background:'#faf9f7'}} />
        </div>

        <button onClick={addLeg} disabled={saving||!kmStart||!kmEnd} style={{
          width:'100%',padding:'14px',borderRadius:'12px',
          background:saved?'#639922':'#C4956A',color:'#fff',border:'none',
          fontSize:'14px',fontWeight:'700',cursor:'pointer',
          opacity:(!kmStart||!kmEnd)?0.4:1,transition:'background .3s',
        }}>
          {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar trecho'}
        </button>
      </div>
    </div>
  )
}
