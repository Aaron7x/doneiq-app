import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This creates a singleton client that automatically handles cookies in Client Components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)