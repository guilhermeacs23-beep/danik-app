export type UserRole = 'owner' | 'seller' | 'readonly'

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'starter' | 'pro' | 'rede'
  settings: Record<string, unknown>
}

export interface Profile {
  id: string
  tenant_id: string
  name: string
  role: UserRole
  phone?: string
  avatar_url?: string
}

export interface Supplier {
  id: string
  tenant_id: string
  name: string
  cnpj?: string
  phone?: string
  whatsapp?: string
  email?: string
  city?: string
  active: boolean
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  parent_id?: string
}

export interface Product {
  id: string
  tenant_id: string
  internal_code: string
  barcode?: string
  name: string
  category_id?: string
  supplier_id?: string
  brand?: string
  cost_price: number
  sale_price: number
  markup: number
  margin_pct: number
  min_stock: number
  photos: string[]
  active: boolean
  created_at: string
  // joined
  category?: Category
  supplier?: Supplier
  stock_count?: number
}

export type ItemStatus = 'in_stock' | 'in_suitcase' | 'sold' | 'returned' | 'lost' | 'damaged'

export interface ProductItem {
  id: string
  tenant_id: string
  product_id: string
  item_code: string
  size?: string
  color?: string
  status: ItemStatus
  purchase_date?: string
  purchase_cost?: number
  current_suitcase_id?: string
  current_customer_id?: string
  sold_at?: string
  sale_id?: string
  sold_price?: number
  created_at: string
  // joined
  product?: Product
}

export interface ItemHistoryEntry {
  id: string
  item_id: string
  event_type: string
  event_at: string
  from_status?: string
  to_status?: string
  customer_id?: string
  suitcase_id?: string
  sale_id?: string
  user_id?: string
  notes?: string
  // joined
  customer?: Customer
}

export type CustomerSegment = 'new' | 'regular' | 'vip' | 'at_risk' | 'churned'
export type CustomerStatus = 'active' | 'inactive' | 'blocked'

export interface Customer {
  id: string
  tenant_id: string
  name: string
  cpf?: string
  birth_date?: string
  phone?: string
  whatsapp?: string
  email?: string
  instagram?: string
  address?: string
  neighborhood?: string
  city?: string
  state?: string
  credit_limit: number
  credit_used: number
  credit_score: number
  status: CustomerStatus
  segment: CustomerSegment
  notes?: string
  created_at: string
  // computed
  credit_available?: number
}

export type SuitcaseStatus = 'open' | 'partial_return' | 'closed' | 'overdue'

export interface Suitcase {
  id: string
  tenant_id: string
  code: string
  customer_id: string
  sent_at: string
  expected_return: string
  returned_at?: string
  status: SuitcaseStatus
  total_items: number
  total_value: number
  items_sold: number
  value_sold: number
  items_returned: number
  notes?: string
  created_at: string
  // joined
  customer?: Customer
  days_overdue?: number
}

export interface SuitcaseItem {
  id: string
  suitcase_id: string
  item_id: string
  status: 'with_customer' | 'sold' | 'returned' | 'lost'
  consignment_price?: number
  resolved_at?: string
  sale_id?: string
  // joined
  item?: ProductItem
}

export type PaymentMethod = 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'store_credit' | 'mixed'
export type SaleType = 'in_store' | 'online' | 'suitcase'

export interface Sale {
  id: string
  tenant_id: string
  code: string
  customer_id?: string
  sale_type: SaleType
  suitcase_id?: string
  subtotal: number
  discount_value: number
  total: number
  payment_method: PaymentMethod
  installments: number
  status: 'completed' | 'cancelled' | 'partial_return'
  seller_id?: string
  commission_value: number
  created_at: string
  // joined
  customer?: Customer
}

export interface CreditAccount {
  id: string
  tenant_id: string
  customer_id: string
  sale_id?: string
  total_amount: number
  installments: number
  installment_value: number
  first_due_date: string
  status: 'active' | 'paid' | 'defaulted'
  amount_paid: number
  amount_pending: number
  created_at: string
  // joined
  customer?: Customer
}

export interface CreditInstallment {
  id: string
  account_id: string
  customer_id: string
  installment_num: number
  amount: number
  due_date: string
  paid_at?: string
  paid_amount?: number
  payment_method?: string
  late_fee: number
  status: 'pending' | 'paid' | 'overdue' | 'negotiated'
  days_overdue: number
  // joined
  customer?: Customer
}

export interface TripLog {
  id: string
  tenant_id: string
  suitcase_id?: string
  customer_id?: string
  trip_date: string
  trip_type: 'delivery' | 'pickup' | 'delivery_pickup'
  distance_km: number
  cost_per_km: number
  total_cost: number
  generated_sale: boolean
  sale_value: number
  notes?: string
  created_at: string
  // joined
  customer?: Customer
  suitcase?: Suitcase
}

export interface DashboardStats {
  revenue_today: number
  revenue_month: number
  revenue_month_prev: number
  open_suitcases: number
  overdue_suitcases: number
  credit_receivable: number
  credit_overdue: number
  km_month: number
  km_cost_month: number
  top_products: { name: string; qty: number }[]
  top_customers: { name: string; total: number }[]
  revenue_7days: { date: string; total: number }[]
}
