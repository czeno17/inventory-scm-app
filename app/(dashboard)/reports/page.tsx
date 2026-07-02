'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  TrendingUp,
  Package,
  Warehouse,
  Users,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPHP, formatNumber } from '@/lib/utils/currency'

type Stats = {
  totalItems: number
  totalWarehouses: number
  totalSuppliers: number
  totalValue: number
  categories: Record<string, number>
  warehouseStock: Record<string, number>
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    totalWarehouses: 0,
    totalSuppliers: 0,
    totalValue: 0,
    categories: {},
    warehouseStock: {},
  })

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true)

        const supabase = createClient()

        const [
          { count: items },
          { count: warehouses },
          { count: suppliers },
          { data: stockData },
        ] = await Promise.all([
          supabase
            .from('items')
            .select('*', { count: 'exact', head: true }),

          supabase
            .from('warehouses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active'),

          supabase
            .from('suppliers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),

          supabase.from('stock').select(`
            quantity,
            items (
              category,
              unit_cost
            ),
            warehouses (
              name
            )
          `),
        ])

        let totalValue = 0

        const categories: Record<string, number> = {}
        const warehouseStock: Record<string, number> = {}

        stockData?.forEach((row: any) => {
          const qty = row.quantity ?? 0
          const cost = row.items?.unit_cost ?? 0
          const category = row.items?.category ?? 'Uncategorized'
          const warehouse = row.warehouses?.name ?? 'Unknown'

          totalValue += qty * cost

          categories[category] =
            (categories[category] || 0) + qty

          warehouseStock[warehouse] =
            (warehouseStock[warehouse] || 0) + qty
        })

        setStats({
          totalItems: items || 0,
          totalWarehouses: warehouses || 0,
          totalSuppliers: suppliers || 0,
          totalValue,
          categories,
          warehouseStock,
        })
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  const categoryEntries = useMemo(
    () => Object.entries(stats.categories),
    [stats.categories]
  )

  const warehouseEntries = useMemo(
    () => Object.entries(stats.warehouseStock),
    [stats.warehouseStock]
  )

  const maxCategory = Math.max(
    ...categoryEntries.map(([, value]) => value),
    1
  )

  const maxWarehouse = Math.max(
    ...warehouseEntries.map(([, value]) => value),
    1
  )

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
  ]

  const cards = [
    {
      title: 'Inventory Value',
      value: formatPHP(stats.totalValue),
      icon: TrendingUp,
    },
    {
      title: 'Products',
      value: stats.totalItems,
      icon: Package,
    },
    {
      title: 'Warehouses',
      value: stats.totalWarehouses,
      icon: Warehouse,
    },
    {
      title: 'Suppliers',
      value: stats.totalSuppliers,
      icon: Users,
    },
  ]

  // ✅ ADD EXPORT FUNCTIONALITY
  const handleExport = async () => {
    try {
      setExporting(true)

      const supabase = createClient()

      // Fetch all data for export
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .order('name')

      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('*')
        .eq('status', 'active')

      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)

      const { data: stock } = await supabase
        .from('stock')
        .select(`
          quantity,
          items (
            name,
            category,
            unit_cost
          ),
          warehouses (
            name
          )
        `)

      // Format data for CSV
      const reportData = {
        summary: {
          'Total Products': stats.totalItems,
          'Total Warehouses': stats.totalWarehouses,
          'Total Suppliers': stats.totalSuppliers,
          'Total Inventory Value': formatPHP(stats.totalValue),
          'Average Value per Warehouse': formatPHP(stats.totalValue / (stats.totalWarehouses || 1)),
          'Total Categories': categoryEntries.length,
          'Generated On': new Date().toLocaleString(),
        },
        categories: categoryEntries.map(([name, count]) => ({
          Category: name,
          'Stock Count': count,
          'Percentage': `${Math.round((count / stats.totalItems) * 100)}%`,
        })),
        warehouses: warehouseEntries.map(([name, count]) => ({
          Warehouse: name,
          'Stock Count': count,
          'Percentage': `${Math.round((count / stats.totalItems) * 100)}%`,
        })),
        items: items?.map(item => ({
          Name: item.name,
          Category: item.category,
          'Unit Cost': formatPHP(item.unit_cost),
          SKU: item.sku || 'N/A',
        })) || [],
        suppliers: suppliers?.map(supplier => ({
          Name: supplier.name,
          'Contact Person': supplier.contact_person || 'N/A',
          Email: supplier.email || 'N/A',
          Phone: supplier.phone || 'N/A',
        })) || [],
      }

      // Generate CSV
      const csvRows = []
      
      // Add header
      csvRows.push('=== INVENTORY REPORT ===')
      csvRows.push('')
      
      // Summary section
      csvRows.push('SUMMARY')
      csvRows.push('Key,Value')
      Object.entries(reportData.summary).forEach(([key, value]) => {
        csvRows.push(`"${key}","${value}"`)
      })
      csvRows.push('')
      
      // Categories section
      csvRows.push('STOCK BY CATEGORY')
      csvRows.push('Category,Stock Count,Percentage')
      reportData.categories.forEach(row => {
        csvRows.push(`"${row.Category}",${row['Stock Count']},"${row.Percentage}"`)
      })
      csvRows.push('')
      
      // Warehouses section
      csvRows.push('STOCK BY WAREHOUSE')
      csvRows.push('Warehouse,Stock Count,Percentage')
      reportData.warehouses.forEach(row => {
        csvRows.push(`"${row.Warehouse}",${row['Stock Count']},"${row.Percentage}"`)
      })
      csvRows.push('')
      
      // Items section
      csvRows.push('ALL ITEMS')
      csvRows.push('Name,Category,Unit Cost,SKU')
      reportData.items.forEach(row => {
        csvRows.push(`"${row.Name}","${row.Category}","${row['Unit Cost']}","${row.SKU}"`)
      })
      csvRows.push('')
      
      // Suppliers section
      csvRows.push('ALL SUPPLIERS')
      csvRows.push('Name,Contact Person,Email,Phone')
      reportData.suppliers.forEach(row => {
        csvRows.push(`"${row.Name}","${row['Contact Person']}","${row.Email}","${row.Phone}"`)
      })

      const csvContent = csvRows.join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export report. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Reports
          </h1>

          <p className="text-sm text-muted">
            Inventory analytics and insights
          </p>
        </div>

        <button 
          onClick={handleExport}
          disabled={exporting || loading}
          className="ui-button ui-button-primary"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export'}
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.title}
              className="ui-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">
                    {card.title}
                  </p>

                  <p className="text-2xl font-semibold mt-2">
                    {loading ? '...' : card.value}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--overlay-light)]">
                  <Icon className="w-5 h-5 text-[var(--primary-default)]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="ui-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">
              Stock by Category
            </h2>

            <BarChart3 className="w-5 h-5 text-muted" />
          </div>

          <div className="space-y-4">
            {categoryEntries.length === 0 ? (
              <p className="text-center text-sm text-muted py-8">
                No data available
              </p>
            ) : (
              categoryEntries.map(([name, value], index) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">
                      {name}
                    </span>

                    <span className="font-medium">
                      {formatNumber(value)}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className={`h-2 rounded-full ${
                        colors[index % colors.length]
                      }`}
                      style={{
                        width: `${Math.max(
                          (value / maxCategory) * 100,
                          4
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ui-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">
              Stock by Warehouse
            </h2>

            <PieChart className="w-5 h-5 text-muted" />
          </div>

          <div className="space-y-4">
            {warehouseEntries.length === 0 ? (
              <p className="text-center text-sm text-muted py-8">
                No data available
              </p>
            ) : (
              warehouseEntries.map(([name, value], index) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">
                      {name}
                    </span>

                    <span className="font-medium">
                      {formatNumber(value)}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className={`h-2 rounded-full ${
                        colors[index % colors.length]
                      }`}
                      style={{
                        width: `${Math.max(
                          (value / maxWarehouse) * 100,
                          4
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ui-card">
          <p className="text-sm text-muted">
            Average Value / Warehouse
          </p>

          <p className="text-2xl font-semibold mt-2">
            {loading
              ? '...'
              : formatPHP(
                  stats.totalValue /
                    (stats.totalWarehouses || 1)
                )}
          </p>
        </div>

        <div className="ui-card">
          <p className="text-sm text-muted">
            Categories
          </p>

          <p className="text-2xl font-semibold mt-2">
            {categoryEntries.length}
          </p>
        </div>

        <div className="ui-card">
          <p className="text-sm text-muted">
            Products / Warehouse
          </p>

          <p className="text-2xl font-semibold mt-2">
            {loading
              ? '...'
              : formatNumber(
                  Math.round(
                    stats.totalItems /
                      (stats.totalWarehouses || 1)
                  )
                )}
          </p>
        </div>
      </div>
    </div>
  )
}