'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcMarkup, calcMargin, priceFromMarkup, priceFromMargin, formatCurrency } from '@/lib/utils'
import { Barcode, Sparkles, Plus, Trash2, CheckCircle, ChevronDown } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  category: string
  size: string
  color: string
  barcode: string
  qty: number
  cost: number
  price: number
  margin: number
}

type PriceMode = 'markup' | 'margin'

const CATEGORIES = ['Vestidos','Blusas','Calças','Saias','Macacões','Shorts','Conjuntos','Acessórios']
const SIZES = ['PP','P','M','G','GG','XG','34','36','38','40','42','44','46']

export default function EntradaEstoquePage() {
  const supabase = createClient()
  const barcodeRef = useRef<HTMLInputElement>(null)

  // Form state
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [supplier, setSupplier] = useState('')
  const [size, setSize] = useState('M')
  const [color, setColor] = useState('')
  const [qty, setQty] = useState(1)
  const [cost, setCost] = useState('')
  const [priceMode, setPriceMode] = useState<PriceMode>('markup')
  const [markupVal, setMarkupVal] = useState(2.2)
  const [marginVal, setMarginVal] = useState(55)
  const [finalPrice, setFinalPrice] = useState('')
  const [scanStatus, setScanStatus] = useState<'idle'|'found'|'new'>('idle')
  const [cart, setCart] = useState<CartItem[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const costNum = parseFloat(cost) || 0
  const priceNum = parseFloat(finalPrice) || 0

  const suggestedPrice = costNum > 0
    ? priceMode === 'markup' ? priceFromMarkup(costNum, markupVal) : priceFromMargin(costNum, marginVal)
    : 0

  const realMargin = costNum > 0 && priceNum > 0 ? calcMargin(costNum, priceNum) : 0
  const realMarkup = costNum > 0 && priceNum > 0 ? calcMarkup(costNum, priceNum) : 0

  const marginColor = realMargin >= 50 ? 'text-green-700 bg-green-50' : realMargin >= 33 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'

  async function onBarcodeScan(code: string) {
    setBarcode(code)
    if (code.length < 4) { setScanStatus('idle'); return }
    // Busca produto existente
    const { data } = await supabase.from('products').select('*').eq('barcode', code).maybeSingle()
    if (data) {
      setName(data.name); setCategory(data.category_id || ''); setScanStatus('found')
    } else {
      setScanStatus('new')
    }
  }

  function useSuggested() {
    setFinalPrice(suggestedPrice.toFixed(2))
  }

  function addToCart() {
    if (!name || !cost || !finalPrice) return
    const item: CartItem = {
      id: crypto.randomUUID(), name, category, size, color, barcode,
      qty, cost: costNum, price: priceNum,
      margin: realMargin,
    }
    setCart(prev => [...prev, item])
    // reset campos de produto
    setBarcode(''); setName(''); setColor(''); setCost(''); setFinalPrice('')
    setQty(1); setScanStatus('idle')
    barcodeRef.current?.focus()
  }

  async function confirmEntry() {
    if (!cart.length) return
    setSaving(true)
    // Get tenant_id from current user's profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) { setSaving(false); return }
    const tenantId = profile.tenant_id

    for (const item of cart) {
      const internalCode = `PROD-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
      const { data: product } = await supabase.from('products').insert({
        tenant_id: tenantId,
        name: item.name, barcode: item.barcode || null,
        internal_code: internalCode,
        cost_price: item.cost, sale_price: item.price,
      }).select().maybeSingle()
      if (product) {
        const items = Array.from({ length: item.qty }, (_, i) => ({
          tenant_id: tenantId,
          product_id: product.id,
          item_code: `${internalCode}-${item.size}-${item.color?.slice(0,3).toUpperCase() || 'SEM'}-${String(i+1).padStart(4,'0')}`,
          size: item.size, color: item.color,
          status: 'in_stock', purchase_cost: item.cost, purchase_date: new Date().toISOString().split('T')[0],
        }))
        await supabase.from('product_items').insert(items)
      }
    }
    setSaving(false); setSaved(true)
    setTimeout(() => { setCart([]); setSaved(false) }, 2000)
  }

  const totalCost = cart.reduce((a, i) => a + i.cost * i.qty, 0)
  const totalRev  = cart.reduce((a, i) => a + i.price * i.qty, 0)
  const totalQty  = cart.reduce((a, i) => a + i.qty, 0)
  const avgMargin = totalRev > 0 ? ((totalRev - totalCost) / totalRev * 100) : 0

  return (
    <div className="flex h-full">
      {/* Esquerda: formulário */}
      <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200">
        <h1 className="text-lg font-medium mb-1">Entrada de Estoque</h1>
        <p className="text-sm text-gray-500 mb-6">Compra / recebimento de mercadoria</p>

        {/* Scanner */}
        <div className={`border-2 rounded-xl p-4 mb-5 transition-colors ${barcode ? 'border-brand-400' : 'border-dashed border-gray-300'}`}>
          <div className="flex items-center gap-3">
            <Barcode className={`flex-shrink-0 ${scanStatus === 'found' ? 'text-green-600' : 'text-brand-400'}`} size={24} />
            <input
              ref={barcodeRef}
              className="flex-1 bg-transparent border-none outline-none font-mono text-base tracking-widest text-gray-900 placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400 placeholder:text-sm"
              placeholder="Bipe o código ou digite o código interno..."
              value={barcode}
              onChange={e => onBarcodeScan(e.target.value)}
              autoFocus
            />
            {scanStatus === 'found' && <span className="badge badge-green text-xs">Produto encontrado</span>}
            {scanStatus === 'new' && <span className="badge badge-amber text-xs">Novo produto</span>}
          </div>
          <p className="text-xs text-gray-400 mt-2 ml-9">
            Após o bipe, os campos preenchem automaticamente se a peça já foi cadastrada.
          </p>
        </div>

        {/* Dados do produto */}
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Dados do produto</p>
        <div className="space-y-3 mb-5">
          <div>
            <label className="label">Nome do produto *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Vestido Floral Manga Longa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Selecione...</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input className="input" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nome do fornecedor" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Tamanho</label>
              <select className="input" value={size} onChange={e => setSize(e.target.value)}>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cor</label>
              <input className="input" value={color} onChange={e => setColor(e.target.value)} placeholder="Rosa, Preta..." />
            </div>
            <div>
              <label className="label">Quantidade</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-100 transition-colors">−</button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(99, q + 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-100 transition-colors">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Custo */}
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Custo de compra</p>
        <div className="mb-5">
          <label className="label">Preço de custo por peça *</label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
            <input
              className="input pl-8"
              type="number" step="0.50" min="0"
              value={cost} onChange={e => setCost(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Formação de preço */}
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Formação de preço de revenda</p>
        <div className="border border-gray-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Calculadora de preço</span>
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
              {(['markup','margin'] as PriceMode[]).map(m => (
                <button key={m} onClick={() => setPriceMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${priceMode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {m === 'markup' ? 'Markup' : 'Margem %'}
                </button>
              ))}
            </div>
          </div>

          {priceMode === 'markup' ? (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600 w-40 flex-shrink-0">Markup (x vezes o custo)</span>
              <input type="range" min="1.2" max="5" step="0.05" value={markupVal}
                onChange={e => setMarkupVal(parseFloat(e.target.value))}
                className="flex-1 accent-brand-600" />
              <span className="text-sm font-medium w-12 text-right">{markupVal.toFixed(2).replace('.',',')}x</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600 w-40 flex-shrink-0">Margem de lucro</span>
              <input type="range" min="20" max="80" step="1" value={marginVal}
                onChange={e => setMarginVal(parseInt(e.target.value))}
                className="flex-1 accent-brand-600" />
              <span className="text-sm font-medium w-12 text-right">{marginVal}%</span>
            </div>
          )}

          {/* Caixa sugestão */}
          <div className="bg-brand-50 rounded-xl p-3 flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium mb-1">
                <Sparkles size={11} /> Preço sugerido pelo sistema
              </div>
              <div className="text-2xl font-medium text-brand-800">
                {suggestedPrice > 0 ? formatCurrency(suggestedPrice) : 'R$ —'}
              </div>
              {suggestedPrice > 0 && (
                <div className="text-xs text-brand-600 mt-0.5">
                  {priceMode === 'markup'
                    ? `Markup ${markupVal.toFixed(2)}x · Margem ${calcMargin(costNum, suggestedPrice).toFixed(1)}%`
                    : `Margem ${marginVal}% · Markup ${calcMarkup(costNum, suggestedPrice).toFixed(2)}x`}
                </div>
              )}
            </div>
            <button onClick={useSuggested} disabled={!suggestedPrice}
              className="btn btn-primary text-xs disabled:opacity-40">
              Usar este preço
            </button>
          </div>

          {/* Preço final livre */}
          <div>
            <label className="label">Preço de venda final <span className="text-gray-400 font-normal">(você pode ajustar)</span></label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
                <input className="input pl-8" type="number" step="0.50" min="0"
                  value={finalPrice} onChange={e => setFinalPrice(e.target.value)}
                  placeholder="0,00" />
              </div>
              {priceNum > 0 && costNum > 0 && (
                <span className={`text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap ${marginColor}`}>
                  {realMargin.toFixed(1)}% · {realMarkup.toFixed(2)}x
                </span>
              )}
            </div>
            {priceNum > 0 && costNum > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                Lucro por peça: {formatCurrency(priceNum - costNum)} · Lote ({qty} un): {formatCurrency((priceNum - costNum) * qty)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={addToCart}
          disabled={!name || !costNum || !priceNum}
          className="btn btn-primary w-full justify-center py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={15} /> Adicionar ao lote desta entrada
        </button>
      </div>

      {/* Direita: carrinho */}
      <div className="w-80 p-5 bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Lote desta entrada</p>
            <p className="text-xs text-gray-500 mt-0.5">{totalQty} peça{totalQty !== 1 ? 's' : ''} · {cart.length} produto{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {!cart.length && (
            <div className="text-center py-10 text-gray-400">
              <Barcode size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhum item ainda</p>
              <p className="text-xs">Bipe ou preencha e clique em "Adicionar"</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.size} · {item.color || '—'} · {item.category}</p>
                </div>
                <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{item.qty} un × {formatCurrency(item.cost)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(item.price)}/un</span>
                  <span className="text-green-700">{item.margin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-1 mb-3 text-sm">
              <div className="flex justify-between text-gray-500"><span>Custo total</span><span className="font-medium text-gray-800">{formatCurrency(totalCost)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Receita potencial</span><span className="font-medium text-green-700">{formatCurrency(totalRev)}</span></div>
              <div className="flex justify-between font-medium border-t border-gray-100 pt-2 mt-2"><span>Lucro potencial</span><span className="text-green-700">{formatCurrency(totalRev - totalCost)}</span></div>
              <p className="text-xs text-gray-400 text-right">Margem média: {avgMargin.toFixed(1)}%</p>
            </div>
            <button
              onClick={confirmEntry}
              disabled={saving || saved}
              className={`btn w-full justify-center py-2.5 ${saved ? 'bg-green-600 text-white border-green-600' : 'btn-primary'} disabled: