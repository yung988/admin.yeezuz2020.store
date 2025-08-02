import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Chyba při odhlašování:', error)
    return NextResponse.redirect(new URL('/auth/error', process.env.NEXT_PUBLIC_SITE_URL))
  }

  return NextResponse.redirect(new URL('/auth/signin', process.env.NEXT_PUBLIC_SITE_URL))
}
