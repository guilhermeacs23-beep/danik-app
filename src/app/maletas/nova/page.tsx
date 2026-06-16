'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSuitcaseCode, formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, X, Package, GripVertical, ShoppingBag } from 'lucide-react'

export default function NovaMaletaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [customers, setCustomers]   = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [filtered, setFiltered]     = useState<any[]>([])
  const [search, setSearch]         = useState('')

  const [customerId, setCustomerId] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [notes, setNotes]           = useState('')
  const [items, setItems]           = useState<any[]>([])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropOver, setDropOver]     = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const [{ data: cust }, { data: stock }] = await Promise.all([
      supabase.from('customers').select('id, name').eq('status', 'active').order('name'),
      supabase
        .from('product_items')
        .select('id, item_code, size, color, status, products(id, name, sale_price, internal_code)')
        .eq('status', 'in_stock')
        .order('id', { ascending: false })
        .limit(200),
    ])
    setCustomers(cust || [])
    setStockItems(stock || [])
    setFiltered(stock || [])
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    const addedIds = new Set(items.map((i: any) => i.id))
    setFiltered(
      stockItems.filter((i: any) =>
        !addedIds.has(i.id) &&
        (!q ||
          i.products?.name?.toLowerCase().includes(q) ||
          i.item_code?.toLowerCase().includes(q) ||
          i.color?.toLowerCase().includes(q) ||
          i.size?.toLowerCase().includes(q))
      )
    )
  }, [search, stockItems, items])

  function addItem(item: any) {
    if (items.find((i: any) => i.id === item.id)) return
    setItems(prev => [...prev, item])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter((i: any) => i.id !== id))
  }

  function onDragStart(e: React.DragEvent, item: any) {
    setDraggingId(item.id)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('itemId', item.id)
  }

  function onDragEnd() { setDraggingId(null) }

  function onDropZoneDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropOver(true)
  }

  function onDropZoneDragLeave() { setDropOver(false) }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDropOver(false)
    const id = e.dataTransfer.getData('itemId')
    const item = stockItems.find((i: any) => i.id === id)
    if (item) addItem(item)
  }

  async function save() {
    if (!customerId || !expectedReturn) { setError('Selecione cliente e data de retorno'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Não autenticado'); setSaving(false); return }
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) { setError('Sem tenant'); setSaving(false); return }
    const tenantId = profile.tenant_id

    const code = generateSuitcaseCode(Date.now() % 10000)
    const totalValue = items.reduce((a: number, i: any) => a + (i.products?.sale_price || 0), 0)

    const { data: suitcase, error: err } = await supabase.from('suitcases').insert({
      tenant_id: tenantId,
      code,
      customer_id: customerId || null,
      expected_return: expectedReturn,
      total_items: items.length,
      total_value: totalValue,
      notes: notes || null,
    }).select().single()

    if (err || !suitcase) { setError('Erro ao criar maleta: ' + (err?.message || '')); setSaving(false); return }

    if (items.length > 0) {
      await supabase.from('suitcase_items').insert(
        items.map((i: any) => ({
          tenant_id: tenantId,
          suitcase_id: suitcase.id,
          item_id: i.id,
          consignment_price: i.products?.sale_price || 0,
          status: 'with_customer',
        }))
      )
      await supabase.from('product_items').update({
        status: 'in_suitcase',
        current_suitcase_id: suitcase.id,
        current_customer_id: customerId || null,
      }).in('id', items.map((i: any) => i.id))
    }

    router.push(`/maletas/${suitcase.id}`)
  }

  const totalValue = items.reduce((a: number, i: any) => a + (i.products?.sale_price || 0), 0)

  return (
    <div className="flex h-full overflow-hidden">

      {/* PAINEL ESQUERDO: maleta */}
      <div className="flex flex-col w-[55%] border-r border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Link href="/maletas" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <h1 className="text-base font-medium">Nova maleta</h1>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Selecionar cliente...</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data de retorno</label>
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

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Peças na maleta</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{items.length} peça{items.length !== 1 ? 's' : ''}</span>
              <span className="font-semibold text-brand-700">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          <div
            ref={dropZoneRef}
            onDragOver={onDropZoneDragOver}
            onDragLeave={onDropZoneDragLeave}
            onDrop={onDrop}
            className={`flex-1 overflow-y-auto rounded-xl border-2 border-dashed transition-colors ${dropOver ? 'border-brand-400 bg-brand-50' : items.length ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none py-12">
                <ShoppingBag size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Arraste peças do estoque</p>
                <p className="text-xs mt-1">ou clique no + ao lado de cada item</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2 shadow-sm">
                    <Package size={13} className="text-brand-400 shrink-0" />
                    <span className="text-xs font-mono text-gray-400 shrink-0 w-24 truncate">{item.item_code}</span>
                    <span className="text-sm font-medium flex-1 truncate">{item.products?.name}</span>
                    {item.size && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.size}</span>}
                    {item.color && <span className="text-xs text-gray-400">{item.color}</span>}
                    <span className="text-xs font-semibold text-brand-700 shrink-0">{formatCurrency(item.products?.sale_price || 0)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 ml-1">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3 justify-between items-center">
            <div className="text-sm">
              {items.length > 0 && (
                <span className="text-gray-500">Total: <strong className="text-brand-700">{formatCurrency(totalValue)}</strong> · {items.length} peça{items.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex gap-3">
              <Link href="/maletas" className="btn">Cancelar</Link>
              <button
                onClick={save}
                disabled={saving || !customerId || !expectedReturn}
                className="btn btn-primary disabled:opacity-50"
              >
                {saving ? 'Criando...' : `Criar maleta com ${items.length} peça${items.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO: estoque */}
      <div className="flex flex-col w-[45%] bg-gray-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-white">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Estoque disponível</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 text-sm"
              placeholder="Buscar por nome, código, cor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{filtered.length} peça{filtered.length !== 1 ? 's' : ''} disponível{filtered.length !== 1 ? 'is' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Package size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{search ? 'Nenhuma peça encontrada' : 'Nenhuma peça em estoque'}</p>
            </div>
          )}
          {filtered.map((item: any) => (
            <div
              key={item.id}
              draggable
              onDragStart={e => onDragStart(e, item)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2 cursor-grab active:cursor-grabbing select-none transition-all hover:border-brand-300 hover:shadow-sm ${draggingId === item.id ? 'opacity-40 scale-95' : ''}`}
            >
              <GripVertical size={12} className="text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.products?.name}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{item.item_code}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.size && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.size}</span>}
                {item.color && <span className="text-xs text-gray-400">{item.color}</span>}
                <span className="text-xs font-semibold text-brand-700">{formatCurrency(item.products?.sale_price || 0)}</span>
                <button
                  onClick={() => addItem(item)}
                  className="ml-1 w-6 h-6 rounded-full bg-brand-100 text-brand-700 hover:bg-brand-400 hover:text-white flex items-center justify-center transition-colors font-bold text-sm"
                  title="Adicionar à maleta"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
