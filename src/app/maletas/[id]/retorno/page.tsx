'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, RotateCcw, ShoppingBag, CreditCard, Banknote, QrCode, ChevronDown, ChevronUp } from 'lucide-react'

type Decision = 'kept' | 'returned' | 'pending'

interface ItemRow {
  id: string
  decision: Decision
  suitcase_item_id: string
  product_item_id: string
  item_code: string
  name: string
  size: string
  color: string
  price: number
}

type PayMode = 'cash' | 'pix' | 'card' | 'partial'

export default function RetornoMaletaPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const router = useRouter()

  const [suitcase, setSuitcase] = useState<any>(null)
  const [rows, setRows]         = useState<ItemRow[]>([])
  const [loading, setLoading]   = useState(true)

  // payment state
  const [payMode, setPayMode]       = useState<PayMode>('pix')
  const [entradaVal, setEntradaVal] = useState('')
  const [entradaMethod, setEntradaMethod] = useState<'cash'|'pix'|'card'>('pix')
  const [installments, setInstallments]   = useState(2)
  const [firstDue, setFirstDue]           = useState('')
  const [discount, setDiscount]           = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const load = useCallback(async () => {
    const [{ data: suit }, { data: itens }] = await Promise.all([
      supabase.from('suitcases').select('*, customers(id, name, whatsapp)').eq('id', id).single(),
      supabase.from('suitcase_items')
        .select('id, consignment_price, status, product_items(id, item_code, size, color, products(name, sale_price))')
        .eq('suitcase_id', id)
        .eq('status', 'with_customer'),
    ])
    setSuitcase(suit)
    setRows(
      (itens || []).map((i: any) => ({
        id: crypto.randomUUID(),
        decision: 'pending' as Decision,
        suitcase_item_id: i.id,
        product_item_id: i.product_items?.id,
        item_code: i.product_items?.item_code || '',
        name: i.product_items?.products?.name || '—',
        size: i.product_items?.size || '',
        color: i.product_items?.color || '',
        price: i.consignment_price || i.product_items?.products?.sale_price || 0,
      }))
    )
    setLoading(false)
    // default first due = 30 days from now
    const d = new Date()
    d.setDate(d.getDate() + 30)
    setFirstDue(d.toISOString().slice(0, 10))
  }, [id])

  useEffect(() => { load() }, [load])

  function decide(rowId: string, dec: Decision) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, decision: dec } : r))
  }

  function decideAll(dec: Decision) {
    setRows(prev => prev.map(r => ({ ...r, decision: dec })))
  }

  const kept     = rows.filter(r => r.decision === 'kept')
  const returned = rows.filter(r => r.decision === 'returned')
  const pending  = rows.filter(r => r.decision === 'pending')

  const subtotal     = kept.reduce((a, r) => a + r.price, 0)
  const discountVal  = parseFloat(discount) || 0
  const total        = Math.max(0, subtotal - discountVal)
  const entradaNum   = parseFloat(entradaVal) || 0
  const crediario    = Math.max(0, total - entradaNum)
  const installVal   = installments > 0 ? crediario / installments : 0

  async function confirm() {
    if (pending.length > 0) { setError('Defina o que foi comprado e o que foi devolvido para todas as peças.'); return }
    if (kept.length === 0 && returned.length === 0) { setError('Nenhuma peça para processar.'); return }
    if (payMode === 'partial' && entradaNum >= total) { setError('A entrada é maior ou igual ao total — use pagamento à vista.'); return }
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Não autenticado'); setSaving(false); return }
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) { setError('Sem tenant'); setSaving(false); return }
    const tenantId = profile.tenant_id

    // 1. Mark returned items back to stock
    if (returned.length > 0) {
      await supabase.from('suitcase_items')
        .update({ status: 'returned' })
        .in('id', returned.map(r => r.suitcase_item_id))

      await supabase.from('product_items')
        .update({ status: 'in_stock', current_suitcase_id: null, current_customer_id: null })
        .in('id', returned.map(r => r.product_item_id))
    }

    // 2. Mark kept items as sold
    if (kept.length > 0) {
      await supabase.from('suitcase_items')
        .update({ status: 'sold' })
        .in('id', kept.map(r => r.suitcase_item_id))

      await supabase.from('product_items')
        .update({ status: 'sold' })
        .in('id', kept.map(r => r.product_item_id))

      // 3. Create sale record
      const saleCode = `VND-${Date.now().toString().slice(-6)}`
      const isPartial = payMode === 'partial'
      const pmMethod  = isPartial ? 'mixed' : payMode

      const { data: sale } = await supabase.from('sales').insert({
        tenant_id: tenantId,
        code: saleCode,
        customer_id: suitcase?.customers?.id || null,
        suitcase_id: id,
        sale_type: 'suitcase',
        subtotal,
        discount_value: discountVal,
        total,
        payment_method: pmMethod,
        installments: isPartial ? installments : 1,
        status: isPartial && crediario > 0 ? 'partial' : 'completed',
      }).select().single()

      // 4. Crediário (if partial)
      if (sale && isPartial && crediario > 0) {
        const { data: account } = await supabase.from('store_credit_accounts').insert({
          tenant_id: tenantId,
          customer_id: suitcase?.customers?.id,
          sale_id: sale.id,
          total_amount: crediario,
          installments,
          installment_value: installVal,
          first_due_date: firstDue,
          status: 'open',
          amount_paid: 0,
          amount_pending: crediario,
        }).select().single()

        if (account) {
          const parcelas = Array.from({ length: installments }, (_, i) => {
            const due = new Date(firstDue)
            due.setMonth(due.getMonth() + i)
            return {
              tenant_id: tenantId,
              account_id: account.id,
              customer_id: suitcase?.customers?.id,
              installment_num: i + 1,
              amount: installVal,
              due_date: due.toISOString().slice(0, 10),
              status: 'pending',
            }
          })
          await supabase.from('credit_installments').insert(parcelas)
        }
      }
    }

    // 5. Close suitcase
    const newStatus = kept.length > 0 ? 'closed' : 'closed'
    await supabase.from('suitcases').update({
      status: newStatus,
      value_sold: total,
      returned_at: new Date().toISOString(),
    }).eq('id', id)

    router.push(`/maletas/${id}`)
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="flex h-full overflow-hidden">

      {/* LEFT: piece decisions */}
      <div className="flex flex-col w-[58%] border-r border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Link href={`/maletas/${id}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-base font-medium">Registrar retorno</h1>
            <p className="text-sm text-gray-400">{suitcase?.code} · {suitcase?.customers?.name}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={() => decideAll('kept')}
            className="btn text-xs py-1 px-3 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            ✓ Tudo comprado
          </button>
          <button onClick={() => decideAll('returned')}
            className="btn text-xs py-1 px-3 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
            ↩ Tudo devolvido
          </button>
          <button onClick={() => decideAll('pending')}
            className="btn text-xs py-1 px-3 text-gray-500">
            Limpar
          </button>
          <span className="ml-auto text-xs text-gray-400 self-center">
            {kept.length} compradas · {returned.length} devolvidas · {pending.length} pendentes
          </span>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhuma peça ativa nesta maleta.</div>
          )}
          {rows.map(row => (
            <div key={row.id}
              className={`flex items-center gap-3 px-6 py-3 border-b border-gray-50 transition-colors
                ${row.decision === 'kept'     ? 'bg-green-50'  : ''}
                ${row.decision === 'returned' ? 'bg-amber-50' : ''}
              `}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{row.name}</p>
                <p className="text-xs text-gray-400 font-mono">{row.item_code}
                  {row.size  && <span className="ml-2 not-italic font-sans">{row.size}</span>}
                  {row.color && <span className="ml-1 text-gray-300">·</span>}
                  {row.color && <span className="ml-1 not-italic font-sans">{row.color}</span>}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-700 shrink-0">{formatCurrency(row.price)}</span>

              {/* Decision buttons */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => decide(row.id, row.decision === 'kept' ? 'pending' : 'kept')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${row.decision === 'kept'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-700'}`}>
                  <Check size={12} /> Comprou
                </button>
                <button
                  onClick={() => decide(row.id, row.decision === 'returned' ? 'pending' : 'returned')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${row.decision === 'returned'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-amber-400 hover:text-amber-700'}`}>
                  <RotateCcw size={12} /> Devolveu
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: payment panel */}
      <div className="flex flex-col w-[42%] bg-gray-50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-sm font-medium">Resumo do retorno</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Peças compradas</p>
              <p className="text-2xl font-semibold text-green-700">{kept.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Devolvidas</p>
              <p className="text-2xl font-semibold text-amber-600">{returned.length}</p>
            </div>
          </div>

          {kept.length > 0 && (
            <>
              {/* Discount */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="label">Desconto (R$)</label>
                <input type="number" min="0" step="0.50"
                  className="input"
                  placeholder="0,00"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)} />
                <div className="flex justify-between text-sm mt-3">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Desconto</span>
                    <span className="text-red-600">− {formatCurrency(discountVal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base mt-2 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-brand-700">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment mode */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Forma de pagamento</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { mode: 'pix',     icon: <QrCode size={14} />,    label: 'PIX' },
                    { mode: 'card',    icon: <CreditCard size={14} />, label: 'Cartão' },
                    { mode: 'cash',    icon: <Banknote size={14} />,   label: 'Dinheiro' },
                    { mode: 'partial', icon: <ChevronDown size={14} />,label: 'Parcelado / Crediário' },
                  ].map(({ mode, icon, label }) => (
                    <button key={mode}
                      onClick={() => setPayMode(mode as PayMode)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                        ${payMode === mode
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>

                {/* Partial payment breakdown */}
                {payMode === 'partial' && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div>
                      <label className="label">Entrada (R$)</label>
                      <input type="number" min="0" step="0.50"
                        className="input"
                        placeholder="0,00"
                        value={entradaVal}
                        onChange={e => setEntradaVal(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Método da entrada</label>
                      <div className="flex gap-2">
                        {(['pix','card','cash'] as const).map(m => (
                          <button key={m} onClick={() => setEntradaMethod(m)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all
                              ${entradaMethod === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'}`}>
                            {m === 'pix' ? 'PIX' : m === 'card' ? 'Cartão' : 'Dinheiro'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Parcelas do restante</label>
                      <select className="input" value={installments} onChange={e => setInstallments(parseInt(e.target.value))}>
                        {[2,3,4,5,6,8,10,12].map(n => (
                          <option key={n} value={n}>{n}x de {formatCurrency(crediario / n)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Vencimento da 1ª parcela</label>
                      <input type="date" className="input" value={firstDue}
                        onChange={e => setFirstDue(e.target.value)} />
                    </div>

                    {/* Partial summary */}
                    <div className="bg-brand-50 rounded-xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entrada agora</span>
                        <span className="font-semibold text-green-700">{formatCurrency(entradaNum)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-brand-100">
                        <span className="text-gray-600">Vai pro crediário</span>
                        <span className="font-semibold text-brand-700">{formatCurrency(crediario)}</span>
                      </div>
                      {installments > 0 && crediario > 0 && (
                        <p className="text-xs text-gray-400 text-right">
                          {installments}x de {formatCurrency(installVal)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {pending.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              ⚠ Ainda há <strong>{pending.length} peça{pending.length !== 1 ? 's' : ''}</strong> sem decisão.
            </div>
          )}
        </div>

        {/* Confirm button */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            onClick={confirm}
            disabled={saving || pending.length > 0 || rows.length === 0}
            className="btn btn-primary w-full justify-center py-3 text-sm disabled:opacity-40"
          >
            {saving
              ? 'Processando...'
              : kept.length === 0
              ? 'Confirmar — tudo devolvido'
              : `Confirmar venda de ${kept.length} peça${kept.length !== 1 ? 's' : ''} · ${formatCurrency(total)}`}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            {returned.length > 0 && `${returned.length} peça${returned.length !== 1 ? 's' : ''} volta${returned.length === 1 ? '' : 'm'} pro estoque automaticamente`}
          </p>
        </div>
      </div>

    </div>
  )
}
