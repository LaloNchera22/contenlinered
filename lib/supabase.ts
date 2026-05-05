import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          public_status: string
          status_score: number
          created_at: string
          updated_at: string
        }
        Update: Partial<Omit<Database['public']['Tables']['users']['Row'], 'id'>>
      }
      communities: {
        Row: {
          id: string
          name: string
          topic_vector: number[] | null
          created_at: string
        }
      }
      memberships: {
        Row: {
          user_id: string
          community_id: string
          joined_at: string
        }
      }
      messages: {
        Row: {
          id: string
          community_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          community_id: string
          user_id: string
          content: string
        }
      }
    }
  }
}

// ─── Browser client (singleton) ──────────────────────────────────────────────
// Safe to call in Client Components; uses the anon key only.
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return browserClient
}

// ─── Server client ────────────────────────────────────────────────────────────
// Call inside Server Components, Server Actions, and Route Handlers.
// Reads/writes cookies to propagate the session automatically.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )
}
