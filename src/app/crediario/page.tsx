export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function CrediariosPage() {
  const supabase = await createClient()
  const { data: installments } = await supabase
    .from('v_overdue_installments')
    .select('*')

  const overdue  = installments?.filter((i: any) => i.status === 'overdue') || []
  const pending  = installments?.filter((i: any) => i.status === 'pending') || []
  const totalOverdue  = overdue.reduce((a: number, i: any) => a + i.amount, 0)
  const totalPending  = pending.reduce((a: number, i: any) => a + i.amount, 0)
  const totalAll      = totalOverdue + totalPending

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-medium">Crediário</h1>
        <p className="text-sm text-gray-500">Parcelas em aberto e em atraso</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <span className="text-xs text-gray-500">Total a receber</span>
          <span className="text-2xl font-semibold">{formatCurrency(totalAll)}</span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-500">Vencidas</span>
          <span className="text-2xl font-semibold text-red-600">{overdue.length} · {formatCurrency(totalOverdue)}</span>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-gray-500">A vencer</span>
          <span className="text-2xl font-semibold text-amber-600">{pending.length} · {formatCurrency(totalPending)}</span>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-4">
          <AlertCircle size={12} />
          {overdue.length} parcela{overdue.length > 1 ? 's' : ''} vencida{overdue.length > 1 ? 's' : ''} — contate as clientes
        </div>
      )}

      {/* Vencidas */}
      {overdue.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-red-700 mb-2">Vencidas</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Parc.</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Atraso</th>
                  <th>Multa estimada</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((i: any) => (
                  <tr key={i.id}>
                    <td><Link href={`/clientes/${i.customer_id}`} className="font-medium hover:text-brand-600">{i.customer_name}</Link></td>
                    <td className="text-gray-500 text-sm">{i.customer_whatsapp || '—'}</td>
                    <td className="text-gray-500">{i.installment_num}ª</td>
                    <td className="font-medium">{formatCurrency(i.amount)}</td>
                    <td className="text-red-600 font-medium">{formatDate(i.due_date)}</td>
                    <td><span className="font-semibold text-red-600">{i.days_overdue_calc}d</span></td>
                    <td className="text-amber-700">{formatCurrency(i.calculated_late_fee || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* A vencer */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-600 mb-2">A vencer</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Parc.</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((i: any) => (
                  <tr key={i.id}>
                    <td><Link href={`/clientes/${i.customer_id}`} className="font-medium hover:text-brand-600">{i.customer_name}</Link></td>
                    <td className="text-gray-500 text-sm">{i.customer_whatsapp || '—'}</td>
                    <td className="text-gray-500">{i.installment_num}ª</td>
                    <td className="font-medium">{formatCurrency(i.amount)}</td>
                    <td className="text-gray-600">{formatDate(i.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!installments?.length && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CheckCircle size={32} className="mb-2 text-green-400" />
          <p>Nenhuma parcela em aberto.</p>
        </div>
      )}
    </div>
  )
}
