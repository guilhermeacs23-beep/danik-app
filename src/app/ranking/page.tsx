export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Trophy, Star, Crown, Medal, TrendingUp } from 'lucide-react'

const TIERS = {
  diamond: { label: 'Diamante', color: 'text-blue-500',   bg: 'bg-blue-50   dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-800',  icon: Crown,  min: 1500 },
  gold:    { label: 'Ouro',     color: 'text-amber-500',  bg: 'bg-amber-50  dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: Trophy, min: 600  },
  silver:  { label: 'Prata',   color: 'text-slate-400',  bg: 'bg-slate-50  dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-700', icon: Star,   min: 200  },
  bronze:  { label: 'Bronze',  color: 'text-brand-400',  bg: 'bg-brand-50  dark:bg-brand-900/20', border: 'border-brand-200 dark:border-brand-800', icon: Medal,  min: 0    },
}

function getTier(points: number) {
  if (points >= 1500) return 'diamond'
  if (points >= 600)  return 'gold'
  if (points >= 200)  return 'silver'
  return 'bronze'
}

function getNextTier(points: number) {
  if (points >= 1500) return null
  if (points >= 600)  return { name: 'Diamante', need: 1500 - points }
  if (points >= 200)  return { name: 'Ouro',     need: 600  - points }
  return                     { name: 'Prata',    need: 200  - points }
}

export default async function RankingPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, loyalty_points, loyalty_tier, credit_limit, whatsapp, phone')
    .eq('status', 'active')
    .order('loyalty_points', { ascending: false })
    .limit(50)

  const { data: recentEvents } = await supabase
    .from('loyalty_events')
    .select('*, customers(name)')
    .order('created_at', { ascending: false })
    .limit(20)

  const list = customers || []
  const diamond = list.filter(c => (c.loyalty_points || 0) >= 1500)
  const gold    = list.filter(c => (c.loyalty_points || 0) >= 600 && (c.loyalty_points || 0) < 1500)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={20} className="text-brand-400" />
        <div>
          <h1 className="text-lg font-semibold text-brand-900 dark:text-brand-100">Ranking de Clientes</h1>
          <p className="text-xs text-brand-400">Programa de fidelidade — pontos, níveis e benefícios</p>
        </div>
      </div>

      {/* Como funciona */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold mb-3 text-brand-700 dark:text-brand-300">Como ganhar pontos</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-brand-400 font-bold text-lg leading-none">×10</span>
            <div>
              <p className="font-medium text-brand-800 dark:text-brand-200">Organização da maleta</p>
              <p className="text-xs text-brand-400">Nota de 0 a 10 dada pela Dani ao retorno × 10 pts</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-brand-400 font-bold text-lg leading-none">R$</span>
            <div>
              <p className="font-medium text-brand-800 dark:text-brand-200">Valor de compra</p>
              <p className="text-xs text-brand-400">10 pontos a cada R$100 gastos</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp size={18} className="text-brand-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-brand-800 dark:text-brand-200">Recorrência</p>
              <p className="text-xs text-brand-400">50 pts por mês com compra ativa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(TIERS).reverse().map(([key, t]) => {
          const Icon = t.icon
          const count = list.filter(c => getTier(c.loyalty_points || 0) === key).length
          const multiplier = key === 'diamond' ? '3×' : key === 'gold' ? '2×' : key === 'silver' ? '1.5×' : '1×'
          return (
            <div key={key} className={`rounded-xl border p-4 ${t.bg} ${t.border}`}>
              <Icon size={20} className={`${t.color} mb-2`} />
              <p className={`font-bold text-sm ${t.color}`}>{t.label}</p>
              <p className="text-xs text-brand-500 dark:text-brand-400 mb-1">{t.min}+ pts</p>
              <p className="text-xs font-medium text-brand-700 dark:text-brand-300">Limite {multiplier}</p>
              <p className="text-xs text-brand-400 mt-1">{count} cliente{count !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>

      {/* Top 3 destaque */}
      {list.length > 0 && (
        <div className="flex gap-3 mb-6">
          {list.slice(0, 3).map((c, idx) => {
            const tier = getTier(c.loyalty_points || 0)
            const t = TIERS[tier as keyof typeof TIERS]
            const Icon = t.icon
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={c.id} className={`flex-1 rounded-xl border p-4 ${t.bg} ${t.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{medals[idx]}</span>
                  <Icon size={16} className={t.color} />
                </div>
                <p className="font-semibold text-brand-900 dark:text-brand-100 text-sm">{c.name}</p>
                <p className={`text-lg font-bold ${t.color}`}>{c.loyalty_points || 0} pts</p>
                <p className="text-xs text-brand-400">{t.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela ranking completo */}
      <h2 className="text-sm font-semibold mb-3 text-brand-700 dark:text-brand-300">Ranking completo</h2>
      <div className="table-wrap mb-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Nível</th>
              <th>Pontos</th>
              <th>Próximo nível</th>
              <th>Limite de crédito</th>
              <th>Contato</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c, idx) => {
              const tier = getTier(c.loyalty_points || 0)
              const t = TIERS[tier as keyof typeof TIERS]
              const next = getNextTier(c.loyalty_points || 0)
              const Icon = t.icon
              return (
                <tr key={c.id}>
                  <td className="text-brand-400 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${t.bg} ${t.color} ${t.border}`}>
                      <Icon size={10} />
                      {t.label}
                    </span>
                  </td>
                  <td className={`font-bold ${t.color}`}>{c.loyalty_points || 0}</td>
                  <td className="text-xs text-brand-500">
                    {next ? `Faltam ${next.need} pts para ${next.name}` : '🏆 Nível máximo'}
                  </td>
                  <td>{formatCurrency(c.credit_limit || 0)}</td>
                  <td className="text-xs text-brand-400">{c.whatsapp || c.phone || '—'}</td>
                </tr>
              )
            })}
            {!list.length && (
              <tr>
                <td colSpan={7} className="text-center text-brand-300 py-8">
                  Nenhuma cliente cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Histórico de pontos */}
      {recentEvents && recentEvents.length > 0 && (
        <>
          <h2 className="text-sm font-semibold mb-3 text-brand-700 dark:text-brand-300">Últimos eventos de pontos</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Evento</th>
                  <th>Pontos</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((e: any) => (
                  <tr key={e.id}>
                    <td className="font-medium">{(e.customers as any)?.name || '—'}</td>
                    <td>
                      <span className="badge badge-gray capitalize">{e.event_type?.replace('_', ' ')}</span>
                    </td>
                    <td className={`font-bold ${e.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {e.points >= 0 ? '+' : ''}{e.points}
                    </td>
                    <td className="text-brand-500 text-xs">{e.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
