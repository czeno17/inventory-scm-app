'use client'

import { useEffect, useState } from 'react'
import {
  User,
  Building,
  Users,
  Settings as SettingsIcon,
  Save,
  LogOut,
  Plus,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  warehouse_id: string | null
}

type Company = {
  name: string
  tagline: string
  address: string
  city: string
  country: string
  phone: string
  email: string
}

type Preferences = {
  currency: string
  dateFormat: string
  timezone: string
  notifications: boolean
  darkMode: boolean
}

type UserWithProfile = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [savedMessage, setSavedMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [profile, setProfile] = useState<Profile>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'viewer',
    warehouse_id: null,
  })

  const [company, setCompany] = useState<Company>({
    name: 'Z11',
    tagline: 'zone1 scm',
    address: '123 Supply Chain Road',
    city: 'Manila',
    country: 'Philippines',
    phone: '+63 2 8888-1234',
    email: 'info@z11scm.com',
  })

  const [preferences, setPreferences] = useState<Preferences>({
    currency: 'PHP',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'Asia/Manila',
    notifications: true,
    darkMode: false,
  })

  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    password: '',
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          setProfile({
            id: user.id,
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || '',
            email: user.email || '',
            role: userProfile.role || 'viewer',
            warehouse_id: userProfile.warehouse_id || null,
          })
          if (userProfile.role === 'admin') {
            setIsAdmin(true)
            await loadUsers()
          }
        }

        const savedPrefs = localStorage.getItem('scm_preferences')
        if (savedPrefs) setPreferences(JSON.parse(savedPrefs))
        const savedCompany = localStorage.getItem('scm_company')
        if (savedCompany) setCompany(JSON.parse(savedCompany))
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const loadUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profiles) {
        const usersWithEmail = await Promise.all(
          profiles.map(async (profile) => {
            const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
            return { ...profile, email: user?.email || 'No email' }
          })
        )
        setUsers(usersWithEmail)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSavedMessage('')
      if (profile.id) {
        await supabase
          .from('user_profiles')
          .update({
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
            warehouse_id: profile.warehouse_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
      }
      localStorage.setItem('scm_preferences', JSON.stringify(preferences))
      localStorage.setItem('scm_company', JSON.stringify(company))
      if (preferences.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      setSavedMessage('Settings saved successfully!')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSavedMessage('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
      })
      if (error) throw error
      if (data.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
        })
        await loadUsers()
        setShowAddUser(false)
        setNewUser({ email: '', first_name: '', last_name: '', role: 'viewer', password: '' })
        setSavedMessage('User added successfully!')
        setTimeout(() => setSavedMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Error adding user:', error)
      setSavedMessage(error.message || 'Error adding user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await supabase.from('user_profiles').delete().eq('id', userId)
      await supabase.auth.admin.deleteUser(userId)
      await loadUsers()
      setSavedMessage('User deleted successfully!')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting user:', error)
      setSavedMessage('Error deleting user')
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
      await loadUsers()
      setSavedMessage('User role updated!')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  ]
  if (isAdmin) tabs.push({ id: 'users', label: 'Users', icon: Users })

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted">Manage your system preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="ui-button ui-button-primary">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {savedMessage && (
            <span className={`text-sm ${savedMessage.includes('Error') ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>
              {savedMessage}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-[var(--primary-default)] text-[var(--primary-default)]'
                  : 'text-muted hover:text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && (
          <div className="ui-card max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="ui-input"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="ui-input"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="ui-input opacity-60"
                  value={profile.email}
                  disabled
                />
                <p className="text-xs text-muted">Email cannot be changed</p>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="ui-input"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  disabled={!isAdmin}
                >
                  <option value="viewer">Viewer</option>
                  <option value="warehouse_staff">Warehouse Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {!isAdmin && <p className="text-xs text-muted">Contact an admin to change your role</p>}
              </div>

              <div className="pt-4 border-t border-[var(--border-default)]">
                <button
                  onClick={handleLogout}
                  className="ui-button ui-button-ghost text-[var(--error)] hover:bg-[var(--error-bg)]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="ui-card max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Company Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    className="ui-input"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tagline</label>
                  <input
                    className="ui-input"
                    value={company.tagline}
                    onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  className="ui-input"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    className="ui-input"
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    className="ui-input"
                    value={company.country}
                    onChange={(e) => setCompany({ ...company, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="ui-input"
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="ui-input"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="ui-card max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="ui-input"
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  >
                    <option value="PHP">🇵🇭 PHP (₱)</option>
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="GBP">🇬🇧 GBP (£)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date Format</label>
                  <select
                    className="ui-input"
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select
                  className="ui-input"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                >
                  <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-[var(--border-default)]">
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted">Receive email notifications</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    preferences.notifications ? 'bg-[var(--primary-default)]' : 'bg-[var(--border-default)]'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-[var(--border-default)]">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted">Switch to dark theme</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, darkMode: !preferences.darkMode })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    preferences.darkMode ? 'bg-[var(--primary-default)]' : 'bg-[var(--border-default)]'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <div className="ui-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">User Management</h2>
              <button onClick={() => setShowAddUser(!showAddUser)} className="ui-button ui-button-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>

            {showAddUser && (
              <div className="mb-6 p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)]">
                <h3 className="font-medium mb-4">Add New User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        className="ui-input"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        className="ui-input"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="ui-input"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="ui-input"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="ui-input"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="warehouse_staff">Warehouse Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="ui-button ui-button-primary">
                      {saving ? 'Adding...' : 'Add User'}
                    </button>
                    <button type="button" onClick={() => setShowAddUser(false)} className="ui-button ui-button-ghost">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {users.length === 0 ? (
              <p className="text-center text-muted py-8">No users found</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.first_name} {user.last_name}</td>
                        <td className="text-muted">{user.email}</td>
                        <td>
                          <select
                            className="ui-input text-sm py-1 px-2 w-auto"
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            disabled={user.id === profile.id}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="warehouse_staff">Warehouse Staff</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <div className="flex justify-center gap-2">
                            {user.id !== profile.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="ui-button ui-button-ghost p-1.5 text-[var(--error)] hover:bg-[var(--error-bg)]"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {user.id === profile.id && <span className="text-xs text-muted">(You)</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}