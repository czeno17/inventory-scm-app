'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Calendar,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
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
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadOrderDetail = async () => {
      try {
        setLoading(true)
        setError(null)

        const orderId = params.id as string

        // Fetch order with warehouse
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            warehouses (
              name,
              address,
              city
            )
          `)
          .eq('id', orderId)
          .single()

        if (orderError) throw orderError

        // Fetch order details with items
        const { data: detailsData, error: detailsError } = await supabase
          .from('order_details')
          .select(`
            *,
            items (
              name,
              item_code,
              category
            )
          `)
          .eq('order_id', orderId)

        if (detailsError) throw detailsError

        setOrder({
          ...orderData,
          order_details: detailsData || [],
        })
      } catch (err: any) {
        console.error('Error loading order:', err)
        setError(err.message || 'Order not found')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadOrderDetail()
    }
  }, [params.id])

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
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        
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
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => router.back()}
          className="ui-button ui-button-ghost"
        >
          Back to Orders
        </button>
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <>
            <button className="ui-button ui-button-primary">
              Update Status
            </button>
            <button className="ui-button ui-button-primary">
              <Truck className="w-4 h-4 mr-2" />
              Ship Order
            </button>
          </>
        )}
      </div>
    </div>
  )
}