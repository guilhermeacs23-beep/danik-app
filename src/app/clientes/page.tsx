export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

const SEG_BADGE: Record<string, string> = {
  new: 'badge-blue', regular: 'badge-gray', vip: 'badge-purple',
  at_risk: 'badge-amber', churned: 'badge-red',
}
const SEG_LABEL: Record<string, string> = {
  new: 'Nova', regular: 'Regular', vip: 'VIP', at_risk: 'Em risco', churned: 'Inativa',
}

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('v_customers')
    .select('*')
    .order('name')

  const total = customers?.length || 0
  const vip   = customers?.filter((c: any) => c.segment === 'vip').length || 0
  const blocked = customers?.filter((c: any) => c.status === 'blocked').length || 0
  const totalCredit = customers?.reduce((a: number, c: any) => a + (c.credit_used || 0), 0) || 0

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium">Clientes</h1>
          <p className="text-sm text-gray-500">{total} cadastradas</p>
        </div>
        <Link href="/clientes/nova" className="btn btn-primary">
          <UserPlus size={14} /> Nova cliente
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><span className="text-xs text-gray-500">Total</span><span className="text-2xl font-semibold">{total}</span></div>
        <div className="kpi-card"><span className="text-xs text-gray-500">VIP</span><span className="text-2xl font-semibold text-purple-600">{vip}</span></div>
        <div className="kpi-card"><span className="text-xs text-gray-500">Bloqueadas</span><span className="text-2xl font-semibold text-red-600">{blocked}</span></div>
        <div className="kpi-card"><span className="text-xs text-gray-500">Crédito em aberto</span><span className="text-2xl font-semibold text-amber-600">{formatCurrency(totalCredit)}</span></div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>Cidade</th>
              <th>Segmento</th>
              <th>Limite</th>
              <th>Usado</th>
              <th>Disponível</th>
              <th>Score</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c: any) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td className="text-gray-500 text-sm">{c.whatsapp || c.phone || '—'}</td>
                <td className="text-gray-500 text-sm">{c.city || '—'}</td>
                <td><span className={`badge ${SEG_BADGE[c.segment] || 'badge-gray'}`}>{SEG_LABEL[c.segment] || c.segment}</span></td>
                <td className="text-sm">{formatCurrency(c.credit_limit)}</td>
                <td className={`text-sm font-medium ${c.credit_used > 0 ? 'text-amber-700' : ''}`}>{formatCurrency(c.credit_used)}</td>
                <td className={`text-sm font-medium ${(c.credit_available || 0) <= 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(c.credit_available || 0)}</td>
                <td>
                  <span className={`text-sm font-semibold ${c.credit_score >= 700 ? 'text-green-700' : c.credit_score >= 400 ? 'text-amber-700' : 'text-red-600'}`}>
                    {c.credit_score}
                  </span>
                </td>
                <td>
                  {c.status === 'active'   && <span className="badge badge-green">Ativa</span>}
                  {c.status === 'blocked'  && <span className="badge badge-red">Bloqueada</span>}
                  {c.status === 'inactive' && <span className="badge badge-gray">Inativa</span>}
                </td>
                <td><Link href={`/clientes/${c.id}`} className="text-xs text-brand-600 hover:underline">Ver →</Link></td>
              </tr>
            ))}
            {!customers?.length && (
              <tr><td colSpan={10} className="text-center text-gray-400 py-8">Nenhuma cliente cadastrada ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
