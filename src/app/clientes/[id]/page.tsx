export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Star } from 'lucide-react'

const SEG_BADGE: Record<string, string> = {
  new: 'badge-blue', regular: 'badge-gray', vip: 'badge-purple',
  at_risk: 'badge-amber', churned: 'badge-red',
}
const SEG_LABEL: Record<string, string> = {
  new: 'Nova', regular: 'Regular', vip: 'VIP', at_risk: 'Em risco', churned: 'Inativa',
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: customer }, { data: suitcases }, { data: installments }] = await Promise.all([
    supabase.from('v_customers').select('*').eq('id', id).single(),
    supabase.from('suitcases').select('id, code, status, sent_at, expected_return, total_items, total_value, value_sold').eq('customer_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('credit_installments').select('*').eq('customer_id', id).order('due_date').limit(20),
  ])

  if (!customer) return notFound()

  const creditPct = customer.credit_limit > 0
    ? Math.min(100, (customer.credit_used / customer.credit_limit) * 100)
    : 0

  const pendingInstallments = installments?.filter((i: any) => i.status !== 'paid') || []
  const totalPending = pendingInstallments.reduce((a: number, i: any) => a + i.amount, 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clientes" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-medium">{customer.name}</h1>
          <span className={`badge ${SEG_BADGE[customer.segment] || 'badge-gray'}`}>{SEG_LABEL[customer.segment] || customer.segment}</span>
        </div>
        {customer.status === 'blocked' && (
          <span className="badge badge-red text-sm">Bloqueada</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Info pessoal */}
        <div className="card">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Contato</h2>
          <div className="space-y-2">
            {customer.whatsapp && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={13} className="text-gray-400" />
                <span>{customer.whatsapp}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-xs">✉</span>
                <span>{customer.email}</span>
              </div>
            )}
            {customer.instagram && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-xs">@</span>
                <span>{customer.instagram}</span>
              </div>
            )}
            {(customer.city || customer.state) && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} className="text-gray-400" />
                <span>{[customer.neighborhood, customer.city, customer.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {customer.birth_date && (
              <div className="text-sm text-gray-500">
                Nascimento: {formatDate(customer.birth_date)}
              </div>
            )}
          </div>
          {customer.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Observações</p>
              <p className="text-sm text-gray-600 mt-1">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Crédito */}
        <div className="card">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Crédito</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Utilizado</span>
                <span className="font-medium">{formatCurrency(customer.credit_used)} / {formatCurrency(customer.credit_limit)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${creditPct >= 90 ? 'bg-red-500' : creditPct >= 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${creditPct}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Disponível</span>
              <span className={`font-semibold ${(customer.credit_available || 0) <= 0 ? 'text-red-600' : 'text-green-700'}`}>
                {formatCurrency(customer.credit_available || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pendente crediário</span>
              <span className={`font-medium ${totalPending > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{formatCurrency(totalPending)}</span>
            </div>
          </div>
          {/* Score */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
            <Star size={14} className={customer.credit_score >= 700 ? 'text-green-500' : customer.credit_score >= 400 ? 'text-amber-500' : 'text-red-500'} />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Score</span>
                <span className={`font-bold ${customer.credit_score >= 700 ? 'text-green-700' : customer.credit_score >= 400 ? 'text-amber-700' : 'text-red-600'}`}>
                  {customer.credit_score}/1000
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className={`h-full rounded-full ${customer.credit_score >= 700 ? 'bg-green-400' : customer.credit_score >= 400 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${customer.credit_score / 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de maletas */}
        <div className="card">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Maletas</h2>
          {suitcases?.length ? (
            <div className="space-y-2">
              {suitcases.slice(0, 4).map((s: any) => (
                <Link key={s.id} href={`/maletas/${s.id}`}
                  className="flex items-center justify-between text-sm hover:text-brand-600 py-1 border-b border-gray-50 last:border-0">
                  <span className="font-mono text-xs text-gray-400">{s.code}</span>
                  <span className="font-medium">{formatCurrency(s.value_sold || 0)}</span>
                  <span className={`badge text-xs ${s.status === 'overdue' ? 'badge-red' : s.status === 'closed' ? 'badge-green' : 'badge-blue'}`}>
                    {s.status === 'open' ? 'Aberta' : s.status === 'closed' ? 'Fechada' : s.status === 'overdue' ? 'Atraso' : 'Parcial'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhuma maleta ainda</p>
          )}
        </div>
      </div>

      {/* Parcelas */}
      {installments && installments.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium mb-4">Parcelas do crediário</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Parc.</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Atraso</th>
                <th>Pago em</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((i: any) => {
                const daysLate = i.paid_at === null && i.due_date < new Date().toISOString().slice(0, 10)
                  ? Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000)
                  : 0
                return (
                  <tr key={i.id}>
                    <td className="text-gray-500">{i.installment_num}ª</td>
                    <td className="font-medium">{formatCurrency(i.amount)}</td>
                    <td className={daysLate > 0 ? 'text-red-600 font-medium' : ''}>{formatDate(i.due_date)}</td>
                    <td>
                      {i.status === 'paid'       && <span className="badge badge-green">Paga</span>}
                      {i.status === 'pending'    && <span className="badge badge-amber">Pendente</span>}
                      {i.status === 'overdue'    && <span className="badge badge-red">Vencida</span>}
                      {i.status === 'negotiated' && <span className="badge badge-blue">Negociada</span>}
                    </td>
                    <td>{daysLate > 0 ? <span className="text-red-600 font-medium">{daysLate}d</span> : '—'}</td>
                    <td className="text-gray-400">{i.paid_at ? formatDate(i.paid_at) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
