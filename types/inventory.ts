/* =========================
   ENUMS
========================= */

export type UUID = string

export type ItemType =
  | 'raw_material'
  | 'finished_good'
  | 'consumable'

export type WarehouseStatus =
  | 'active'
  | 'inactive'

export type MovementType =
  | 'receipt'
  | 'issue'
  | 'transfer'
  | 'adjustment'
  | 'return'

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export type OrderDetailStatus =
  | 'pending'
  | 'allocated'
  | 'picked'
  | 'shipped'

/* =========================
   SHARED TYPES
========================= */

export interface BaseEntity {
  id: UUID
  created_at: string
  updated_at?: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export interface ApiResponse<T> {
  data: T
  error: string | null
}

export interface SelectOption {
  label: string
  value: string
}

export interface DashboardStats {
  items: number
  suppliers: number
  warehouses: number
  value: number
}

/* =========================
   ITEM
========================= */

export interface Item extends BaseEntity {
  item_code: string
  name: string
  description?: string
  uom: string
  item_type: ItemType
  category?: string
  unit_cost?: number
  lead_time_days?: number
  safety_stock_level?: number
  reorder_point?: number
  is_active: boolean

  supplier_id?: UUID
  suppliers?: Supplier
}

/* =========================
   SUPPLIER
========================= */

export interface Supplier extends BaseEntity {
  supplier_code: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
  is_active: boolean
}

/* =========================
   WAREHOUSE
========================= */

export interface Warehouse extends BaseEntity {
  code: string
  name: string
  address?: string
  city?: string
  country?: string
  status: WarehouseStatus
}

/* =========================
   STOCK
========================= */

export interface Stock extends BaseEntity {
  item_id: UUID
  warehouse_id: UUID
  subinventory_id?: UUID

  quantity: number
  reserved_quantity: number
  available_quantity: number

  min_stock_level?: number
  reorder_point?: number
  last_count_date?: string

  items?: Item
  warehouses?: Warehouse
}

/* =========================
   STOCK MOVEMENT
========================= */

export interface StockMovement extends BaseEntity {
  item_id: UUID
  warehouse_id: UUID
  subinventory_id?: UUID

  movement_type: MovementType

  quantity_change: number
  quantity_before: number
  quantity_after: number

  unit_cost?: number

  reference_document_type?: string
  reference_document_id?: UUID
  transaction_type_id?: UUID

  notes?: string

  items?: Item
  warehouses?: Warehouse
  transaction_type?: TransactionType
}

/* =========================
   ORDER
========================= */

export interface Order extends BaseEntity {
  order_number: string
  customer_name: string
  customer_email?: string

  order_date: string

  status: OrderStatus
  priority: Priority

  warehouse_id: UUID

  total_amount: number

  warehouses?: Warehouse
  order_details?: OrderDetail[]
}

/* =========================
   ORDER DETAIL
========================= */

export interface OrderDetail extends BaseEntity {
  order_id: UUID
  item_id: UUID

  quantity_ordered: number
  quantity_shipped: number

  unit_price: number
  line_total: number

  status: OrderDetailStatus

  items?: Item
  orders?: Order
}

/* =========================
   TRANSACTION TYPE
========================= */

export interface TransactionType extends BaseEntity {
  code: string
  name: string

  movement_type: MovementType

  sign: -1 | 0 | 1

  description?: string

  is_active: boolean
}