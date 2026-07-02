'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Supplier = {
  id: string
  supplier_code: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  is_active?: boolean
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState<Partial<Supplier>>({})

  const supabase = createClient()

  const loadSuppliers = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')

    setSuppliers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()

    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.supplier_code?.toLowerCase().includes(term)
    )
  }, [suppliers, search])

  const openModal = (supplier?: Supplier) => {
    setEditing(supplier || null)

    setForm(
      supplier || {
        supplier_code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        is_active: true,
      }
    )

    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editing) {
      await supabase
        .from('suppliers')
        .update(form)
        .eq('id', editing.id)
    } else {
      await supabase.from('suppliers').insert({
        ...form,
        is_active: true,
      })
    }

    setShowModal(false)
    loadSuppliers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return

    await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id)

    loadSuppliers()
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Suppliers</h1>
          <p className="text-sm text-muted">
            Manage your supplier directory
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="ui-button ui-button-primary"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* SEARCH */}
      <div className="ui-card">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted" />

          <input
            className="ui-input"
            placeholder="Search suppliers..."
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
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  No suppliers found
                </td>
              </tr>
            ) : (
              filtered.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="text-xs font-mono text-muted">
                    {supplier.supplier_code}
                  </td>

                  <td className="font-medium">
                    {supplier.name}
                  </td>

                  <td>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted" />
                      {supplier.contact_person || '-'}
                    </div>
                  </td>

                  <td>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted" />
                      {supplier.email || '-'}
                    </div>
                  </td>

                  <td>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted" />
                      {supplier.phone || '-'}
                    </div>
                  </td>

                  <td className="text-center">
                    <span
                      className={`badge ${
                        supplier.is_active
                          ? 'badge-success'
                          : 'badge-error'
                      }`}
                    >
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => openModal(supplier)}
                        className="ui-button ui-button-ghost p-1.5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="ui-button ui-button-ghost p-1.5 text-[var(--error)]"
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="ui-card w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Supplier' : 'Add Supplier'}
            </h2>

            <form onSubmit={handleSave} className="form-section">
              <div className="form-group">
                <label className="form-label">Supplier Code</label>
                <input
                  className="ui-input"
                  value={form.supplier_code || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      supplier_code: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  className="ui-input"
                  value={form.name || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  className="ui-input"
                  value={form.contact_person || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact_person: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="ui-input"
                  value={form.email || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="ui-input"
                  value={form.phone || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="ui-input"
                  rows={3}
                  value={form.address || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
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