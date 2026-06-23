'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CadastroPage() {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const router = useRouter()

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    if (form.password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return }

    setStep('success')
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0E4E4' }}>
        <div className="w-full max-w-sm text-center">
          <img src="/logo.png" alt="DANIK" style={{ width: 180, height: 'auto', margin: '0 auto 24px' }} />
          <div className="bg-white rounded-2xl border border-[#e8d8d4] shadow-sm p-8">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Conta criada!</h2>
            <p className="text-sm text-gray-500 mb-6">Tudo pronto. Faça login para acessar o sistema.</p>
            <Link href="/login" className="btn btn-primary w-full justify-center py-2.5">
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0E4E4' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="DANIK" style={{ width: 200, height: 'auto', margin: '0 auto' }} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e8d8d4] shadow-sm p-6">
          <h2 className="text-base font-medium text-gray-800 mb-4">Criar conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo *</label>
              <input type="text" required autoFocus value={form.name}
                onChange={e => set('name', e.target.value)}
                className="input" placeholder="Seu nome" />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input type="email" required value={form.email}
                onChange={e => set('email', e.target.value)}
                className="input" placeholder="seu@email.com" />
            </div>
            <div>
              <label className="label">Senha *</label>
              <input type="password" required value={form.password}
                onChange={e => set('password', e.target.value)}
                className="input" placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="label">Confirmar senha *</label>
              <input type="password" required value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                className="input" placeholder="Repita a senha" />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">Entrar</Link>
        </p>

        <div style={{
          position:'fixed', bottom:0, left:0, right:0,
          background:'#111', display:'flex', justifyContent:'center',
          alignItems:'center', padding:'12px 0'
        }}>
          <img src="/valora.png" alt="Valora Business Technology" style={{height:36, width:'auto', opacity:0.9}} />
        </div>
      </div>
    </div>
  )
}
