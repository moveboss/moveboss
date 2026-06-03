import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uebwojsiqtduzqhlhljo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlYndvanNpcXRkdXpxaGxobGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjEyMDMsImV4cCI6MjA5NTk5NzIwM30.S_Za0Jp4xikswKGq1iVp_M9CIUVmDr01rV8qtfYv33o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
