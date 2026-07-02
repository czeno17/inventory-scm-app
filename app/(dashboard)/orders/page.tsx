'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP, formatDatePH } from '@/lib/utils/currency'
import Link from 'next/link'  // ← Make sure this is imported

type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_email?: string
  order_date: string
  status: string
  priority: string
  total_amount: number
  warehouse_id?: string
  warehouses?: { name: string } | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // State for modal
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Order | null>(null)
  const [form, setForm] = useState<Partial<Order>>({})
  
  const supabase = createClient()

  // Load orders function - TWO QUERY APPROACH
  const loadOrders = async () => {
    try {
      setLoading(true)
      
      // 1. First, fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        setOrders([])
        return
      }

      // If there are no orders, set empty and return
      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        return
      }

      // 2. Get all unique warehouse IDs from orders
      const warehouseIds = ordersData
        .map(order => order.warehouse_id)
        .filter(id => id !== null)

      // 3. Fetch warehouse names
      let warehousesMap: Record<string, string> = {}
      
      if (warehouseIds.length > 0) {
        const { data: warehousesData } = await supabase
          .from('warehouses')
          .select('id, name')
          .in('id', warehouseIds)

        // Create a map for quick lookup
        warehousesMap = (warehousesData || []).reduce((acc, w) => {
          acc[w.id] = w.name
          return acc
        }, {} as Record<string, string>)
      }

      // 4. Combine orders with warehouse names
      const ordersWithWarehouses = ordersData.map(order => ({
        ...order,
        warehouses: order.warehouse_id ? { name: warehousesMap[order.warehouse_id] || 'Unknown' } : null
      }))

      setOrders(ordersWithWarehouses)
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Open modal for new/edit
  const openModal = (order?: Order) => {
    setEditing(order || null)
    setForm(
      order || {
        order_number: '',
        customer_name: '',
        customer_email: '',
        status: 'processing',
        priority: 'medium',
        total_amount: 0,
      }
    )
    setShowModal(true)
  }

  // Save to database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editing) {
        await supabase
          .from('orders')
          .update(form)
          .eq('id', editing.id)
      } else {
        await supabase
          .from('orders')
          .insert({
            ...form,
            order_date: new Date().toISOString().split('T')[0],
            order_number: `ORD-${Date.now()}`,
          })
      }
      
      setShowModal(false)
      loadOrders()
    } catch (error) {
      console.error('Error saving order:', error)
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return orders.filter(
      (order) =>
        order.customer_name?.toLowerCase().includes(term) ||
        order.order_number?.toLowerCase().includes(term)
    )
  }, [orders, search])

  const stats = useMemo(
    () => ({
      total: orders.length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }),
    [orders]
  )

  const statusBadge: Record<string, string> = {
    draft: '',
    confirmed: 'badge-info',
    processing: 'badge-warning',
    shipped: 'badge-info',
    delivered: 'badge-success',
    cancelled: 'badge-error',
  }

  const priorityBadge: Record<string, string> = {
    low: '',
    medium: 'badge-info',
    high: 'badge-warning',
    urgent: 'badge-error',
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-3 h-3" />
      case 'shipped':
        return <Truck className="w-3 h-3" />
      case 'processing':
        return <Clock className="w-3 h-3" />
      case 'cancelled':
        return <XCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-muted">Manage customer orders</p>
        </div>

        <button 
          onClick={() => openModal()}
          className="ui-button ui-button-primary"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { title: 'Total', value: stats.total },
          { title: 'Processing', value: stats.processing },
          { title: 'Shipped', value: stats.shipped },
          { title: 'Delivered', value: stats.delivered },
          { title: 'Cancelled', value: stats.cancelled },
        ].map((card) => (
          <div key={card.title} className="ui-card">
            <p className="text-xs uppercase tracking-wide text-muted">
              {card.title}
            </p>
            <p className="text-2xl font-semibold mt-2">
              {loading ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div className="ui-card">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted" />
          <input
            className="ui-input"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Warehouse</th>
              <th className="text-right">Total</th>
              <th className="text-right">Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted">
                  No orders found
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id}>
                  <td className="text-xs font-mono text-muted">
                    {order.order_number}
                  </td>

                  <td>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-muted">{order.customer_email}</div>
                  </td>

                  <td>
                    <span className={`badge ${statusBadge[order.status]} inline-flex items-center gap-1`}>
                      {statusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${priorityBadge[order.priority]}`}>
                      {order.priority}
                    </span>
                  </td>

                  <td>{order.warehouses?.name || '—'}</td>

                  <td className="text-right font-medium">
                    {formatPHP(order.total_amount)}
                  </td>

                  <td className="text-right text-muted">
                    {formatDatePH(order.order_date)}
                  </td>

                  {/* ✅ FIXED: Eye icon now navigates to order detail */}
                  <td>
                    <div className="flex justify-center">
                      <Link 
                        href={`/orders/${order.id}`}
                        className="ui-button ui-button-ghost p-2"
                        title="View order details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="ui-card w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Order' : 'Create New Order'}
            </h2>

            <form onSubmit={handleSave} className="form-section">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  className="ui-input"
                  value={form.customer_name || ''}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Email</label>
                <input
                  type="email"
                  className="ui-input"
                  value={form.customer_email || ''}
                  onChange={(e) =>
                    setForm({ ...form, customer_email: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="ui-input"
                  value={form.status || 'processing'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="ui-input"
                  value={form.priority || 'medium'}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  className="ui-input"
                  value={form.total_amount || 0}
                  onChange={(e) =>
                    setForm({ ...form, total_amount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ui-button ui-button-ghost flex-1"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ui-button ui-button-primary flex-1"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}