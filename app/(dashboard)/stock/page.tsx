'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP, formatNumber } from '@/lib/utils/currency'

export default function StockPage() {
  const [stock, setStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadStock = async () => {
      try {
        setLoading(true)

        const supabase = createClient()

        const { data } = await supabase
          .from('stock')
          .select(`
            id,
            quantity,
            available_quantity,
            items (
              name,
              item_code,
              unit_cost
            ),
            warehouses (
              name
            )
          `)
          .order('created_at', { ascending: false })

        setStock(data || [])
      } finally {
        setLoading(false)
      }
    }

    loadStock()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()

    return stock.filter(
      (item) =>
        item.items?.name?.toLowerCase().includes(term) ||
        item.items?.item_code?.toLowerCase().includes(term) ||
        item.warehouses?.name?.toLowerCase().includes(term)
    )
  }, [stock, search])

  const totalItems = useMemo(
    () =>
      stock.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      ),
    [stock]
  )

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Stock
          </h1>

          <p className="text-sm text-muted">
            Monitor inventory across warehouses
          </p>
        </div>

        <div className="ui-card px-5 py-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--primary-default)]" />

            <span className="font-semibold">
              {loading
                ? '...'
                : `${formatNumber(totalItems)} Units`}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="ui-card">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted" />

          <input
            className="ui-input"
            placeholder="Search products or warehouses..."
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
              <th>Product</th>
              <th>Warehouse</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Available</th>
              <th className="text-right">Value</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-muted"
                >
                  No stock found
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const value =
                  (item.available_quantity || 0) *
                  (item.items?.unit_cost || 0)

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium">
                        {item.items?.name || 'Unknown'}
                      </div>

                      <div className="text-xs text-muted font-mono">
                        {item.items?.item_code}
                      </div>
                    </td>

                    <td>
                      {item.warehouses?.name || 'Unknown'}
                    </td>

                    <td className="text-right font-medium">
                      {formatNumber(item.quantity)}
                    </td>

                    <td className="text-right">
                      <span className="badge badge-info">
                        {formatNumber(item.available_quantity)}
                      </span>
                    </td>

                    <td className="text-right font-medium">
                      {formatPHP(value)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}