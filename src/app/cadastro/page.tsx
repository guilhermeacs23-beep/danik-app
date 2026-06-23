'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function CadastroPage() {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    store: '',
  })
  const router = useRouter()

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)

    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.name.trim() } },
    })

    if (authErr) {
      setError('Erro ao criar conta: ' + authErr.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Create tenant (slug = url-safe from store name)
    const storeName = form.store.trim() || form.name.trim()
    const slug = storeName
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert({ name: storeName, slug })
      .select()
      .single()

    if (tenantErr) {
      setError('Erro ao configurar loja: ' + tenantErr.message)
      setLoading(false)
      return
    }

    // 3. Create profile linked to tenant
    const { error: profileErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        tenant_id: tenant.id,
        name: form.name.trim(),
        role: 'owner',
      })

    if (profileErr) {
      setError('Erro ao criar perfil: ' + profileErr.message)
      setLoading(false)
      return
    }

    setStep('success')
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5EDEB' }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Conta criada!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Verifique seu e-mail para confirmar a conta e depois entre.
          </p>
          <Link href="/login" className="btn btn-primary w-full justify-center py-2">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5EDEB' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="DANIK" width={180} height={75} className="mx-auto" priority />
          <p className="text-xs text-gray-400 mt-2 tracking-widest uppercase">Gestão de moda feminina</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8d8d4] shadow-sm p-6">
          <h2 className="text-base font-medium text-gray-800 mb-4">Criar conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="input"
                placeholder="Seu nome"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Nome da loja</label>
              <input
                type="text"
                value={form.store}
                onChange={e => set('store', e.target.value)}
                className="input"
                placeholder="Ex: DANIK Moda"
              />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="input"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="label">Senha *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="label">Confirmar senha *</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                className="input"
                placeholder="Repita a senha"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>

        <div className="flex justify-center mt-6 opacity-60 hover:opacity-90 transition-opacity">
          <Image src="/valora.png" alt="Valora Business Technology" width={100} height={40} style={{objectFit:'contain'}} />
        </div>
      </div>
    </div>
  )
}
