'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function CadastroPage() {
  const [step, setStep] = useState<'form'|'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const set = (f:string,v:string) => setForm(p=>({...p,[f]:v}))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    if (form.password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    const res = await fetch('/api/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name:form.name.trim(), email:form.email.trim(), password:form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return }
    setStep('success'); setLoading(false)
  }

  const Illustrations = () => <>
    {/* LEFT */}
    <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'28%', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
      <svg viewBox="0 0 280 500" width="100%" height="100%" style={{opacity:0.18}}>
        <path d="M140 40 Q140 20 160 20 Q180 20 180 35 Q180 50 140 60 L60 140 Q40 150 40 170 L220 170 Q220 150 200 140 Z" fill="#8B5E3C"/>
        <path d="M60 170 L30 380 Q30 400 140 400 Q250 400 250 380 L220 170 Z" fill="#C4956A" opacity="0.6"/>
        <path d="M80 230 Q140 210 200 230" fill="none" stroke="#8B5E3C" strokeWidth="3"/>
        <path d="M60 280 L30 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
        <path d="M140 265 L140 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
        <path d="M220 280 L250 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
        <circle cx="40" cy="80" r="3" fill="#C4956A"/>
        <circle cx="240" cy="120" r="2" fill="#C4956A"/>
        <circle cx="30" cy="300" r="4" fill="#C4956A" opacity="0.4"/>
        <rect x="170" y="340" width="80" height="55" rx="8" fill="#8B5E3C" opacity="0.5"/>
        <path d="M185 340 Q185 315 210 315 Q235 315 235 340" fill="none" stroke="#8B5E3C" strokeWidth="3" opacity="0.5"/>
      </svg>
    </div>
    {/* RIGHT */}
    <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'28%', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
      <svg viewBox="0 0 280 500" width="100%" height="100%" style={{opacity:0.18}}>
        <path d="M140 30 Q140 15 155 15 Q170 15 170 28 Q170 40 140 48 L80 90 Q65 98 65 112 L215 112 Q215 98 200 90 Z" fill="#8B5E3C"/>
        <path d="M65 112 L50 200 L230 200 L215 112 Z" fill="#C4956A" opacity="0.5"/>
        <path d="M65 112 L30 180 L60 195 L80 130 Z" fill="#C4956A" opacity="0.4"/>
        <path d="M215 112 L250 180 L220 195 L200 130 Z" fill="#C4956A" opacity="0.4"/>
        <path d="M110 112 Q140 135 170 112" fill="none" stroke="#8B5E3C" strokeWidth="2"/>
        <path d="M50 200 Q30 380 140 420 Q250 380 230 200 Z" fill="#D4A574" opacity="0.4"/>
        <circle cx="100" cy="300" r="3" fill="#8B5E3C" opacity="0.3"/>
        <circle cx="140" cy="310" r="3" fill="#8B5E3C" opacity="0.3"/>
        <circle cx="180" cy="300" r="3" fill="#8B5E3C" opacity="0.3"/>
        <circle cx="240" cy="60" r="4" fill="#C4956A" opacity="0.5"/>
        <path d="M80 440 Q80 460 140 460 Q160 460 165 450 L155 440 Q140 448 80 440 Z" fill="#8B5E3C" opacity="0.4"/>
        <rect x="148" y="425" width="8" height="20" rx="2" fill="#8B5E3C" opacity="0.4"/>
      </svg>
    </div>
  </>

  if (step === 'success') return (
    <div style={{ minHeight:'100vh', background:'#F0E4E4', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', paddingBottom:80 }}>
        <Illustrations />
        <div style={{ width:'100%', maxWidth:400, zIndex:1, padding:'0 16px', textAlign:'center' }}>
          <img src="/logo.png" alt="DANIK" style={{ width:200, height:'auto', margin:'0 auto 24px' }} />
          <div style={{ background:'white', borderRadius:16, border:'1px solid #e8d8d4', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', padding:32 }}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <h2 style={{fontSize:18,fontWeight:600,color:'#1f2937',marginBottom:8}}>Conta criada!</h2>
            <p style={{fontSize:14,color:'#6b7280',marginBottom:24}}>Tudo pronto. Faça login para acessar o sistema.</p>
            <Link href="/login" className="btn btn-primary" style={{display:'block',textAlign:'center',padding:'10px 0'}}>
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
      <div style={{ background:'#0a0a0a', display:'flex', justifyContent:'center', alignItems:'center', padding:'10px 0', height:72 }}>
        <img src="/valora.png" alt="Valora Business Technology" style={{ height:52, width:'auto', filter:'brightness(1.5) contrast(1.1)' }} />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F0E4E4', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', paddingBottom:80 }}>
        <Illustrations />
        <div style={{ width:'100%', maxWidth:400, zIndex:1, padding:'0 16px' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <img src="/logo.png" alt="DANIK" style={{ width:240, height:'auto', margin:'0 auto' }} />
          </div>
          <div style={{ background:'white', borderRadius:16, border:'1px solid #e8d8d4', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', padding:28 }}>
            <h2 style={{fontSize:16,fontWeight:600,color:'#1f2937',marginBottom:20}}>Criar conta</h2>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label className="label">Nome completo *</label>
                <input type="text" required autoFocus value={form.name} onChange={e=>set('name',e.target.value)} className="input" placeholder="Seu nome" />
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input type="email" required value={form.email} onChange={e=>set('email',e.target.value)} className="input" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="label">Senha *</label>
                <input type="password" required value={form.password} onChange={e=>set('password',e.target.value)} className="input" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="label">Confirmar senha *</label>
                <input type="password" required value={form.confirm} onChange={e=>set('confirm',e.target.value)} className="input" placeholder="Repita a senha" />
              </div>
              {error && <p style={{fontSize:12,color:'#dc2626',background:'#fef2f2',padding:'8px 12px',borderRadius:8}}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{justifyContent:'center',padding:'10px 0'}}>
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          </div>
          <p style={{ textAlign:'center', fontSize:14, color:'#6b7280', marginTop:20 }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color:'#C4956A', fontWeight:600, textDecoration:'none' }}>Entrar</Link>
          </p>
        </div>
      </div>
      <div style={{ background:'#0a0a0a', display:'flex', justifyContent:'center', alignItems:'center', padding:'10px 0', height:72 }}>
        <img src="/valora.png" alt="Valora Business Technology" style={{ height:52, width:'auto', filter:'brightness(1.5) contrast(1.1)' }} />
      </div>
    </div>
  )
}
