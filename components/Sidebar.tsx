// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/items', icon: Package, label: 'Products' },
  { href: '/stock', icon: Warehouse, label: 'Stock' },
  { href: '/suppliers', icon: Users, label: 'Suppliers' },
  { href: '/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Get display name
  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User'

  // Get avatar initials
  const getInitials = () => {
    if (!profile) return '?'
    const first = profile.first_name?.charAt(0) || ''
    const last = profile.last_name?.charAt(0) || ''
    return (first + last).toUpperCase() || '?'
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="logo">Z</div>
        <div>
          <div className="name">Z11</div>
          <div className="tagline">zone1 scm</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Menu</div>
        
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="icon" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User Profile */}
        <div className="sidebar-user">
          <div className="avatar">
            {getInitials()}
          </div>
          <div className="info">
            <div className="name">{displayName}</div>
            <div className="role">{profile?.role || 'Viewer'}</div>
          </div>
        </div>

        {/* Settings */}
        <Link href="/settings" className="sidebar-nav-link" style={{ marginTop: '8px' }}>
          <Settings className="icon" />
          <span>Settings</span>
        </Link>
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-nav-link"
          style={{ 
            width: '100%', 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
        >
          <LogOut className="icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}