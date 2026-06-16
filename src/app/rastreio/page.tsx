'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Package, ArrowRight } from 'lucide-react'

const EVENT_LABEL: Record<string, string> = {
  purchased:         'Comprado',
  stocked:           'Entrou no estoque',
  suitcase_out:      'Saiu em maleta',
  suitcase_returned: 'Voltou da maleta',
  sold:              'Vendido',
  lost:              'Extraviado',
  damaged:           'Danificado',
  transferred:       'Transferido',
  adjusted:          'Ajuste',
}
const EVENT_COLOR: Record<string, string> = {
  purchased:         'bg-gray-400',
  stocked:           'bg-blue-400',
  suitcase_out:      'bg-purple-400',
  suitcase_returned: 'bg-amber-400',
  sold:              'bg-green-500',
  lost:              'bg-red-500',
  damaged:           'bg-red-400',
  transferred:       'bg-blue-300',
  adjusted:          'bg-gray-300',
}
const STATUS_BADGE: Record<string, string> = {
  in_stock:    'badge-green',
  in_suitcase: 'badge-blue',
  sold:        'badge-gray',
  returned:    'badge-amber',
  lost:        'badge-red',
  damaged:     'badge-red',
}
const STATUS_LABEL: Record<string, string> = {
  in_stock:    'Em estoque',
  in_suitcase: 'Na maleta',
  sold:        'Vendida',
  returned:    'Devolvida',
  lost:        'Extraviada',
  damaged:     'Danificada',
}

export default function RastreioPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [item, setItem] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [notFound, setNotFound] = useState(false)

  const supabase = createClient()

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setNotFound(false)
    setItem(null)
    setHistory([])

    const { data } = await supabase
      .from('v_item_trace')
      .select('*')
      .eq('item_code', query.trim().toUpperCase())

    if (!data || data.length === 0) {
      setNotFound(true)
    } else {
      const first = data[0]
      setItem({
        item_id: first.item_id,
        item_code: first.item_code,
        current_status: first.current_status,
        product_name: first.product_name,
        internal_code: first.internal_code,
        cost_price: first.cost_price,
        sale_price: first.sale_price,
      })
      setHistory(data)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-lg font-medium">Rastreio de Peça</h1>
        <p className="text-sm text-gray-500">Informe o código da peça para ver o histórico completo</p>
      </div>

      {/* Busca */}
      <div className="flex gap-2 mb-8">
        <input
          className="input flex-1 font-mono uppercase"
          placeholder="Ex: DNK-2024-0001 ou código de barras"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button
          className="btn btn-primary px-5"
          onClick={search}
          disabled={loading}
        >
          <Search size={14} />
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {notFound && (
        <div className="text-center py-12 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Peça não encontrada</p>
          <p className="text-sm mt-1">Verifique o código e tente novamente</p>
        </div>
      )}

      {item && (
        <div>
          {/* Info da peça */}
          <div className="card mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-mono mb-1">{item.item_code}</p>
                <h2 className="text-base font-semibold">{item.product_name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Ref: {item.internal_code}</p>
              </div>
              <span className={`badge ${STATUS_BADGE[item.current_status] || 'badge-gray'}`}>
                {STATUS_LABEL[item.current_status] || item.current_status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Custo</p>
                <p className="text-sm font-medium">{formatCurrency(item.cost_price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Preço de venda</p>
                <p className="text-sm font-medium">{formatCurrency(item.sale_price)}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <h3 className="text-sm font-medium mb-4">Histórico completo</h3>
          <div className="relative pl-6">
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200" />
            {history.map((h: any, idx: number) => (
              <div key={idx} className="relative mb-5">
                <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full ring-2 ring-white ${EVENT_COLOR[h.event_type] || 'bg-gray-400'}`} />
                <div className="card py-3 px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{EVENT_LABEL[h.event_type] || h.event_type}</span>
                    <span className="text-xs text-gray-400">{formatDate(h.event_at)}</span>
                  </div>
                  {h.customer_name && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <ArrowRight size={10} />
                      {h.customer_name}
                    </div>
                  )}
                  {h.from_status && h.to_status && (
                    <p className="text-xs text-gray-400 mt-1">
                      {STATUS_LABEL[h.from_status] || h.from_status} → {STATUS_LABEL[h.to_status] || h.to_status}
                    </p>
                  )}
                  {h.notes && <p className="text-xs text-gray-500 mt-1 italic">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
