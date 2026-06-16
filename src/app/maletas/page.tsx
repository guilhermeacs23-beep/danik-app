export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Briefcase, Plus } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberta',
  overdue: 'Em atraso',
  partial_return: 'Parcial',
  closed: 'Fechada',
}
const STATUS_BADGE: Record<string, string> = {
  open: 'badge-blue',
  overdue: 'badge-red',
  partial_return: 'badge-amber',
  closed: 'badge-green',
}

export default async function MaletasPage() {
  const supabase = await createClient()
  const { data: suitcases } = await supabase
    .from('suitcases')
    .select('*, customers(name, whatsapp)')
    .order('created_at', { ascending: false })
    .limit(100)

  const open = suitcases?.filter(s => ['open','overdue','partial_return'].includes(s.status)).length || 0
  const overdue = suitcases?.filter(s => s.status === 'overdue').length || 0
  const totalValue = suitcases?.filter(s => s.status !== 'closed').reduce((a, s) => a + s.total_value, 0) || 0

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium">Maletas</h1>
          <p className="text-sm text-gray-500">{open} maleta{open !== 1 ? 's' : ''} em aberto · {formatCurrency(totalValue)} em circulação</p>
        </div>
        <Link href="/maletas/nova" className="btn btn-primary">
          <Plus size={14} /> Nova maleta
        </Link>
      </div>

      {overdue > 0 && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-4">
          <Briefcase size={12} />
          {overdue} maleta{overdue > 1 ? 's' : ''} em atraso — entre em contato com {overdue > 1 ? 'as clientes' : 'a cliente'}
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Enviada</th>
              <th>Retorno prev.</th>
              <th className="text-center">Peças</th>
              <th>Valor total</th>
              <th>Vendido</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suitcases?.map((s: any) => (
              <tr key={s.id}>
                <td className="font-medium text-brand-600">{s.code}</td>
                <td className="font-medium">{s.customers?.name}</td>
                <td className="text-gray-500">{formatDate(s.sent_at)}</td>
                <td className={`${s.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {formatDate(s.expected_return)}
                </td>
                <td className="text-center">{s.total_items}</td>
                <td>{formatCurrency(s.total_value)}</td>
                <td className="text-green-700">{formatCurrency(s.value_sold)}</td>
                <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{STATUS_LABEL[s.status] || s.status}</span></td>
                <td>
                  <Link href={`/maletas/${s.id}`} className="text-xs text-brand-600 hover:underline">Ver →</Link>
                </td>
              </tr>
            ))}
            {!suitcases?.length && (
              <tr><td colSpan={9} className="text-center text-gray-400 py-8">Nenhuma maleta cadastrada ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
