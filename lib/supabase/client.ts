import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('❌ Missing Supabase environment variables!')
    throw new Error('Missing Supabase credentials')
  }
  
  return createBrowserClient(url, key)
}

// Get current user
export const getCurrentUser = async () => {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

// Get user profile with role
export const getUserProfile = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) return null
  return data
}

// Check if user has admin role
export const isAdmin = async () => {
  const user = await getCurrentUser()
  if (!user) return false
  const profile = await getUserProfile(user.id)
  return profile?.role === 'admin'
}