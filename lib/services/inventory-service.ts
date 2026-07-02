import { createClient } from '@/lib/supabase/client'
import { Item, Stock, StockMovement, Warehouse, Supplier } from '@/types/inventory'

const supabase = createClient()

export class InventoryService {
  // ============ ITEMS ============
  static async getItems(): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name')
    if (error) throw error
    return data as Item[]
  }

  static async getItemById(id: string): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Item
  }

  static async createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .insert(item)
      .select()
      .single()
    if (error) throw error
    return data as Item
  }

  static async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Item
  }

  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  // ============ WAREHOUSES ============
  static async getWarehouses(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active')
      .order('name')
    if (error) throw error
    return data as Warehouse[]
  }

  static async getAllWarehouses(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name')
    if (error) throw error
    return data as Warehouse[]
  }

  // ============ STOCK ============
  static async getStockWithDetails(): Promise<Stock[]> {
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        items (*),
        warehouses (*)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Stock[]
  }

  static async getStockByWarehouse(warehouseId: string): Promise<Stock[]> {
    const { data, error } = await supabase
      .from('stock')
      .select(`
        *,
        items (*)
      `)
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Stock[]
  }

  static async updateStock(stockId: string, updates: Partial<Stock>): Promise<Stock> {
    const { data, error } = await supabase
      .from('stock')
      .update(updates)
      .eq('id', stockId)
      .select()
      .single()
    if (error) throw error
    return data as Stock
  }

  // ============ STOCK MOVEMENTS ============
  static async getRecentMovements(limit: number = 10): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        items (*),
        warehouses (*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as StockMovement[]
  }

  static async createStockMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select()
      .single()
    if (error) throw error
    return data as StockMovement
  }

  // ============ SUPPLIERS ============
  static async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data as Supplier[]
  }

  // ============ DASHBOARD STATS ============
  static async getDashboardStats() {
    try {
      console.log('🔄 Fetching dashboard stats...')

      const { count: totalItems, error: itemsError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
      if (itemsError) throw itemsError
      console.log('✅ Total items:', totalItems)

      const { count: lowStockItems, error: lowStockError } = await supabase
        .from('stock')
        .select('*', { count: 'exact', head: true })
        .lt('available_quantity', 10)
      if (lowStockError) throw lowStockError
      console.log('✅ Low stock:', lowStockItems)

      const { count: totalWarehouses, error: warehousesError } = await supabase
        .from('warehouses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      if (warehousesError) throw warehousesError
      console.log('✅ Warehouses:', totalWarehouses)

      const { count: totalSuppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      if (suppliersError) throw suppliersError
      console.log('✅ Suppliers:', totalSuppliers)

      const { data: recentMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          items (name, item_code),
          warehouses (name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      if (movementsError) throw movementsError
      console.log('✅ Movements:', recentMovements?.length || 0)

      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select(`
          quantity,
          items (unit_cost)
        `)
      if (stockError) throw stockError

      let totalValue = 0
      if (stockData) {
        stockData.forEach((item: any) => {
          const cost = item.items?.unit_cost || 0
          totalValue += item.quantity * cost
        })
      }
      console.log('✅ Total value:', totalValue)

      const result = {
        totalItems: totalItems || 0,
        lowStockItems: lowStockItems || 0,
        totalWarehouses: totalWarehouses || 0,
        totalSuppliers: totalSuppliers || 0,
        totalValue: totalValue,
        recentMovements: recentMovements || []
      }

      console.log('📊 Final stats:', result)
      return result

    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error)
      return {
        totalItems: 0,
        lowStockItems: 0,
        totalWarehouses: 0,
        totalSuppliers: 0,
        totalValue: 0,
        recentMovements: []
      }
    }
  }
}