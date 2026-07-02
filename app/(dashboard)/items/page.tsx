'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP } from '@/lib/utils/currency'

type Item = {
  id: string
  item_code: string
  name: string
  category?: string
  unit_cost?: number
  is_active?: boolean
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase.from('items').select('*').order('name')
      setItems(data || [])
      setLoading(false)
    }
    loadItems()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return items.filter(i =>
      i.name?.toLowerCase().includes(term) ||
      i.item_code?.toLowerCase().includes(term)
    )
  }, [items, search])

  return (
    <div className="page-container">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted">Manage your product catalog</p>
        </div>

        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="ui-button ui-button-primary"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* SEARCH */}
      <div className="ui-card">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted" />
          <input
            className="ui-input"
            placeholder="Search products..."
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
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th className="text-right">Price</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td className="text-xs text-muted font-mono">
                    {item.item_code}
                  </td>

                  <td className="font-medium">
                    {item.name}
                  </td>

                  <td>
                    <span className="badge badge-info">
                      {item.category || 'Uncategorized'}
                    </span>
                  </td>

                  <td className="text-right font-medium">
                    {formatPHP(item.unit_cost || 0)}
                  </td>

                  <td className="text-center">
                    <span className={`badge ${item.is_active ? 'badge-success' : 'badge-error'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => { setEditing(item); setShowModal(true) }}
                        className="ui-button ui-button-ghost p-1.5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button className="ui-button ui-button-ghost p-1.5 text-[var(--error)]">
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          
          <div className="ui-card w-full max-w-md">

            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Product' : 'Add Product'}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setShowModal(false)
              }}
              className="form-section"
            >

              <div className="form-group">
                <label className="form-label">Product Code</label>
                <input
                  defaultValue={editing?.item_code || ''}
                  className="ui-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  defaultValue={editing?.name || ''}
                  className="ui-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  defaultValue={editing?.category || ''}
                  className="ui-input"
                >
                  <option value="">Select category</option>
                  <option>Electronics</option>
                  <option>Appliances</option>
                  <option>Construction</option>
                  <option>Food</option>
                  <option>Health</option>
                  <option>Office</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price (PHP)</label>
                <input
                  type="number"
                  defaultValue={editing?.unit_cost || ''}
                  className="ui-input"
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
                  {editing ? 'Update' : 'Add'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}