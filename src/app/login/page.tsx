'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F0E4E4', display:'flex', flexDirection:'column' }}>
      {/* Main content */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', paddingBottom:80 }}>

        {/* LEFT illustration */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'28%', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <svg viewBox="0 0 280 500" width="100%" height="100%" style={{opacity:0.18}}>
            {/* Dress hanger */}
            <path d="M140 40 Q140 20 160 20 Q180 20 180 35 Q180 50 140 60 L60 140 Q40 150 40 170 L220 170 Q220 150 200 140 Z" fill="#8B5E3C" stroke="#8B5E3C" strokeWidth="2"/>
            {/* Dress body */}
            <path d="M60 170 L30 380 Q30 400 140 400 Q250 400 250 380 L220 170 Z" fill="#C4956A" opacity="0.6"/>
            {/* Waist detail */}
            <path d="M80 230 Q140 210 200 230" fill="none" stroke="#8B5E3C" strokeWidth="3"/>
            {/* Skirt flare lines */}
            <path d="M60 280 L30 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
            <path d="M100 270 L80 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
            <path d="M140 265 L140 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
            <path d="M180 270 L200 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
            <path d="M220 280 L250 400" fill="none" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
            {/* Stars */}
            <circle cx="40" cy="80" r="3" fill="#C4956A"/>
            <circle cx="240" cy="120" r="2" fill="#C4956A"/>
            <circle cx="30" cy="300" r="4" fill="#C4956A" opacity="0.4"/>
            <circle cx="255" cy="320" r="3" fill="#C4956A" opacity="0.4"/>
            <circle cx="20" cy="450" r="2" fill="#C4956A" opacity="0.3"/>
            {/* Handbag */}
            <rect x="170" y="340" width="80" height="55" rx="8" fill="#8B5E3C" opacity="0.5"/>
            <path d="M185 340 Q185 315 210 315 Q235 315 235 340" fill="none" stroke="#8B5E3C" strokeWidth="3" opacity="0.5"/>
            <line x1="170" y1="358" x2="250" y2="358" stroke="#C4956A" strokeWidth="1.5" opacity="0.5"/>
          </svg>
        </div>

        {/* RIGHT illustration */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'28%', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <svg viewBox="0 0 280 500" width="100%" height="100%" style={{opacity:0.18}}>
            {/* Blouse on hanger */}
            <path d="M140 30 Q140 15 155 15 Q170 15 170 28 Q170 40 140 48 L80 90 Q65 98 65 112 L215 112 Q215 98 200 90 Z" fill="#8B5E3C" strokeWidth="2"/>
            <path d="M65 112 L50 200 L230 200 L215 112 Z" fill="#C4956A" opacity="0.5"/>
            {/* Sleeve left */}
            <path d="M65 112 L30 180 L60 195 L80 130 Z" fill="#C4956A" opacity="0.4"/>
            {/* Sleeve right */}
            <path d="M215 112 L250 180 L220 195 L200 130 Z" fill="#C4956A" opacity="0.4"/>
            {/* Neckline detail */}
            <path d="M110 112 Q140 135 170 112" fill="none" stroke="#8B5E3C" strokeWidth="2"/>
            {/* Skirt */}
            <path d="M50 200 Q30 380 140 420 Q250 380 230 200 Z" fill="#D4A574" opacity="0.4"/>
            <path d="M80 260 Q140 245 200 260" fill="none" stroke="#8B5E3C" strokeWidth="2" opacity="0.4"/>
            {/* Dots pattern */}
            <circle cx="100" cy="300" r="3" fill="#8B5E3C" opacity="0.3"/>
            <circle cx="140" cy="310" r="3" fill="#8B5E3C" opacity="0.3"/>
            <circle cx="180" cy="300" r="3" fill="#8B5E3C" opacity="0.3"/>
            <circle cx="120" cy="340" r="3" fill="#8B5E3C" opacity="0.3"/>
            <circle cx="160" cy="345" r="3" fill="#8B5E3C" opacity="0.3"/>
            {/* Floating elements */}
            <circle cx="240" cy="60" r="4" fill="#C4956A" opacity="0.5"/>
            <circle cx="25" cy="150" r="3" fill="#C4956A" opacity="0.4"/>
            <circle cx="260" cy="420" r="5" fill="#C4956A" opacity="0.3"/>
            {/* Shoes */}
            <path d="M80 440 Q80 460 140 460 Q160 460 165 450 L155 440 Q140 448 80 440 Z" fill="#8B5E3C" opacity="0.4"/>
            <rect x="148" y="425" width="8" height="20" rx="2" fill="#8B5E3C" opacity="0.4"/>
          </svg>
        </div>

        {/* Center card */}
        <div style={{ width:'100%', maxWidth:400, zIndex:1, padding:'0 16px' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <img src="/logo.png" alt="DANIK" style={{ width:240, height:'auto', margin:'0 auto' }} />
          </div>

          <div style={{ background:'white', borderRadius:16, border:'1px solid #e8d8d4', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', padding:28 }}>
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label className="label">E-mail</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  className="input" placeholder="seu@email.com" required autoFocus />
              </div>
              <div>
                <label className="label">Senha</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  className="input" placeholder="••••••••" required />
              </div>
              {error && <p style={{fontSize:12,color:'#dc2626',background:'#fef2f2',padding:'8px 12px',borderRadius:8}}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{justifyContent:'center',padding:'10px 0'}}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', fontSize:14, color:'#6b7280', marginTop:20 }}>
            Novo por aqui?{' '}
            <Link href="/cadastro" style={{ color:'#C4956A', fontWeight:600, textDecoration:'none' }}>Criar conta</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:'#0a0a0a', display:'flex', justifyContent:'center', alignItems:'center', padding:'10px 0', height:72 }}>
        <img src="/valora.png" alt="Valora Business Technology"
          style={{ height:52, width:'auto', filter:'brightness(1.5) contrast(1.1)' }} />
      </div>
    </div>
  )
}
