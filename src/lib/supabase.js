import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uujhejfkbdjgerbbqwtv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amhlamZrYmRqZ2VyYmJxd3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDk1OTQsImV4cCI6MjA4Nzg4NTU5NH0.mEFnVbG5w2I8GH4qw-WVKDWjLF_twzMsUWZMqQJPcYA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
