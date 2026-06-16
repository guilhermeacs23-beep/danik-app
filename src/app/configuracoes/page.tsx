'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Save } from 'lucide-react'

export default function ConfiguracoesPage() {
  const supabase = createClient()

  const [tenantId, setTenantId]     = useState('')
  const [name, setName]             = useState('')
  const [cnpj, setCnpj]             = useState('')
  const [phone, setPhone]           = useState('')
  const [email, setEmail]           = useState('')
  const [costPerKm, setCostPerKm]   = useState('0.60')
  const [minMargin, setMinMargin]   = useState('33')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    supabase.from('tenants').select('*').limit(1).single().then(({ data }) => {
      if (!data) return
      setTenantId(data.id)
      setName(data.name || '')
      setCnpj(data.cnpj || '')
      setPhone(data.phone || '')
      setEmail(data.email || '')
      setCostPerKm(data.settings?.cost_per_km?.toString() || '0.60')
      setMinMargin(data.settings?.min_margin_pct?.toString() || '33')
      setLoading(false)
    })
  }, [])

  async function save() {
    if (!tenantId) return
    setSaving(true)
    await supabase.from('tenants').update({
      name,
      cnpj: cnpj || null,
      phone: phone || null,
      email: email || null,
      settings: {
        cost_per_km: parseFloat(costPerKm) || 0.60,
        min_margin_pct: parseFloat(minMargin) || 33,
      },
    }).eq('id', tenantId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-6 text-gray-400">Carregando…</div>

  return (
    <div className="p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={18} className="text-gray-400" />
        <h1 className="text-lg font-medium">Configurações</h1>
      </div>

      {/* Dados da loja */}
      <div className="card mb-6">
        <h2 className="text-sm font-medium mb-4">Dados da loja</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Nome da loja</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: DANIK Moda" />
          </div>
          <div>
            <label className="label">CNPJ</label>
            <input className="input" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone / WhatsApp</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Configurações operacionais */}
      <div className="card mb-6">
        <h2 className="text-sm font-medium mb-4">Configurações operacionais</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Custo por km (R$)</label>
            <input type="number" step="0.01" min="0" className="input" value={costPerKm}
              onChange={e => setCostPerKm(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">
              Usado nos cálculos de deslocamento. Padrão INSS 2024: R$ 0,60/km
            </p>
          </div>
          <div>
            <label className="label">Margem mínima aceitável (%)</label>
            <input type="number" step="1" min="0" max="100" className="input" value={minMargin}
              onChange={e => setMinMargin(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">
              Produtos abaixo dessa margem serão sinalizados em vermelho no estoque
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        {saved && <span className="text-sm text-green-600">✓ Salvo com sucesso</span>}
        <button onClick={save} disabled={saving} className="btn btn-primary">
          <Save size={14} />
          {saving ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}
