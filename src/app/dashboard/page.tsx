import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { AlertTriangle, TrendingUp, Briefcase, CreditCard, Car } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Busca dados reais em paralelo
  const [salesRes, suitcasesRes, installmentsRes, tripsRes] = await Promise.all([
    supabase.from('sales').select('total, created_at').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('suitcases').select('id, code, status, expected_return, total_value, customers(name, whatsapp)').eq('status', 'overdue').order('expected_return'),
    supabase.from('credit_installments').select('amount, due_date, status, customers(name)').eq('status', 'pending').lte('due_date', new Date().toISOString().split('T')[0]).order('due_date'),
    supabase.from('trip_logs').select('distance_km, total_cost').gte('trip_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
  ])

  const sales = salesRes.data || []
  const overdueSuitcases = suitcasesRes.data || []
  const overdueInstallments = installmentsRes.data || []
  const trips = tripsRes.data || []

  const revenueMonth = sales.reduce((a, s) => a + (s.total || 0), 0)
  const today = new Date().toISOString().split('T')[0]
  const revenueToday = sales.filter(s => s.created_at?.startsWith(today)).reduce((a, s) => a + (s.total || 0), 0)
  const creditOverdue = overdueInstallments.reduce((a, i) => a + (i.amount || 0), 0)
  const kmMonth = trips.reduce((a, t) => a + (t.distance_km || 0), 0)
  const kmCost = trips.reduce((a, t) => a + (t.total_cost || 0), 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral do negócio</p>
        </div>
        {(overdueSuitcases.length > 0 || overdueInstallments.length > 0) && (
          <div className="flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
            <AlertTriangle size={13} />
            {overdueSuitcases.length + overdueInstallments.length} alertas pendentes
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-card">
          <div className="kpi-label flex items-center gap-1"><TrendingUp size={10} /> Faturamento hoje</div>
          <div className="kpi-value">{formatCurrency(revenueToday)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Mês atual</div>
          <div className="kpi-value">{formatCurrency(revenueMonth)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label flex items-center gap-1"><CreditCard size={10} /> Crédito vencido</div>
          <div className={`kpi-value ${creditOverdue > 0 ? 'text-red-600' : ''}`}>{formatCurrency(creditOverdue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label flex items-center gap-1"><Car size={10} /> Custo km/mês</div>
          <div className="kpi-value">{formatCurrency(kmCost)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{kmMonth.toFixed(0)} km rodados</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Maletas em atraso */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Briefcase size={14} className="text-brand-600" />
              Maletas em atraso
            </h2>
            <span className="badge badge-red">{overdueSuitcases.length}</span>
          </div>
          {overdueSuitcases.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma maleta em atraso 🎉</p>
          ) : (
            <div className="space-y-1">
              {overdueSuitcases.slice(0, 5).map((s: any) => (
                <Link key={s.id} href={`/maletas/${s.id}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-1 px-1 rounded transition-colors">
                  <div>
                    <p className="text-sm font-medium">{s.customers?.name}</p>
                    <p className="text-xs text-gray-400">{s.code} · vencia {formatDateShort(s.expected_return)}</p>
                  </div>
                  <span className="badge badge-red">{formatCurrency(s.total_value)}</span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/maletas" className="block text-xs text-brand-600 hover:underline mt-3">Ver todas as maletas →</Link>
        </div>

        {/* Parcelas vencidas */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <CreditCard size={14} className="text-brand-600" />
              Parcelas vencidas
            </h2>
            <span className="badge badge-red">{overdueInstallments.length}</span>
          </div>
          {overdueInstallments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma parcela vencida 🎉</p>
          ) : (
            <div className="space-y-1">
              {overdueInstallments.slice(0, 5).map((inst: any, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{inst.customers?.name}</p>
                    <p className="text-xs text-gray-400">Venceu {formatDateShort(inst.due_date)}</p>
                  </div>
                  <span className="badge badge-red">{formatCurrency(inst.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/crediario" className="block text-xs text-brand-600 hover:underline mt-3">Ver crediário completo →</Link>
        </div>
      </div>
    </div>
  )
}
