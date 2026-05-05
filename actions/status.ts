'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export type UpdateStatusResult =
  | { success: true }
  | { success: false; error: string }

export async function updatePublicStatus(
  newStatus: string,
): Promise<UpdateStatusResult> {
  const trimmed = newStatus.trim()

  if (!trimmed) {
    return { success: false, error: 'Status cannot be empty.' }
  }
  if (trimmed.length > 280) {
    return { success: false, error: 'Status must be 280 characters or fewer.' }
  }

  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ public_status: trimmed })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Invalidate any route that renders the user's public status
  revalidatePath('/', 'layout')

  return { success: true }
}
