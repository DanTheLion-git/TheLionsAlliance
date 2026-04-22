import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://lqdwcofsznjehbblrlcs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZHdjb2Zzem5qZWhiYmxybGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzczMjIsImV4cCI6MjA5MTIxMzMyMn0.6qniTws6LtG0qTvUinAu_m9puRkJRpU3Hhup1JHGRLM'
)
