export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, TrendingDown } from 'lucide-react'
import Link from 'next/link'

export default async function EstoquePage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('v_stock_summary')
    .select('*')
    .eq('active', true)
    .order('name')

  const total = products?.length || 0
  const lowStock = products?.filter((p: any) => p.qty_in_stock <= p.min_stock && p.qty_in_stock > 0).length || 0
  const outOfStock = products?.filter((p: any) => p.qty_in_stock === 0).length || 0

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium">Estoque</h1>
          <p className="text-sm text-gray-500">{total} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/entrada-estoque" className="btn btn-primary">
            <Package size={14} /> Entrada de estoque
          </Link>
        </div>
      </div>

      {/* Alertas */}
      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex gap-3 mb-4">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12} /> {outOfStock} produto{outOfStock > 1 ? 's' : ''} esgotado{outOfStock > 1 ? 's' : ''}
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <TrendingDown size={12} /> {lowStock} produto{lowStock > 1 ? 's' : ''} com estoque baixo
            </div>
          )}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Custo</th>
              <th>Preço</th>
              <th>Margem</th>
              <th className="text-center">Estoque</th>
              <th className="text-center">Consign.</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p: any) => {
              const isOut = p.qty_in_stock === 0
              const isLow = p.qty_in_stock > 0 && p.qty_in_stock <= p.min_stock
              return (
                <tr key={p.id}>
                  <td className="text-gray-400 font-mono text-xs">{p.internal_code}</td>
                  <td>
                    <Link href={`/estoque/${p.id}`} className="font-medium hover:text-brand-600 transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td><span className="badge badge-purple">{p.category_name || '—'}</span></td>
                  <td>{formatCurrency(p.cost_price)}</td>
                  <td className="font-medium">{formatCurrency(p.sale_price)}</td>
                  <td>
                    <span className={`font-medium ${p.margin_pct >= 50 ? 'text-green-700' : p.margin_pct >= 33 ? 'text-amber-700' : 'text-red-600'}`}>
                      {p.margin_pct?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center font-medium">{p.qty_in_stock}</td>
                  <td className="text-center text-gray-500">{p.qty_in_suitcase}</td>
                  <td>
                    {isOut && <span className="badge badge-red">Esgotado</span>}
                    {isLow && <span className="badge badge-amber">Baixo</span>}
                    {!isOut && !isLow && <span className="badge badge-green">OK</span>}
                  </td>
                </tr>
              )
            })}
            {!products?.length && (
              <tr><td colSpan={9} className="text-center text-gray-400 py-8">Nenhum produto cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
