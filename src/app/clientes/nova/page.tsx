'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'

export default function NovaClientePage() {
  const supabase = createClient()
  const router = useRouter()

  const [name, setName]               = useState('')
  const [whatsapp, setWhatsapp]       = useState('')
  const [phone, setPhone]             = useState('')
  const [email, setEmail]             = useState('')
  const [address, setAddress]         = useState('')
  const [creditLimit, setCreditLimit] = useState('500')
  const [segment, setSegment]         = useState('new')
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  async function save() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true)
    setError('')

    const { data, error: err } = await supabase.from('customers').insert({
      name: name.trim(),
      whatsapp: whatsapp || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      credit_limit: parseFloat(creditLimit) || 500,
      segment,
      notes: notes || null,
      status: 'active',
    }).select().single()

    if (err) {
      setError('Erro ao cadastrar: ' + err.message)
      setSaving(false)
      return
    }

    router.push(`/clientes/${data.id}`)
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clientes" className="text-brand-400 hover:text-brand-600">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-brand-900 dark:text-brand-100">Nova cliente</h1>
      </div>

      <div className="card space-y-4">
        {/* Nome */}
        <div>
          <label className="label">Nome completo *</label>
          <input className="input" placeholder="Ex: Maria Silva"
            value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        {/* Contato */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" placeholder="(00) 00000-0000"
              value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" placeholder="(00) 0000-0000"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" placeholder="cliente@email.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="label">Endereço</label>
          <input className="input" placeholder="Rua, número, bairro"
            value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        {/* Crédito e segmento */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Limite de crédito (R$)</label>
            <input type="number" min="0" step="50" className="input"
              value={creditLimit} onChange={e => setCreditLimit(e.target.value)} />
          </div>
          <div>
            <label className="label">Segmento</label>
            <select className="input" value={segment} onChange={e => setSegment(e.target.value)}>
              <option value="new">Nova</option>
              <option value="regular">Regular</option>
              <option value="vip">VIP</option>
              <option value="at_risk">Em risco</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Observações</label>
          <textarea className="input" rows={3} placeholder="Preferências, anotações importantes…"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/clientes" className="btn flex-1 justify-center">Cancelar</Link>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="btn btn-primary flex-1 justify-center"
          >
            <UserPlus size={14} />
            {saving ? 'Cadastrando…' : 'Cadastrar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
