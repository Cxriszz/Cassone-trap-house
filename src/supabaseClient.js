import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cqeqfiuswdvpokgznwpk.supabase.co'
const supabaseKey = 'sb_publishable_L2fp_UXcWz1UoV5eT9Q_XQ_9Bf6VN9o'

// Typically we use environment variables for this, but since it's a frontend-only app right now
// without a proper build step for env vars, we can hardcode the ANON key.
// The anon key is safe to be exposed in the frontend as long as Row Level Security (RLS) is configured.
export const supabase = createClient(supabaseUrl, supabaseKey)
