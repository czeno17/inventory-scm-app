'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Mail,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Save,
  X,
  Package,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP, formatDatePH } from '@/lib/utils/currency'
import Link from 'next/link'

type OrderDetail = {
  id: string
  order_number: string
  customer_name: string
  customer_email?: string
  order_date: string
  status: string
  priority: string
  total_amount: number
  warehouse_id: string
  created_at: string
  warehouses?: {
    name: string
    address: string
    city: string
  }
  order_details?: Array<{
    id: string
    quantity_ordered: number
    quantity_shipped: number
    unit_price: number
    line_total: number
    status: string
    items: {
      id: string
      name: string
      item_code: string
      category: string
    }
  }>
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [newItem, setNewItem] = useState({ item_id: '', quantity_ordered: 1, unit_price: 0 })
  const supabase = createClient()

  useEffect(() => {
    loadOrderDetail()
    loadProducts()
    loadWarehouses()
  }, [params.id])

  const loadProducts = async () => {
    const { data } = await supabase
      .from('items')
      .select('id, name, item_code, unit_cost')
      .eq('is_active', true)
      .order('name')
    setProducts(data || [])
  }

  const loadWarehouses = async () => {
    const { data } = await supabase
      .from('warehouses')
      .select('id, name')
      .eq('status', 'active')
    setWarehouses(data || [])
  }

  const loadOrderDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const orderId = params.id as string

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          warehouses (name, address, city)
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const { data: detailsData, error: detailsError } = await supabase
        .from('order_details')
        .select(`
          *,
          items (id, name, item_code, category)
        `)
        .eq('order_id', orderId)

      if (detailsError) throw detailsError

      const orderWithDetails = {
        ...orderData,
        order_details: detailsData || [],
      }

      setOrder(orderWithDetails)
      setEditForm({
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email || '',
        status: orderData.status,
        priority: orderData.priority,
        warehouse_id: orderData.warehouse_id || '',
      })
    } catch (err: any) {
      console.error('Error loading order:', err)
      setError(err.message || 'Order not found')
    } finally {
      setLoading(false)
    }
  }

  // Update order
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: editForm.customer_name,
          customer_email: editForm.customer_email,
          status: editForm.status,
          priority: editForm.priority,
          warehouse_id: editForm.warehouse_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order?.id)

      if (error) throw error

      setIsEditing(false)
      loadOrderDetail()
    } catch (err: any) {
      console.error('Error updating order:', err)
      alert('Error updating order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Update status only
  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Change order status to "${newStatus}"?`)) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order?.id)

      if (error) throw error

      loadOrderDetail()
    } catch (err: any) {
      console.error('Error updating status:', err)
      alert('Error updating status. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Delete order
  const handleDeleteOrder = async () => {
    if (!confirm('Are you sure you want to delete this order? This cannot be undone!')) return

    setSaving(true)
    try {
      // Delete order details first
      await supabase
        .from('order_details')
        .delete()
        .eq('order_id', order?.id)

      // Delete order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order?.id)

      if (error) throw error

      router.push('/orders')
    } catch (err: any) {
      console.error('Error deleting order:', err)
      alert('Error deleting order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Add item to order
  const handleAddItem = async () => {
    if (!newItem.item_id || newItem.quantity_ordered <= 0) {
      alert('Please select a product and enter a valid quantity')
      return
    }

    setSaving(true)
    try {
      const selectedProduct = products.find(p => p.id === newItem.item_id)
      const unitPrice = newItem.unit_price || selectedProduct?.unit_cost || 0

      const { error } = await supabase
        .from('order_details')
        .insert({
          order_id: order?.id,
          item_id: newItem.item_id,
          quantity_ordered: newItem.quantity_ordered,
          unit_price: unitPrice,
          status: 'pending',
        })

      if (error) throw error

      // Update order total
      await updateOrderTotal()

      setNewItem({ item_id: '', quantity_ordered: 1, unit_price: 0 })
      loadOrderDetail()
    } catch (err: any) {
      console.error('Error adding item:', err)
      alert('Error adding item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Remove item from order
  const handleRemoveItem = async (detailId: string) => {
    if (!confirm('Remove this item from the order?')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('order_details')
        .delete()
        .eq('id', detailId)

      if (error) throw error

      await updateOrderTotal()
      loadOrderDetail()
    } catch (err: any) {
      console.error('Error removing item:', err)
      alert('Error removing item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Update order total
  const updateOrderTotal = async () => {
    if (!order) return

    const { data: details } = await supabase
      .from('order_details')
      .select('quantity_ordered, unit_price')
      .eq('order_id', order.id)

    const newTotal = details?.reduce((sum, d) => sum + (d.quantity_ordered * d.unit_price), 0) || 0

    await supabase
      .from('orders')
      .update({
        total_amount: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'badge-info',
      confirmed: 'badge-info',
      processing: 'badge-warning',
      shipped: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-error',
    }
    return styles[status] || ''
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-[var(--success)]" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-[var(--info)]" />
      case 'processing':
        return <Clock className="w-5 h-5 text-[var(--warning)]" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-[var(--error)]" />
      default:
        return <Clock className="w-5 h-5 text-muted" />
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="page-container">
        <div className="ui-card text-center py-12">
          <AlertCircle className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
          <Link href="/orders" className="ui-button ui-button-primary mt-4 inline-flex">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="ui-button ui-button-ghost p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">
              Order #{order.order_number}
            </h1>
            <p className="text-sm text-muted">
              {formatDatePH(order.order_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${getStatusBadge(order.status)} inline-flex items-center gap-1`}>
            {getStatusIcon(order.status)}
            {order.status}
          </span>
          <span className={`badge ${
            order.priority === 'urgent' ? 'badge-error' :
            order.priority === 'high' ? 'badge-warning' :
            'badge-info'
          }`}>
            {order.priority}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="ui-button ui-button-primary"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          {isEditing ? 'Cancel Edit' : 'Edit Order'}
        </button>

        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <>
            <button
              onClick={() => handleStatusChange('processing')}
              className="ui-button ui-button-warning"
              disabled={order.status === 'processing'}
            >
              <Clock className="w-4 h-4 mr-2" />
              Processing
            </button>
            <button
              onClick={() => handleStatusChange('shipped')}
              className="ui-button ui-button-info"
              disabled={order.status === 'shipped'}
            >
              <Truck className="w-4 h-4 mr-2" />
              Ship
            </button>
            <button
              onClick={() => handleStatusChange('delivered')}
              className="ui-button ui-button-success"
              disabled={order.status === 'delivered'}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Deliver
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="ui-button ui-button-danger"
              disabled={order.status === 'cancelled'}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </>
        )}

        <button
          onClick={handleDeleteOrder}
          className="ui-button ui-button-danger"
          disabled={saving}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Order
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="ui-card">
          <h3 className="text-lg font-semibold mb-4">Edit Order</h3>
          <form onSubmit={handleUpdateOrder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  className="ui-input"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Email</label>
                <input
                  type="email"
                  className="ui-input"
                  value={editForm.customer_email}
                  onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="ui-input"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
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
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
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
                  value={editForm.warehouse_id}
                  onChange={(e) => setEditForm({ ...editForm, warehouse_id: e.target.value })}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="ui-button ui-button-primary"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="ui-button ui-button-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ui-card">
          <h3 className="text-sm text-muted mb-2">Customer</h3>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          {order.customer_email && (
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-muted" />
              <span className="text-sm">{order.customer_email}</span>
            </div>
          )}
        </div>

        <div className="ui-card">
          <h3 className="text-sm text-muted mb-2">Warehouse</h3>
          <p className="font-medium">{order.warehouses?.name || 'N/A'}</p>
          {order.warehouses?.address && (
            <p className="text-sm text-muted mt-1">{order.warehouses.address}</p>
          )}
        </div>

        <div className="ui-card">
          <h3 className="text-sm text-muted mb-2">Order Total</h3>
          <p className="text-2xl font-semibold">{formatPHP(order.total_amount)}</p>
          <p className="text-sm text-muted mt-1">
            {order.order_details?.length || 0} items
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="ui-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Order Items</h2>
        </div>

        {!order.order_details || order.order_details.length === 0 ? (
          <p className="text-center text-muted py-8">No items in this order</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Code</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {order.order_details.map((detail) => (
                  <tr key={detail.id}>
                    <td className="font-medium">{detail.items?.name || 'Unknown'}</td>
                    <td className="text-xs font-mono text-muted">
                      {detail.items?.item_code || 'N/A'}
                    </td>
                    <td className="text-right">{detail.quantity_ordered}</td>
                    <td className="text-right">{formatPHP(detail.unit_price)}</td>
                    <td className="text-right font-medium">{formatPHP(detail.line_total)}</td>
                    <td className="text-center">
                      <span className={`badge ${
                        detail.status === 'shipped' ? 'badge-success' :
                        detail.status === 'picked' ? 'badge-info' :
                        detail.status === 'allocated' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {detail.status || 'pending'}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleRemoveItem(detail.id)}
                        className="ui-button ui-button-ghost p-1.5 text-[var(--error)]"
                        title="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-right font-semibold">
                    Subtotal
                  </td>
                  <td className="text-right font-semibold">
                    {formatPHP(order.total_amount)}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Add Item Section */}
        <div className="mt-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
          <h4 className="font-medium mb-3">Add Item to Order</h4>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <select
                className="ui-input"
                value={newItem.item_id}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value)
                  setNewItem({
                    ...newItem,
                    item_id: e.target.value,
                    unit_price: product?.unit_cost || 0,
                  })
                }}
              >
                <option value="">Select product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.item_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <input
                type="number"
                className="ui-input"
                placeholder="Qty"
                value={newItem.quantity_ordered}
                onChange={(e) => setNewItem({ ...newItem, quantity_ordered: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            <div className="col-span-3">
              <input
                type="number"
                className="ui-input"
                placeholder="Price"
                value={newItem.unit_price}
                onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={handleAddItem}
                className="ui-button ui-button-primary w-full"
                disabled={saving}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => router.back()}
          className="ui-button ui-button-ghost"
        >
          Back to Orders
        </button>
      </div>
    </div>
  )
}