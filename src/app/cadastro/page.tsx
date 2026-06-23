'use client'
import { useState } from 'react'
import Link from 'next/link'

const LeftPanel = () => (
  <div style={{position:'absolute',left:0,top:0,bottom:0,width:'28%',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
    <svg viewBox="0 0 300 580" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="460" width="8" height="80" rx="3" fill="#8B5E3C" opacity="0.7"/>
      <rect x="218" y="460" width="8" height="80" rx="3" fill="#8B5E3C" opacity="0.7"/>
      <rect x="25" y="110" width="208" height="10" rx="5" fill="#8B5E3C" opacity="0.8"/>
      <rect x="30" y="110" width="8" height="360" rx="3" fill="#8B5E3C" opacity="0.6"/>
      <rect x="218" y="110" width="8" height="360" rx="3" fill="#8B5E3C" opacity="0.6"/>
      <path d="M128 60 Q128 40 135 38 Q145 36 145 46 Q145 58 128 66" fill="none" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" opacity="0.8"/>
      <rect x="50" y="60" width="160" height="8" rx="4" fill="#8B5E3C" opacity="0.7"/>
      <path d="M95 120 Q95 108 102 106 Q112 103 112 115 Q112 126 95 132" fill="none" stroke="#C0392B" strokeWidth="4" strokeLinecap="round"/>
      <path d="M78 132 L68 280 Q65 300 95 305 Q125 310 128 285 L118 132 Z" fill="#C0392B" opacity="0.75"/>
      <path d="M78 132 L55 200 L72 210 L85 155 Z" fill="#C0392B" opacity="0.6"/>
      <path d="M118 132 L141 200 L124 210 L111 155 Z" fill="#C0392B" opacity="0.6"/>
      <path d="M70 185 Q98 172 126 185" fill="none" stroke="#922B21" strokeWidth="2"/>
      <path d="M65 300 Q98 320 131 300 Q125 330 98 335 Q71 330 65 300 Z" fill="#C0392B" opacity="0.5"/>
      <path d="M158 120 Q158 108 165 106 Q175 103 175 115 Q175 126 158 132" fill="none" stroke="#8B5E3C" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
      <path d="M143 132 L133 270 Q130 290 160 294 Q190 298 193 272 L183 132 Z" fill="#C4956A" opacity="0.55"/>
      <path d="M143 132 L120 195 L137 204 L148 152 Z" fill="#C4956A" opacity="0.45"/>
      <path d="M183 132 L206 195 L189 204 L178 152 Z" fill="#C4956A" opacity="0.45"/>
      <path d="M135 178 Q163 167 191 178" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
      <rect x="40" y="470" width="90" height="62" rx="8" fill="#5D4037" opacity="0.7"/>
      <rect x="40" y="470" width="90" height="62" rx="8" fill="none" stroke="#8B5E3C" strokeWidth="2" opacity="0.5"/>
      <path d="M62 470 Q62 452 85 452 Q108 452 108 470" fill="none" stroke="#5D4037" strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
      <rect x="77" y="498" width="16" height="8" rx="2" fill="#C4956A" opacity="0.8"/>
      <line x1="40" y1="492" x2="130" y2="492" stroke="#8B5E3C" strokeWidth="2" opacity="0.4"/>
      <rect x="110" y="478" width="20" height="14" rx="2" fill="#C0392B" opacity="0.6"/>
      <circle cx="20" cy="90" r="4" fill="#C4956A" opacity="0.5"/>
      <circle cx="15" cy="380" r="5" fill="#C4956A" opacity="0.3"/>
    </svg>
  </div>
)

const RightPanel = () => (
  <div style={{position:'absolute',right:0,top:0,bottom:0,width:'28%',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
    <svg viewBox="0 0 300 580" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="155" cy="55" r="26" fill="#C4956A" opacity="0.45"/>
      <path d="M130 48 Q128 20 155 18 Q182 20 180 48 Q175 30 155 28 Q135 30 130 48 Z" fill="#8B5E3C" opacity="0.55"/>
      <rect x="149" y="79" width="12" height="18" rx="4" fill="#C4956A" opacity="0.4"/>
      <path d="M115 97 Q115 88 155 88 Q195 88 195 97 L205 180 L105 180 Z" fill="#C4956A" opacity="0.38"/>
      <path d="M115 100 L88 175 L100 180 L120 115 Z" fill="#C4956A" opacity="0.3"/>
      <path d="M195 100 L222 175 L210 180 L190 115 Z" fill="#C4956A" opacity="0.3"/>
      <path d="M105 180 L72 380 Q70 405 155 408 Q240 405 238 380 L205 180 Z" fill="#C0392B" opacity="0.45"/>
      <rect x="108" y="178" width="97" height="12" rx="4" fill="#5D4037" opacity="0.55"/>
      <rect x="149" y="180" width="12" height="8" rx="2" fill="#C4956A" opacity="0.8"/>
      <path d="M90 280 Q155 260 220 280" fill="none" stroke="#922B21" strokeWidth="2" opacity="0.4"/>
      <rect x="20" y="200" width="65" height="8" rx="3" fill="#8B5E3C" opacity="0.6"/>
      <rect x="24" y="208" width="4" height="55" rx="2" fill="#8B5E3C" opacity="0.5"/>
      <rect x="77" y="208" width="4" height="55" rx="2" fill="#8B5E3C" opacity="0.5"/>
      <rect x="28" y="240" width="18" height="22" rx="2" fill="#C0392B" opacity="0.55"/>
      <rect x="48" y="243" width="18" height="19" rx="2" fill="#C4956A" opacity="0.55"/>
      <rect x="66" y="241" width="14" height="21" rx="2" fill="#8B5E3C" opacity="0.45"/>
      <rect x="20" y="270" width="65" height="8" rx="3" fill="#8B5E3C" opacity="0.6"/>
      <path d="M28 278 L28 315 Q28 320 45 320 Q62 320 62 315 L62 278 Z" fill="#5D4037" opacity="0.5"/>
      <path d="M36 278 Q36 265 45 265 Q54 265 54 278" fill="none" stroke="#5D4037" strokeWidth="3" opacity="0.55"/>
      <line x1="28" y1="293" x2="62" y2="293" stroke="#C4956A" strokeWidth="1.5" opacity="0.5"/>
      <rect x="20" y="330" width="65" height="8" rx="3" fill="#8B5E3C" opacity="0.6"/>
      <rect x="28" y="360" width="22" height="26" rx="3" fill="#C4956A" opacity="0.45"/>
      <rect x="52" y="363" width="22" height="23" rx="3" fill="#C0392B" opacity="0.4"/>
      <path d="M20 420 Q20 440 40 440 L55 440 L55 430 L45 430 Q35 430 33 420 Z" fill="#5D4037" opacity="0.5"/>
      <rect x="50" y="415" width="6" height="26" rx="2" fill="#5D4037" opacity="0.5"/>
      <circle cx="270" cy="80" r="5" fill="#C0392B" opacity="0.3"/>
      <circle cx="275" cy="340" r="6" fill="#C4956A" opacity="0.25"/>
    </svg>
  </div>
)

export default function CadastroPage() {
  const [step, setStep] = useState<'form'|'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({name:'',email:'',password:'',confirm:''})
  const set = (f:string,v:string) => setForm(p=>({...p,[f]:v}))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    if (form.password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    const res = await fetch('/api/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:form.name.trim(),email:form.email.trim(),password:form.password}),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return }
    setStep('success'); setLoading(false)
  }

  const Footer = () => (
    <div style={{background:'#0a0a0a',display:'flex',justifyContent:'center',alignItems:'center',padding:'10px 0',height:72}}>
      <img src="/valora.png" alt="Valora Business Technology" style={{height:52,width:'auto',filter:'brightness(1.5) contrast(1.1)'}} />
    </div>
  )

  if (step === 'success') return (
    <div style={{minHeight:'100vh',background:'#F0E4E4',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',paddingBottom:80}}>
        <LeftPanel /><RightPanel />
        <div style={{width:'100%',maxWidth:400,zIndex:1,padding:'0 16px',textAlign:'center'}}>
          <img src="/logo.png" alt="DANIK" style={{width:200,height:'auto',margin:'0 auto 24px'}} />
          <div style={{background:'white',borderRadius:16,border:'1px solid #e8d8d4',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',padding:32}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <h2 style={{fontSize:18,fontWeight:600,color:'#1f2937',marginBottom:8}}>Conta criada!</h2>
            <p style={{fontSize:14,color:'#6b7280',marginBottom:24}}>Tudo pronto. Faça login para acessar o sistema.</p>
            <Link href="/login" className="btn btn-primary" style={{display:'block',textAlign:'center',padding:'10px 0'}}>Ir para o login</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F0E4E4',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',paddingBottom:80}}>
        <LeftPanel /><RightPanel />
        <div style={{width:'100%',maxWidth:400,zIndex:1,padding:'0 16px'}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <img src="/logo.png" alt="DANIK" style={{width:240,height:'auto',margin:'0 auto'}} />
          </div>
          <div style={{background:'white',borderRadius:16,border:'1px solid #e8d8d4',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',padding:28}}>
            <h2 style={{fontSize:16,fontWeight:600,color:'#1f2937',marginBottom:20}}>Criar conta</h2>
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
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
          <p style={{textAlign:'center',fontSize:14,color:'#6b7280',marginTop:20}}>
            Já tem conta?{' '}
            <Link href="/login" style={{color:'#C4956A',fontWeight:600,textDecoration:'none'}}>Entrar</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
