'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSuitcaseCode } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, X } from 'lucide-react'

export default function NovaMaletaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [customers, setCustomers]   = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [notes, setNotes]           = useState('')
  const [items, setItems]           = useState<any[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('customers').select('id, name, whatsapp').eq('status', 'active').order('name')
    setCustomers(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function scanItem() {
    if (!barcodeInput.trim()) return
    const code = barcodeInput.trim().toUpperCase()
    if (items.find((i: any) => i.item_code === code)) {
      setError('Peça já adicionada')
      return
    }

    const { data } = await supabase
      .from('product_items')
      .select('id, item_code, size, color, status, products(name, sale_price, internal_code)')
      .eq('item_code', code)
      .eq('status', 'in_stock')
      .single()

    if (!data) {
      setError('Peça não encontrada ou não está em estoque')
    } else {
      setItems(prev => [...prev, data])
      setError('')
    }
    setBarcodeInput('')
  }

  async function save() {
    if (!customerId || !expectedReturn || items.length === 0) return
    setSaving(true)

    const code = generateSuitcaseCode()
    const totalValue = items.reduce((a: number, i: any) => a + (i.products?.sale_price || 0), 0)

    const { data: suitcase, error: err } = await supabase.from('suitcases').insert({
      code,
      customer_id: customerId,
      expected_return: expectedReturn,
      total_items: items.length,
      total_value: totalValue,
      notes: notes || null,
    }).select().single()

    if (err || !suitcase) { setError('Erro ao criar maleta'); setSaving(false); return }

    // Inserir itens
    await supabase.from('suitcase_items').insert(
      items.map((i: any) => ({
        suitcase_id: suitcase.id,
        item_id: i.id,
        consignment_price: i.products?.sale_price || 0,
        status: 'with_customer',
      }))
    )

    // Atualizar status das peças
    await supabase.from('product_items').update({
      status: 'in_suitcase',
      current_suitcase_id: suitcase.id,
      current_customer_id: customerId,
    }).in('id', items.map((i: any) => i.id))

    router.push(`/maletas/${suitcase.id}`)
  }

  const totalValue = items.reduce((a: number, i: any) => a + (i.products?.sale_price || 0), 0)

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/maletas" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-medium">Nova maleta</h1>
      </div>

      <div className="card mb-6">
        <h2 className="text-sm font-medium mb-4">Dados da maleta</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Cliente</label>
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Selecionar cliente…</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data de retorno prevista</label>
            <input type="date" className="input" value={expectedReturn}
              onChange={e => setExpectedReturn(e.target.value)}
              min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="label">Observações</label>
            <input className="input" placeholder="Opcional" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Scanner de peças */}
      <div className="card mb-6">
        <h2 className="text-sm font-medium mb-4">Peças na maleta</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="input flex-1 font-mono uppercase"
            placeholder="Código ou código de barras da peça"
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && scanItem()}
          />
          <button onClick={scanItem} className="btn btn-primary">
            <Search size={14} /> Adicionar
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item: any, idx: number) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-gray-400 w-32 shrink-0">{item.item_code}</span>
                <span className="text-sm font-medium flex-1">{item.products?.name}</span>
                {item.size && <span className="badge badge-gray">{item.size}</span>}
                {item.color && <span className="text-xs text-gray-500">{item.color}</span>}
                <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                  className="text-gray-300 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Bipe as peças para adicioná-las à maleta</p>
        )}

        {items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">{items.length} peça{items.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Link href="/maletas" className="btn">Cancelar</Link>
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={saving || !customerId || !expectedReturn || items.length === 0}
        >
          {saving ? 'Criando…' : `Criar maleta com ${items.length} peça${items.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
