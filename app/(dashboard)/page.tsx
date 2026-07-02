'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  Users,
  Warehouse,
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  CheckCircle,
  Truck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP } from '@/lib/utils/currency'
import { formatCompactPHP } from '@/lib/utils/format'
import Link from 'next/link'

type DashboardData = {
  // Key Metrics
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  lowStockItems: number
  outOfStockItems: number
  totalItems: number
  totalSuppliers: number
  totalWarehouses: number
  inventoryValue: number
  
  // Recent Orders
  recentOrders: Array<{
    id: string
    order_number: string
    customer_name: string
    status: string
    total_amount: number
    created_at: string
  }>
  
  // Low Stock Items
  lowStockItemsList: Array<{
    id: string
    name: string
    item_code: string
    quantity: number
    min_stock_level: number
    warehouse: string
  }>
  
  // Monthly Stats
  monthlyOrders: number
  monthlyRevenue: number
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalItems: 0,
    totalSuppliers: 0,
    totalWarehouses: 0,
    inventoryValue: 0,
    recentOrders: [],
    lowStockItemsList: [],
    monthlyOrders: 0,
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
  const loadDashboard = async () => {
    try {
      setLoading(true)

      // 1. Get order stats
      const { data: orders } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')

      const totalOrders = orders?.length || 0
      const pendingOrders = orders?.filter(o => o.status === 'processing' || o.status === 'draft').length || 0
      const processingOrders = orders?.filter(o => o.status === 'processing').length || 0

      // 2. Get this month's orders
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      
      const monthlyOrders = orders?.filter(o => o.created_at >= startOfMonth) || []
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

      // 3. Get low stock items - ✅ FIXED HERE
      const { data: stockData } = await supabase
        .from('stock')
        .select(`
          quantity,
          min_stock_level,
          items (id, name, item_code),
          warehouses (name)
        `)
        .order('quantity', { ascending: true })

      const lowStockItemsList = stockData
        ?.filter(s => s.quantity <= s.min_stock_level && s.quantity > 0)
        .map(s => ({
          id: s.items?.[0]?.id || '',           // ✅ FIXED
          name: s.items?.[0]?.name || 'Unknown', // ✅ FIXED
          item_code: s.items?.[0]?.item_code || '', // ✅ FIXED
          quantity: s.quantity || 0,
          min_stock_level: s.min_stock_level || 0,
          warehouse: s.warehouses?.[0]?.name || 'Unknown',
        })) || []

      const outOfStockItems = stockData?.filter(s => s.quantity === 0).length || 0

      // 4. Get recent orders (last 5)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      // 5. Get total items, suppliers, warehouses
      const [{ count: totalItems }, { count: totalSuppliers }, { count: totalWarehouses }] = await Promise.all([
        supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('suppliers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('warehouses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
      ])

      // 6. Get inventory value
      const { data: stockValue } = await supabase
        .from('stock')
        .select('quantity, items(unit_cost)')
      
      const inventoryValue = stockValue?.reduce(
        (total: number, row: any) =>
          total + row.quantity * (row.items?.unit_cost || 0),
        0
      ) || 0

      setData({
        totalOrders,
        pendingOrders,
        processingOrders,
        lowStockItems: lowStockItemsList.length,
        outOfStockItems,
        totalItems: totalItems || 0,
        totalSuppliers: totalSuppliers || 0,
        totalWarehouses: totalWarehouses || 0,
        inventoryValue,
        recentOrders: recentOrders || [],
        lowStockItemsList: lowStockItemsList.slice(0, 5),
        monthlyOrders: monthlyOrders.length,
        monthlyRevenue,
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  loadDashboard()
}, [])

  return (
    <div className="page-container">
      {/* HEADER - Removed the New Order button from here */}
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Philippines Inventory Overview</p>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="ui-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Total Orders</p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? '...' : data.totalOrders}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--primary-light)]">
              <ShoppingCart className="w-5 h-5 text-[var(--primary-default)]" />
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Pending Orders</p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? '...' : data.pendingOrders}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--warning-bg)]">
              <Clock className="w-5 h-5 text-[var(--warning)]" />
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Low Stock Items</p>
              <p className="text-2xl font-semibold mt-1 text-[var(--warning)]">
                {loading ? '...' : data.lowStockItems}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--warning-bg)]">
              <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Out of Stock</p>
              <p className="text-2xl font-semibold mt-1 text-[var(--error)]">
                {loading ? '...' : data.outOfStockItems}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--error-bg)]">
              <AlertCircle className="w-5 h-5 text-[var(--error)]" />
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ui-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Orders This Month</p>
              <p className="text-2xl font-semibold">
                {loading ? '...' : data.monthlyOrders}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--success-bg)]">
              <TrendingUp className="w-5 h-5 text-[var(--success)]" />
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Revenue This Month</p>
              <p className="text-2xl font-semibold">
                {loading ? '...' : formatPHP(data.monthlyRevenue)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--primary-light)]">
              <TrendingUp className="w-5 h-5 text-[var(--primary-default)]" />
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="ui-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-[var(--primary-default)] hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-muted py-8">Loading...</p>
          ) : data.recentOrders.length === 0 ? (
            <p className="text-center text-muted py-8">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]">
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted">{order.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatPHP(order.total_amount)}</span>
                    <span className={`badge ${
                      order.status === 'delivered' ? 'badge-success' :
                      order.status === 'shipped' ? 'badge-info' :
                      order.status === 'processing' ? 'badge-warning' :
                      order.status === 'cancelled' ? 'badge-error' :
                      ''
                    }`}>
                      {order.status}
                    </span>
                    <Link href={`/orders/${order.id}`} className="p-1.5 rounded hover:bg-[var(--overlay-light)]">
                      <Eye className="w-4 h-4 text-muted" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="ui-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
            <Link href="/stock" className="text-sm text-[var(--primary-default)] hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-muted py-8">Loading...</p>
          ) : data.lowStockItemsList.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto mb-2" />
              <p className="text-muted">All items are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.lowStockItemsList.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted">{item.item_code} • {item.warehouse}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      item.quantity === 0 ? 'text-[var(--error)]' : 'text-[var(--warning)]'
                    }`}>
                      {item.quantity} / {item.min_stock_level}
                    </p>
                    <p className="text-xs text-muted">min stock</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ui-card">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-[var(--primary-default)]" />
            <div>
              <p className="text-sm text-muted">Active Products</p>
              <p className="text-2xl font-semibold">{loading ? '...' : data.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[var(--primary-default)]" />
            <div>
              <p className="text-sm text-muted">Suppliers</p>
              <p className="text-2xl font-semibold">{loading ? '...' : data.totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center gap-3">
            <Warehouse className="w-8 h-8 text-[var(--primary-default)]" />
            <div>
              <p className="text-sm text-muted">Warehouses</p>
              <p className="text-2xl font-semibold">{loading ? '...' : data.totalWarehouses}</p>
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[var(--primary-default)]" />
            <div>
              <p className="text-sm text-muted">Inventory Value</p>
              <p className="text-2xl font-semibold">
                {loading ? '...' : formatCompactPHP(data.inventoryValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS - Now the only New Order button */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/orders" className="ui-card hover:border-[var(--primary-default)] transition-colors">
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-[var(--primary-default)]" />
            <span className="text-sm font-medium">New Order</span>
          </div>
        </Link>

        <Link href="/items" className="ui-card hover:border-[var(--primary-default)] transition-colors">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-[var(--primary-default)]" />
            <span className="text-sm font-medium">Add Product</span>
          </div>
        </Link>

        <Link href="/stock" className="ui-card hover:border-[var(--primary-default)] transition-colors">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-[var(--primary-default)]" />
            <span className="text-sm font-medium">Update Stock</span>
          </div>
        </Link>

        <Link href="/reports" className="ui-card hover:border-[var(--primary-default)] transition-colors">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[var(--primary-default)]" />
            <span className="text-sm font-medium">View Reports</span>
          </div>
        </Link>
      </div>
    </div>
  )
}