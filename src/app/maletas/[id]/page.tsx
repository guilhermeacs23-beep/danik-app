export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  with_customer: 'badge-blue', sold: 'badge-green', returned: 'badge-amber', lost: 'badge-red',
}
const STATUS_LABEL: Record<string, string> = {
  with_customer: 'Com a cliente', sold: 'Vendida', returned: 'Devolvida', lost: 'Extraviada',
}
const SUIT_BADGE: Record<string, string> = {
  open: 'badge-blue', overdue: 'badge-red', partial_return: 'badge-amber', closed: 'badge-green',
}
const SUIT_LABEL: Record<string, string> = {
  open: 'Aberta', overdue: 'Em atraso', partial_return: 'Retorno parcial', closed: 'Fechada',
}

export default async function MaletaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: suitcase }, { data: items }] = await Promise.all([
    supabase.from('suitcases').select('*, customers(name, whatsapp, phone)').eq('id', id).single(),
    supabase.from('suitcase_items').select(`
      *, product_items(item_code, size, color, status,
        products(name, internal_code, sale_price, cost_price))
    `).eq('suitcase_id', id).order('created_at'),
  ])

  if (!suitcase) return notFound()

  const sold     = items?.filter((i: any) => i.status === 'sold').length || 0
  const returned = items?.filter((i: any) => i.status === 'returned').length || 0
  const active   = items?.filter((i: any) => i.status === 'with_customer').length || 0

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/maletas" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium font-mono">{suitcase.code}</h1>
            <span className={`badge ${SUIT_BADGE[suitcase.status]}`}>{SUIT_LABEL[suitcase.status]}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {suitcase.customers?.name} · {suitcase.customers?.whatsapp || suitcase.customers?.phone || 'sem telefone'}
          </p>
        </div>
        {(suitcase.status === 'open' || suitcase.status === 'overdue') && active > 0 && (
          <Link href={`/maletas/${id}/retorno`} className="btn btn-primary text-sm">
            ↩ Registrar retorno
          </Link>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Enviada em</span>
          <span className="text-sm font-medium">{formatDate(suitcase.sent_at)}</span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Retorno previsto</span>
          <span className={`text-sm font-medium ${suitcase.status === 'overdue' ? 'text-red-600' : ''}`}>
            {formatDate(suitcase.expected_return)}
          </span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Valor em circulação</span>
          <span className="text-sm font-semibold">{formatCurrency(suitcase.total_value)}</span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-400">Vendido</span>
          <span className="text-sm font-semibold text-green-700">{formatCurrency(suitcase.value_sold)}</span>
        </div>
      </div>

      {/* Resumo por status */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="badge badge-blue">{active} com a cliente</span>
        <span className="badge badge-green">{sold} vendidas</span>
        <span className="badge badge-amber">{returned} devolvidas</span>
      </div>

      {/* Itens */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código peça</th>
              <th>Produto</th>
              <th>Ref</th>
              <th>Tamanho</th>
              <th>Cor</th>
              <th>Preço</th>
              <th>Status</th>
              <th>Rastrear</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any) => {
              const pi = item.product_items
              const p  = pi?.products
              return (
                <tr key={item.id}>
                  <td className="font-mono text-xs text-gray-500">{pi?.item_code || '—'}</td>
                  <td className="font-medium">{p?.name || '—'}</td>
                  <td className="text-gray-400 text-xs">{p?.internal_code}</td>
                  <td className="text-gray-500">{pi?.size || '—'}</td>
                  <td className="text-gray-500">{pi?.color || '—'}</td>
                  <td>{formatCurrency(item.consignment_price || p?.sale_price || 0)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[item.status] || 'badge-gray'}`}>
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                  </td>
                  <td>
                    {pi?.item_code && (
                      <Link href={`/rastreio?q=${pi.item_code}`} className="text-xs text-brand-600 hover:underline">
                        Histórico →
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
            {!items?.length && (
              <tr><td colSpan={8} className="text-center text-gray-400 py-8">Nenhuma peça nesta maleta.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {suitcase.notes && (
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-medium">Obs:</span> {suitcase.notes}
        </div>
      )}
    </div>
  )
}
