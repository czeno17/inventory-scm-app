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
  User,
  Mail,
  Package,
  Trash2,
  Edit2,
  DollarSign,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP, formatDatePH } from '@/lib/utils/currency'
import Link from 'next/link'

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
  warehouses?: { name: string }
}

type OrderItem = {
  id?: string
  item_id: string
  quantity_ordered: number
  unit_price: number
  status: string
  items?: {
    id: string
    name: string
    item_code: string
    unit_cost: number
  }
}

type FormData = {
  customer_name: string
  customer_email: string
  status: string
  priority: string
  warehouse_id: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Order | null>(null)
  const [form, setForm] = useState<FormData>({
    customer_name: '',
    customer_email: '',
    status: 'processing',
    priority: 'medium',
    warehouse_id: '',
    items: [{ item_id: '', quantity_ordered: 1, unit_price: 0, status: 'pending' }],
  })
  
  const supabase = createClient()

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true)
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      if (ordersData && ordersData.length > 0) {
        const warehouseIds = ordersData.map(order => order.warehouse_id).filter(id => id !== null)
        const { data: warehousesData } = await supabase
          .from('warehouses')
          .select('id, name')
          .in('id', warehouseIds)

        const ordersWithWarehouses = ordersData.map(order => ({
          ...order,
          warehouses: warehousesData?.find(w => w.id === order.warehouse_id) || null
        }))

        setOrders(ordersWithWarehouses)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load products for dropdown
  const loadProducts = async () => {
    const { data } = await supabase
      .from('items')
      .select('id, name, item_code, unit_cost')
      .eq('is_active', true)
      .order('name')
    setProducts(data || [])
  }

  // Load warehouses for dropdown
  const loadWarehouses = async () => {
    const { data } = await supabase
      .from('warehouses')
      .select('id, name')
      .eq('status', 'active')
    setWarehouses(data || [])
  }

  useEffect(() => {
    loadOrders()
    loadProducts()
    loadWarehouses()
  }, [])

  // Open modal for new/edit
  const openModal = (order?: Order) => {
    if (order) {
      setEditing(order)
      setForm({
        customer_name: order.customer_name,
        customer_email: order.customer_email || '',
        status: order.status,
        priority: order.priority,
        warehouse_id: order.warehouse_id || '',
        items: [{ item_id: '', quantity_ordered: 1, unit_price: 0, status: 'pending' }],
      })
    } else {
      setEditing(null)
      setForm({
        customer_name: '',
        customer_email: '',
        status: 'processing',
        priority: 'medium',
        warehouse_id: '',
        items: [{ item_id: '', quantity_ordered: 1, unit_price: 0, status: 'pending' }],
      })
    }
    setShowModal(true)
  }

  // Add item row
  const addItemRow = () => {
    setForm({
      ...form,
      items: [...form.items, { item_id: '', quantity_ordered: 1, unit_price: 0, status: 'pending' }],
    })
  }

  // Remove item row
  const removeItemRow = (index: number) => {
    if (form.items.length > 1) {
      const newItems = form.items.filter((_, i) => i !== index)
      setForm({ ...form, items: newItems })
    }
  }

  // Update item field
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-populate unit price when item selected
    if (field === 'item_id') {
      const selectedProduct = products.find(p => p.id === value)
      if (selectedProduct) {
        newItems[index].unit_price = selectedProduct.unit_cost || 0
      }
    }
    
    setForm({ ...form, items: newItems })
  }

  // Calculate total
  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0)
  }

  // Save order
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const total = calculateTotal()
      
      if (editing) {
        // Update order
        const { error } = await supabase
          .from('orders')
          .update({
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            status: form.status,
            priority: form.priority,
            warehouse_id: form.warehouse_id || null,
            total_amount: total,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing.id)

        if (error) throw error

        // Delete existing order details
        await supabase
          .from('order_details')
          .delete()
          .eq('order_id', editing.id)

        // Insert new order details
        for (const item of form.items) {
          if (item.item_id) {
            await supabase
              .from('order_details')
              .insert({
                order_id: editing.id,
                item_id: item.item_id,
                quantity_ordered: item.quantity_ordered,
                unit_price: item.unit_price,
                status: item.status || 'pending',
              })
          }
        }
      } else {
        // Create new order
        const orderNumber = `ORD-${Date.now()}`
        const { data: newOrder, error } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            order_date: new Date().toISOString().split('T')[0],
            status: form.status,
            priority: form.priority,
            warehouse_id: form.warehouse_id || null,
            total_amount: total,
          })
          .select()
          .single()

        if (error) throw error

        // Insert order details
        for (const item of form.items) {
          if (item.item_id) {
            await supabase
              .from('order_details')
              .insert({
                order_id: newOrder.id,
                item_id: item.item_id,
                quantity_ordered: item.quantity_ordered,
                unit_price: item.unit_price,
                status: item.status || 'pending',
              })
          }
        }
      }

      setShowModal(false)
      loadOrders()
    } catch (error) {
      console.error('Error saving order:', error)
      alert('Error saving order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Delete order
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      // Delete order details first
      await supabase
        .from('order_details')
        .delete()
        .eq('order_id', id)

      // Delete order
      await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      loadOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Error deleting order. Please try again.')
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

                  <td>
                    <div className="flex justify-center gap-1">
                      <Link 
                        href={`/orders/${order.id}`}
                        className="ui-button ui-button-ghost p-1.5"
                        title="View order details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="ui-button ui-button-ghost p-1.5 text-[var(--error)]"
                        title="Delete order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL - Create/Edit Order */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="ui-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Order' : 'Create New Order'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    className="ui-input"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Email</label>
                  <input
                    type="email"
                    className="ui-input"
                    value={form.customer_email}
                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="ui-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
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
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Warehouse</label>
                  <select
                    className="ui-input"
                    value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-[var(--border-default)] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Order Items</h3>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="ui-button ui-button-primary text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="col-span-5 form-group">
                        <label className="form-label">Product</label>
                        <select
                          className="ui-input"
                          value={item.item_id}
                          onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                          required
                        >
                          <option value="">Select product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.item_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 form-group">
                        <label className="form-label">Qty</label>
                        <input
                          type="number"
                          className="ui-input"
                          value={item.quantity_ordered}
                          onChange={(e) => updateItem(index, 'quantity_ordered', parseInt(e.target.value) || 1)}
                          min={1}
                          required
                        />
                      </div>

                      <div className="col-span-3 form-group">
                        <label className="form-label">Unit Price</label>
                        <input
                          type="number"
                          className="ui-input"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min={0}
                          required
                        />
                      </div>

                      <div className="col-span-1 form-group">
                        <label className="form-label">Total</label>
                        <p className="text-sm font-medium text-white pt-2">
                          {formatPHP(item.quantity_ordered * item.unit_price)}
                        </p>
                      </div>

                      <div className="col-span-1 form-group">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="ui-button ui-button-ghost p-1.5 text-[var(--error)] hover:bg-[var(--error-bg)]"
                          disabled={form.items.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-end mt-4 p-3 rounded-lg bg-[var(--bg-elevated)]">
                  <div className="text-right">
                    <p className="text-sm text-muted">Order Total</p>
                    <p className="text-2xl font-semibold">{formatPHP(calculateTotal())}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[var(--border-default)]">
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
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editing ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}