'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Plus, Car, DollarSign, Route } from 'lucide-react'

const TRIP_LABEL: Record<string, string> = {
  delivery: 'Entrega',
  pickup: 'Busca',
  delivery_pickup: 'Entrega + Busca',
}

export default function DeslocamentosPage() {
  const supabase = createClient()

  const [trips, setTrips]           = useState<any[]>([])
  const [customers, setCustomers]   = useState<any[]>([])
  const [suitcases, setSuitcases]   = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  // form
  const [customerId, setCustomerId] = useState('')
  const [suitcaseId, setSuitcaseId] = useState('')
  const [tripType, setTripType]     = useState('delivery')
  const [distanceKm, setDistanceKm] = useState('')
  const [costPerKm, setCostPerKm]   = useState(0.60)
  const [tripDate, setTripDate]     = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes]           = useState('')
  const [showForm, setShowForm]     = useState(false)

  const totalCost = parseFloat(distanceKm || '0') * costPerKm

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: t }, { data: c }, { data: s }, { data: ten }] = await Promise.all([
      supabase.from('trip_logs').select('*, customers(name, whatsapp), suitcases(code)').order('trip_date', { ascending: false }).limit(100),
      supabase.from('customers').select('id, name').eq('status', 'active').order('name'),
      supabase.from('suitcases').select('id, code, customers(name)').in('status', ['open', 'overdue']).order('code'),
      supabase.from('tenants').select('settings').limit(1).single(),
    ])
    setTrips(t || [])
    setCustomers(c || [])
    setSuitcases(s || [])
    if (ten?.settings?.cost_per_km) setCostPerKm(Number(ten.settings.cost_per_km))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!distanceKm || !customerId) return
    setSaving(true)
    await supabase.from('trip_logs').insert({
      customer_id: customerId,
      suitcase_id: suitcaseId || null,
      trip_type: tripType,
      distance_km: parseFloat(distanceKm),
      cost_per_km: costPerKm,
      trip_date: tripDate,
      notes: notes || null,
    })
    setDistanceKm(''); setNotes(''); setCustomerId(''); setSuitcaseId('')
    setShowForm(false)
    await load()
    setSaving(false)
  }

  // KPIs do mês atual
  const now = new Date()
  const thisMonth = trips.filter(t => {
    const d = new Date(t.trip_date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalKm   = thisMonth.reduce((a, t) => a + (t.distance_km || 0), 0)
  const totalCostMonth = thisMonth.reduce((a, t) => a + (t.total_cost || 0), 0)
  const avgCost   = thisMonth.length ? totalCostMonth / thisMonth.length : 0

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium">Deslocamentos</h1>
          <p className="text-sm text-gray-500">Controle de km e custo das entregas de maleta</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
          <Plus size={14} /> Registrar viagem
        </button>
      </div>

      {/* KPIs do mês */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Route size={14} /><span className="text-xs">Km este mês</span></div>
          <span className="text-2xl font-semibold">{totalKm.toFixed(1)} km</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><DollarSign size={14} /><span className="text-xs">Custo este mês</span></div>
          <span className="text-2xl font-semibold text-red-600">{formatCurrency(totalCostMonth)}</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Car size={14} /><span className="text-xs">Custo médio por viagem</span></div>
          <span className="text-2xl font-semibold text-amber-600">{formatCurrency(avgCost)}</span>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-sm font-medium mb-4">Nova viagem</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente</label>
              <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Selecionar cliente…</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Maleta (opcional)</label>
              <select className="input" value={suitcaseId} onChange={e => setSuitcaseId(e.target.value)}>
                <option value="">Sem maleta vinculada</option>
                {suitcases.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.code} — {s.customers?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={tripType} onChange={e => setTripType(e.target.value)}>
                <option value="delivery">Entrega</option>
                <option value="pickup">Busca</option>
                <option value="delivery_pickup">Entrega + Busca (ida e volta)</option>
              </select>
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={tripDate} onChange={e => setTripDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Distância (km)</label>
              <input type="number" step="0.1" min="0" className="input" placeholder="Ex: 12.5"
                value={distanceKm} onChange={e => setDistanceKm(e.target.value)} />
            </div>
            <div>
              <label className="label">Custo por km (R$)</label>
              <input type="number" step="0.01" min="0" className="input"
                value={costPerKm} onChange={e => setCostPerKm(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Preview de custo */}
          {parseFloat(distanceKm || '0') > 0 && (
            <div className="mt-4 flex items-center gap-4 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
              <MapPin size={16} className="text-brand-600" />
              <div className="flex-1">
                <p className="text-sm text-brand-800">
                  <strong>{parseFloat(distanceKm).toFixed(1)} km</strong> × R$ {costPerKm.toFixed(2)}/km
                </p>
              </div>
              <p className="text-lg font-bold text-brand-700">{formatCurrency(totalCost)}</p>
            </div>
          )}

          <div className="mt-4">
            <label className="label">Observações</label>
            <input className="input" placeholder="Ex: tráfego intenso, 2 clientes no mesmo roteiro…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-2 mt-4 justify-end">
            <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving || !customerId || !distanceKm}>
              {saving ? 'Salvando…' : 'Registrar viagem'}
            </button>
          </div>
        </div>
      )}

      {/* Tabela de viagens */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Maleta</th>
              <th>Tipo</th>
              <th className="text-right">Km</th>
              <th className="text-right">R$/km</th>
              <th className="text-right">Custo total</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-gray-400 py-8">Carregando…</td></tr>
            ) : trips.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-400 py-8">Nenhuma viagem registrada ainda.</td></tr>
            ) : trips.map((t: any) => (
              <tr key={t.id}>
                <td className="text-gray-500">{formatDate(t.trip_date)}</td>
                <td className="font-medium">{t.customers?.name || '—'}</td>
                <td className="text-gray-500 font-mono text-xs">{t.suitcases?.code || '—'}</td>
                <td><span className="badge badge-blue">{TRIP_LABEL[t.trip_type] || t.trip_type}</span></td>
                <td className="text-right font-medium">{Number(t.distance_km).toFixed(1)}</td>
                <td className="text-right text-gray-500">{formatCurrency(t.cost_per_km)}</td>
                <td className="text-right font-semibold text-red-700">{formatCurrency(t.total_cost)}</td>
                <td className="text-gray-400 text-xs">{t.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
          {trips.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td colSpan={4} className="text-xs text-gray-500">Total geral</td>
                <td className="text-right">{trips.reduce((a, t) => a + (t.distance_km || 0), 0).toFixed(1)}</td>
                <td></td>
                <td className="text-right text-red-700">{formatCurrency(trips.reduce((a, t) => a + (t.total_cost || 0), 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
