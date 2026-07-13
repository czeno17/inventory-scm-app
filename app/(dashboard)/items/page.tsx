'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Tag,
  DollarSign,
  Box,
  Filter,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP } from '@/lib/utils/currency'

type Item = {
  id: string
  item_code: string
  name: string
  description?: string
  uom: string
  item_type: string
  category?: string
  unit_cost: number
  lead_time_days: number
  safety_stock_level: number
  reorder_point: number
  is_active: boolean
  created_at: string
}

type FormData = {
  id?: string
  item_code: string
  name: string
  description: string
  uom: string
  item_type: string
  category: string
  unit_cost: number
  lead_time_days: number
  safety_stock_level: number
  reorder_point: number
  is_active: boolean
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [form, setForm] = useState<FormData>({
    item_code: '',
    name: '',
    description: '',
    uom: 'pcs',
    item_type: 'finished_good',
    category: '',
    unit_cost: 0,
    lead_time_days: 0,
    safety_stock_level: 0,
    reorder_point: 0,
    is_active: true,
  })

  const supabase = createClient()

  // Load items
  const loadItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  // Filter items
  const filteredItems = items
    .filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.item_code.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })

  // Get unique categories
  const categories = ['all', ...new Set(items.map(item => item.category).filter(Boolean))]

  // Open modal for new/edit
  const openModal = (item?: Item) => {
    if (item) {
      setEditing(item)
      setForm({
        id: item.id,
        item_code: item.item_code,
        name: item.name,
        description: item.description || '',
        uom: item.uom,
        item_type: item.item_type,
        category: item.category || '',
        unit_cost: item.unit_cost,
        lead_time_days: item.lead_time_days,
        safety_stock_level: item.safety_stock_level,
        reorder_point: item.reorder_point,
        is_active: item.is_active,
      })
    } else {
      setEditing(null)
      setForm({
        item_code: '',
        name: '',
        description: '',
        uom: 'pcs',
        item_type: 'finished_good',
        category: '',
        unit_cost: 0,
        lead_time_days: 0,
        safety_stock_level: 0,
        reorder_point: 0,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  // Save item
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editing) {
        const { error } = await supabase
          .from('items')
          .update({
            name: form.name,
            description: form.description,
            uom: form.uom,
            item_type: form.item_type,
            category: form.category,
            unit_cost: form.unit_cost,
            lead_time_days: form.lead_time_days,
            safety_stock_level: form.safety_stock_level,
            reorder_point: form.reorder_point,
            is_active: form.is_active,
          })
          .eq('id', editing.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('items')
          .insert({
            item_code: form.item_code,
            name: form.name,
            description: form.description,
            uom: form.uom,
            item_type: form.item_type,
            category: form.category,
            unit_cost: form.unit_cost,
            lead_time_days: form.lead_time_days,
            safety_stock_level: form.safety_stock_level,
            reorder_point: form.reorder_point,
            is_active: form.is_active,
          })

        if (error) throw error
      }

      setShowModal(false)
      loadItems()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Error saving item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Delete item (soft delete)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      loadItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item. Please try again.')
    }
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted">Manage your product catalog</p>
        </div>

        <button
          onClick={() => openModal()}
          className="ui-button ui-button-primary"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="ui-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              className="ui-input pl-10"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            <select
              className="ui-input w-40"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th className="text-right">Price</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted">
                  Loading products...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted">
                  No products found. Click "Add Product" to create one.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="text-xs font-mono text-muted">
                    {item.item_code}
                  </td>
                  <td>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted">{item.uom}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{item.category || 'Uncategorized'}</span>
                  </td>
                  <td className="text-right font-medium">
                    {formatPHP(item.unit_cost)}
                  </td>
                  <td>
                    <span className={`badge ${item.is_active ? 'badge-success' : 'badge-error'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => openModal(item)}
                        className="ui-button ui-button-ghost p-1.5"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="ui-button ui-button-ghost p-1.5 text-[var(--error)]"
                        title="Delete"
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

      {/* MODAL - Add/Edit Product */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="ui-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Product' : 'Add Product'}
            </h2>

            <form onSubmit={handleSave} className="form-section">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Item Code *</label>
                  <input
                    className="ui-input"
                    value={form.item_code}
                    onChange={(e) => setForm({ ...form, item_code: e.target.value })}
                    required
                    disabled={!!editing}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="ui-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="ui-input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <select
                    className="ui-input"
                    value={form.uom}
                    onChange={(e) => setForm({ ...form, uom: e.target.value })}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="bag">Bag</option>
                    <option value="case">Case</option>
                    <option value="can">Can</option>
                    <option value="bottle">Bottle</option>
                    <option value="ream">Ream</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Item Type</label>
                  <select
                    className="ui-input"
                    value={form.item_type}
                    onChange={(e) => setForm({ ...form, item_type: e.target.value })}
                  >
                    <option value="finished_good">Finished Good</option>
                    <option value="raw_material">Raw Material</option>
                    <option value="consumable">Consumable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    className="ui-input"
                    placeholder="e.g. Electronics, Food"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Cost (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ui-input"
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Lead Time (days)</label>
                  <input
                    type="number"
                    className="ui-input"
                    value={form.lead_time_days}
                    onChange={(e) => setForm({ ...form, lead_time_days: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Safety Stock</label>
                  <input
                    type="number"
                    className="ui-input"
                    value={form.safety_stock_level}
                    onChange={(e) => setForm({ ...form, safety_stock_level: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reorder Point</label>
                  <input
                    type="number"
                    className="ui-input"
                    value={form.reorder_point}
                    onChange={(e) => setForm({ ...form, reorder_point: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
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
                  {loading ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}