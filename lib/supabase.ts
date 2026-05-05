import { createBrowserClient } from '@supabase/ssr'

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
        Insert: {
          id: string
          username: string
          public_status?: string
          status_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          public_status?: string
          status_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          id: string
          name: string
          topic_vector: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          topic_vector?: number[] | null
          created_at?: string
        }
        Update: {
          name?: string
          topic_vector?: number[] | null
          created_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          user_id: string
          community_id: string
          joined_at: string
        }
        Insert: {
          user_id: string
          community_id: string
          joined_at?: string
        }
        Update: {
          user_id?: string
          community_id?: string
          joined_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          community_id: string
          user_id: string
          content: string
          attachment_url: string | null
          attachment_type: 'pdf' | 'audio' | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          content?: string
          attachment_url?: string | null
          attachment_type?: 'pdf' | 'audio' | null
          created_at?: string
        }
        Update: {
          community_id?: string
          user_id?: string
          content?: string
          attachment_url?: string | null
          attachment_type?: 'pdf' | 'audio' | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─── Browser client (singleton) ──────────────────────────────────────────────
// Safe to call in Client Components; uses the anon key only.
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings (or .env.local for local development).',
    )
  }

  browserClient = createBrowserClient<Database>(url, key)
  return browserClient
}
