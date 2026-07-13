'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Warehouse,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils/currency'

type StockItem = {
  id: string
  item_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  min_stock_level: number
  reorder_point: number
  items: {
    id: string
    name: string
    item_code: string
    category: string
    unit_cost: number
  }
  warehouses: {
    id: string
    name: string
    code: string
  }
}

type StockMovement = {
  quantity: number
  type: 'receipt' | 'issue' | 'adjustment'
  note: string
}

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null)
  const [correctionItem, setCorrectionItem] = useState<StockItem | null>(null)
  const [correctedQuantity, setCorrectedQuantity] = useState(0)
  const [movement, setMovement] = useState<StockMovement>({
    quantity: 0,
    type: 'receipt',
    note: '',
  })
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [stockData, setStockData] = useState<StockItem[]>([])

  const supabase = createClient()

  // Load stock with relations
  const loadStock = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('stock')
        .select(`
          *,
          items (id, name, item_code, category, unit_cost),
          warehouses (id, name, code)
        `)
        .order('quantity', { ascending: true })

      if (error) throw error
      setStock(data || [])
      setStockData(data || [])
    } catch (error) {
      console.error('Error loading stock:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load products for dropdown
  const loadProducts = async () => {
    const { data } = await supabase
      .from('items')
      .select('id, name, item_code')
      .eq('is_active', true)
      .order('name')
    setProducts(data || [])
  }

  // Load warehouses for dropdown
  const loadWarehouses = async () => {
    const { data } = await supabase
      .from('warehouses')
      .select('id, name, code')
      .eq('status', 'active')
    setWarehouses(data || [])
  }

  useEffect(() => {
    loadStock()
    loadProducts()
    loadWarehouses()
  }, [])

  // Filter stock
  const filteredStock = stock.filter(item => {
    const matchesSearch = 
      item.items?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.items?.item_code?.toLowerCase().includes(search.toLowerCase())
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouse_id === selectedWarehouse
    return matchesSearch && matchesWarehouse
  })

  // Open add stock modal
  const openAddStock = () => {
    setSelectedStockId(null)
    setSelectedProductId('')
    setSelectedWarehouseId('')
    setMovement({
      quantity: 0,
      type: 'receipt',
      note: '',
    })
    setShowModal(true)
  }

  // Quick update from table
  const quickUpdate = (stockItem: StockItem) => {
    setSelectedStockId(stockItem.id)
    setSelectedProductId(stockItem.item_id)
    setSelectedWarehouseId(stockItem.warehouse_id)
    setMovement({
      quantity: 0,
      type: 'receipt',
      note: '',
    })
    setShowModal(true)
  }

  // Open correction modal
  const openCorrection = (item: StockItem) => {
    setCorrectionItem(item)
    setCorrectedQuantity(item.quantity)
    setShowCorrectionModal(true)
  }

  // Handle stock movement
  const handleStockMovement = async () => {
    if (movement.quantity <= 0) {
      alert('Please enter a quantity')
      return
    }

    if (!selectedProductId || !selectedWarehouseId) {
      alert('Please select a product and warehouse')
      return
    }

    try {
      let stockRecord = stockData.find(
        s => s.item_id === selectedProductId && s.warehouse_id === selectedWarehouseId
      )

      let newQuantity = 0
      let currentQuantity = stockRecord?.quantity || 0

      if (movement.type === 'receipt') {
        newQuantity = currentQuantity + movement.quantity
      } else if (movement.type === 'issue') {
        newQuantity = currentQuantity - movement.quantity
        if (newQuantity < 0) {
          alert('Cannot issue more than available stock!')
          return
        }
      } else if (movement.type === 'adjustment') {
        newQuantity = movement.quantity
      }

      if (stockRecord) {
        const { error } = await supabase
          .from('stock')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stockRecord.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('stock')
          .insert({
            item_id: selectedProductId,
            warehouse_id: selectedWarehouseId,
            quantity: newQuantity,
            reserved_quantity: 0,
            min_stock_level: 0,
            reorder_point: 0,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
      }

      await supabase.from('stock_movements').insert({
        item_id: selectedProductId,
        warehouse_id: selectedWarehouseId,
        movement_type: movement.type,
        quantity_change: movement.type === 'receipt' ? movement.quantity : -movement.quantity,
        quantity_before: currentQuantity,
        quantity_after: newQuantity,
        notes: movement.note || `Stock ${movement.type}`,
        created_at: new Date().toISOString(),
      })

      setShowModal(false)
      loadStock()
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Error updating stock. Please try again.')
    }
  }

  // Handle correction
  const handleCorrection = async () => {
    if (!correctionItem) return

    if (correctedQuantity < 0) {
      alert('Quantity cannot be negative')
      return
    }

    try {
      const { error } = await supabase
        .from('stock')
        .update({
          quantity: correctedQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', correctionItem.id)

      if (error) throw error

      await supabase.from('stock_movements').insert({
        item_id: correctionItem.item_id,
        warehouse_id: correctionItem.warehouse_id,
        movement_type: 'adjustment',
        quantity_change: correctedQuantity - correctionItem.quantity,
        quantity_before: correctionItem.quantity,
        quantity_after: correctedQuantity,
        notes: `Manual correction: ${correctionItem.quantity} → ${correctedQuantity}`,
        created_at: new Date().toISOString(),
      })

      setShowCorrectionModal(false)
      loadStock()
    } catch (error) {
      console.error('Error correcting stock:', error)
      alert('Error correcting stock. Please try again.')
    }
  }

  // Get stock status
  const getStockStatus = (item: StockItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', color: 'badge-error' }
    if (item.quantity <= item.min_stock_level) return { label: 'Low Stock', color: 'badge-warning' }
    return { label: 'In Stock', color: 'badge-success' }
  }

  // Get current stock for selected product/warehouse
  const getCurrentStock = () => {
    const record = stockData.find(
      s => s.item_id === selectedProductId && s.warehouse_id === selectedWarehouseId
    )
    return record?.quantity || 0
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stock Management</h1>
          <p className="text-sm text-muted">Track inventory across all warehouses</p>
        </div>

        <button
          onClick={openAddStock}
          className="ui-button ui-button-primary"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="ui-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              className="ui-input pl-10"
              placeholder="Search stock by product name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="ui-input w-48"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ui-card">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-[var(--primary-default)]" />
            <div>
              <p className="text-sm text-muted">Total Items</p>
              <p className="text-2xl font-semibold">
                {stock.filter(s => s.quantity > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-[var(--warning)]" />
            <div>
              <p className="text-sm text-muted">Low Stock</p>
              <p className="text-2xl font-semibold text-[var(--warning)]">
                {stock.filter(s => s.quantity <= s.min_stock_level && s.quantity > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-[var(--error)]" />
            <div>
              <p className="text-sm text-muted">Out of Stock</p>
              <p className="text-2xl font-semibold text-[var(--error)]">
                {stock.filter(s => s.quantity === 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[var(--primary-default)]" />
            <div>
              <p className="text-sm text-muted">Total Value</p>
              <p className="text-2xl font-semibold">
                ₱{stock.reduce((sum, s) => sum + (s.quantity * (s.items?.unit_cost || 0)), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE - CENTERED QUANTITY COLUMNS */}
      <div className="table-container overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Warehouse</th>
              <th className="text-center px-4 py-3">Quantity</th>
              <th className="text-center px-4 py-3">Reserved</th>
              <th className="text-center px-4 py-3">Available</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  Loading stock...
                </td>
              </tr>
            ) : filteredStock.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  No stock found. Click "Add Stock" to add inventory.
                </td>
              </tr>
            ) : (
              filteredStock.map((item) => {
                const status = getStockStatus(item)
                return (
                  <tr key={item.id} className="border-b border-[var(--border-default)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{item.items?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted">{item.items?.item_code}</div>
                    </td>
                    <td className="px-4 py-3 text-white">{item.warehouses?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-center font-medium text-white">{formatNumber(item.quantity)}</td>
                    <td className="px-4 py-3 text-center text-muted">{formatNumber(item.reserved_quantity)}</td>
                    <td className="px-4 py-3 text-center font-medium text-white">
                      {formatNumber(item.available_quantity)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => quickUpdate(item)}
                          className="ui-button ui-button-ghost p-1.5"
                          title="Quick Update"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => openCorrection(item)}
                          className="ui-button ui-button-ghost p-1.5"
                          title="Correct Stock"
                        >
                          <RefreshCw className="w-4 h-4 text-[var(--warning)]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD STOCK MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="ui-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Update Stock</h2>

            <div className="space-y-4">
              {/* Product Selector */}
              <div className="form-group">
                <label className="form-label">Select Product *</label>
                <select
                  className="ui-input"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value)
                  }}
                >
                  <option value="">-- Select a product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.item_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse Selector */}
              <div className="form-group">
                <label className="form-label">Select Warehouse *</label>
                <select
                  className="ui-input"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  <option value="">-- Select a warehouse --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Stock */}
              {selectedProductId && selectedWarehouseId && (
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                  <p className="text-sm text-muted">Current Stock</p>
                  <p className="text-xl font-semibold">{getCurrentStock()} units</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Movement Type</label>
                <select
                  className="ui-input"
                  value={movement.type}
                  onChange={(e) => setMovement({ ...movement, type: e.target.value as any })}
                >
                  <option value="receipt">📥 Receive Stock</option>
                  <option value="issue">📤 Issue Stock</option>
                  <option value="adjustment">📝 Adjust Stock</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {movement.type === 'receipt' ? 'Quantity to Receive' :
                   movement.type === 'issue' ? 'Quantity to Issue' :
                   'New Quantity'}
                </label>
                <input
                  type="number"
                  className="ui-input"
                  value={movement.quantity}
                  onChange={(e) => setMovement({ ...movement, quantity: parseInt(e.target.value) || 0 })}
                  min={0}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Note</label>
                <input
                  className="ui-input"
                  placeholder="e.g., Received from supplier PO-2026-001"
                  value={movement.note}
                  onChange={(e) => setMovement({ ...movement, note: e.target.value })}
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
                  onClick={handleStockMovement}
                  className="ui-button ui-button-primary flex-1"
                  disabled={!selectedProductId || !selectedWarehouseId || movement.quantity <= 0}
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      {showCorrectionModal && correctionItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="ui-card w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Correct Stock</h2>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                <p className="text-sm text-muted">Product</p>
                <p className="font-medium">{correctionItem.items?.name}</p>
                <p className="text-xs text-muted">Current Stock: {correctionItem.quantity} units</p>
              </div>

              <div className="form-group">
                <label className="form-label">Correct Quantity *</label>
                <input
                  type="number"
                  className="ui-input"
                  value={correctedQuantity}
                  onChange={(e) => setCorrectedQuantity(parseInt(e.target.value) || 0)}
                  min={0}
                  required
                />
                <p className="text-xs text-muted">
                  Enter the correct stock quantity. This will replace the current value.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="ui-button ui-button-ghost flex-1"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCorrection}
                  className="ui-button ui-button-primary flex-1"
                >
                  Correct Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}