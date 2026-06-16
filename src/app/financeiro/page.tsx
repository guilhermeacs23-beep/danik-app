import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, ShoppingBag, CreditCard, Car } from 'lucide-react'

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'Pix', cash: 'Dinheiro', card_credit: 'Cartão crédito',
  card_debit: 'Cartão débito', credit: 'Crediário', transfer: 'Transferência',
}

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const now = new Date()
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstDayYear  = new Date(now.getFullYear(), 0, 1).toISOString()
  const today         = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { data: salesMonth },
    { data: salesToday },
    { data: salesYear },
    { data: tripsMonth },
    { data: recentSales },
  ] = await Promise.all([
    supabase.from('sales').select('total, payment_method').eq('status', 'completed').gte('created_at', firstDayMonth),
    supabase.from('sales').select('total').eq('status', 'completed').gte('created_at', today),
    supabase.from('sales').select('total').eq('status', 'completed').gte('created_at', firstDayYear),
    supabase.from('trip_logs').select('total_cost').gte('trip_date', firstDayMonth.slice(0, 10)),
    supabase.from('sales').select('*, customers(name)').eq('status', 'completed').order('created_at', { ascending: false }).limit(20),
  ])

  const revenueToday  = salesToday?.reduce((a, s) => a + s.total, 0) || 0
  const revenueMonth  = salesMonth?.reduce((a, s) => a + s.total, 0) || 0
  const revenueYear   = salesYear?.reduce((a, s) => a + s.total, 0) || 0
  const costTrips     = tripsMonth?.reduce((a, t) => a + (t.total_cost || 0), 0) || 0
  const countMonth    = salesMonth?.length || 0
  const avgTicket     = countMonth ? revenueMonth / countMonth : 0

  // breakdown por forma de pagamento
  const byPayment: Record<string, number> = {}
  salesMonth?.forEach((s: any) => {
    byPayment[s.payment_method] = (byPayment[s.payment_method] || 0) + s.total
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-medium">Financeiro</h1>
        <p className="text-sm text-gray-500">Visão geral de receitas e custos</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><TrendingUp size={14} /><span className="text-xs">Hoje</span></div>
          <span className="text-2xl font-semibold text-green-700">{formatCurrency(revenueToday)}</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><ShoppingBag size={14} /><span className="text-xs">Este mês</span></div>
          <span className="text-2xl font-semibold">{formatCurrency(revenueMonth)}</span>
          <span className="text-xs text-gray-400 mt-1">{countMonth} vendas · ticket médio {formatCurrency(avgTicket)}</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><CreditCard size={14} /><span className="text-xs">Este ano</span></div>
          <span className="text-2xl font-semibold">{formatCurrency(revenueYear)}</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Car size={14} /><span className="text-xs">Custo deslocamentos mês</span></div>
          <span className="text-2xl font-semibold text-red-600">{formatCurrency(costTrips)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Receita líquida estimada */}
        <div className="card col-span-2">
          <h2 className="text-sm font-medium mb-4">Últimas vendas</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Pagamento</th>
                <th>Data</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {recentSales?.map((s: any) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs text-gray-400">{s.code}</td>
                  <td className="font-medium">{s.customers?.name || 'Balcão'}</td>
                  <td><span className="badge badge-blue">{PAYMENT_LABEL[s.payment_method] || s.payment_method}</span></td>
                  <td className="text-gray-500">{formatDate(s.created_at)}</td>
                  <td className="text-right font-semibold text-green-700">{formatCurrency(s.total)}</td>
                </tr>
              ))}
              {!recentSales?.length && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-6">Nenhuma venda ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Por forma de pagamento */}
        <div className="card">
          <h2 className="text-sm font-medium mb-4">Por forma de pagamento — mês</h2>
          {Object.keys(byPayment).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byPayment)
                .sort(([, a], [, b]) => b - a)
                .map(([method, value]) => {
                  const pct = revenueMonth > 0 ? (value / revenueMonth) * 100 : 0
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{PAYMENT_LABEL[method] || method}</span>
                        <span className="font-medium">{formatCurrency(value)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Resumo mês */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Receita bruta</span>
              <span className="font-medium text-green-700">{formatCurrency(revenueMonth)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Custo km</span>
              <span className="font-medium text-red-600">- {formatCurrency(costTrips)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
              <span>Resultado estimado</span>
              <span className={revenueMonth - costTrips >= 0 ? 'text-green-700' : 'text-red-600'}>
                {formatCurrency(revenueMonth - costTrips)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
