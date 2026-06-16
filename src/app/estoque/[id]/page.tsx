export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

const ITEM_STATUS_BADGE: Record<string, string> = {
  in_stock: 'badge-green', in_suitcase: 'badge-blue',
  sold: 'badge-gray', returned: 'badge-amber', lost: 'badge-red', damaged: 'badge-red',
}
const ITEM_STATUS_LABEL: Record<string, string> = {
  in_stock: 'Em estoque', in_suitcase: 'Na maleta',
  sold: 'Vendida', returned: 'Devolvida', lost: 'Extraviada', damaged: 'Danificada',
}

export default async function EstoqueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product }, { data: items }] = await Promise.all([
    supabase.from('v_stock_summary').select('*').eq('id', id).single(),
    supabase.from('product_items').select('*').eq('product_id', id).eq('active', true).order('created_at'),
  ])

  if (!product) return notFound()

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/estoque" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-medium">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-mono text-gray-400">{product.internal_code}</span>
            {product.barcode && <span className="text-xs text-gray-400">EAN: {product.barcode}</span>}
            {product.category_name && <span className="badge badge-purple">{product.category_name}</span>}
          </div>
        </div>
      </div>

      {/* KPIs do produto */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Custo</span>
          <span className="text-xl font-semibold">{formatCurrency(product.cost_price)}</span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Preço de venda</span>
          <span className="text-xl font-semibold">{formatCurrency(product.sale_price)}</span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Margem</span>
          <span className={`text-xl font-semibold ${product.margin_pct >= 50 ? 'text-green-700' : product.margin_pct >= 33 ? 'text-amber-700' : 'text-red-600'}`}>
            {Number(product.margin_pct).toFixed(1)}%
          </span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Markup</span>
          <span className="text-xl font-semibold">{Number(product.markup).toFixed(2)}×</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card text-center">
          <span className="text-xs text-gray-400">Em estoque</span>
          <span className="text-3xl font-bold text-green-700">{product.qty_in_stock}</span>
        </div>
        <div className="kpi-card text-center">
          <span className="text-xs text-gray-400">Nas maletas</span>
          <span className="text-3xl font-bold text-blue-600">{product.qty_in_suitcase}</span>
        </div>
        <div className="kpi-card text-center">
          <span className="text-xs text-gray-400">Vendidas</span>
          <span className="text-3xl font-bold text-gray-600">{product.qty_sold}</span>
        </div>
      </div>

      {/* Unidades físicas */}
      <h2 className="text-sm font-medium mb-3">Unidades individuais ({items?.length || 0} peças)</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código peça</th>
              <th>Tamanho</th>
              <th>Cor</th>
              <th>Comprado em</th>
              <th>Custo unitário</th>
              <th>Status</th>
              <th>Rastrear</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any) => (
              <tr key={item.id}>
                <td className="font-mono text-xs font-medium">{item.item_code}</td>
                <td className="text-gray-500">{item.size || '—'}</td>
                <td className="text-gray-500">{item.color || '—'}</td>
                <td className="text-gray-400">{item.purchase_date ? formatDate(item.purchase_date) : '—'}</td>
                <td>{item.purchase_cost ? formatCurrency(item.purchase_cost) : formatCurrency(product.cost_price)}</td>
                <td>
                  <span className={`badge ${ITEM_STATUS_BADGE[item.status] || 'badge-gray'}`}>
                    {ITEM_STATUS_LABEL[item.status] || item.status}
                  </span>
                </td>
                <td>
                  <Link href={`/rastreio?q=${item.item_code}`} className="text-xs text-brand-600 hover:underline">
                    Ver histórico →
                  </Link>
                </td>
              </tr>
            ))}
            {!items?.length && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-8">
                  <Package size={24} className="mx-auto mb-2 opacity-40" />
                  Nenhuma unidade cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {product.notes && (
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-medium">Observações:</span> {product.notes}
        </div>
      )}
    </div>
  )
}
