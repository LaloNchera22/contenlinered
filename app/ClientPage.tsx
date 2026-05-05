'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppUser = {
  id: string
  username: string
  public_status: string
}

type Community = {
  id: string
  name: string
}

type Message = {
  id: string
  community_id: string
  user_id: string
  content: string
  created_at: string
  username: string
  optimistic?: boolean
}

// ─── Auth Panel ───────────────────────────────────────────────────────────────

function AuthPanel() {
  const supabase = getSupabaseBrowserClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      if (!username.trim()) {
        setError('El nombre de usuario es obligatorio.')
        setLoading(false)
        return
      }
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({ id: data.user.id, username: username.trim(), public_status: '' })
        if (insertError) setError(insertError.message)
      }
    }

    setLoading(false)
  }

  return (
    <main>
      <h1>Red Social</h1>
      <nav>
        <button onClick={() => { setMode('login'); setError('') }}>
          {mode === 'login' ? <strong>Entrar</strong> : 'Entrar'}
        </button>
        {' | '}
        <button onClick={() => { setMode('signup'); setError('') }}>
          {mode === 'signup' ? <strong>Registrarse</strong> : 'Registrarse'}
        </button>
      </nav>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <p>
            <label htmlFor="username">Usuario</label><br />
            <input
              id="username"
              type="text"
              placeholder="@tuusuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </p>
        )}
        <p>
          <label htmlFor="email">Email</label><br />
          <input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </p>
        <p>
          <label htmlFor="password">Contraseña</label><br />
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </p>
        {error && <p><strong>Error:</strong> {error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App({ session }: { session: Session }) {
  const supabase = getSupabaseBrowserClient()

  const [users, setUsers] = useState<AppUser[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [statusInput, setStatusInput] = useState('')
  const [statusError, setStatusError] = useState('')
  const messagesEndRef = useRef<HTMLLIElement>(null)

  const currentUser = users.find(u => u.id === session.user.id)

  // ── Load users (+ real-time) ──────────────────────────────────────────────

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('users')
        .select('id, username, public_status')
        .order('username')
      if (data) setUsers(data)
    }

    fetchUsers()

    const channel = supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUsers)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // ── Load communities ──────────────────────────────────────────────────────

  useEffect(() => {
    supabase
      .from('communities')
      .select('id, name')
      .order('name')
      .then(({ data }) => { if (data) setCommunities(data) })
  }, [supabase])

  // ── Load messages + real-time for active community ────────────────────────

  useEffect(() => {
    if (!activeCommunity) return

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('id, community_id, user_id, content, created_at, users(username)')
        .eq('community_id', activeCommunity!.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setMessages(
          data.map(m => ({
            id: m.id,
            community_id: m.community_id,
            user_id: m.user_id,
            content: m.content,
            created_at: m.created_at,
            // supabase returns the joined row as object or array
            username: (Array.isArray(m.users) ? m.users[0]?.username : (m.users as { username: string } | null)?.username) ?? m.user_id,
          })),
        )
      }
    }

    fetchMessages()

    const channel = supabase
      .channel(`messages-${activeCommunity.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `community_id=eq.${activeCommunity.id}` },
        async payload => {
          const row = payload.new as { id: string; community_id: string; user_id: string; content: string; created_at: string }

          // Resolve username
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', row.user_id)
            .single()

          const incoming: Message = {
            ...row,
            username: userData?.username ?? row.user_id,
          }

          setMessages(prev => {
            // Replace matching optimistic message (same user + same content)
            const optimisticIdx = prev.findIndex(
              m => m.optimistic && m.user_id === row.user_id && m.content === row.content,
            )
            if (optimisticIdx !== -1) {
              const next = [...prev]
              next[optimisticIdx] = incoming
              return next
            }
            // Avoid duplicates from our own insert event
            if (prev.some(m => m.id === row.id)) return prev
            return [...prev, incoming]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeCommunity, supabase])

  // ── Scroll to bottom when messages change ─────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ──────────────────────────────────────────────────────────

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || !activeCommunity) return

    const optimisticId = `opt-${Date.now()}`

    // Optimistic update — instant UI feedback
    setMessages(prev => [
      ...prev,
      {
        id: optimisticId,
        community_id: activeCommunity.id,
        user_id: session.user.id,
        content,
        created_at: new Date().toISOString(),
        username: currentUser?.username ?? session.user.email ?? session.user.id,
        optimistic: true,
      },
    ])
    setNewMessage('')

    // Persist in background
    await supabase.from('messages').insert({
      community_id: activeCommunity.id,
      user_id: session.user.id,
      content,
    })
  }

  // ── Update status ─────────────────────────────────────────────────────────

  async function updateStatus(e: FormEvent) {
    e.preventDefault()
    setStatusError('')
    const trimmed = statusInput.trim()
    if (!trimmed) return
    if (trimmed.length > 280) {
      setStatusError('Máximo 280 caracteres.')
      return
    }

    const { error } = await supabase
      .from('users')
      .update({ public_status: trimmed })
      .eq('id', session.user.id)

    if (error) {
      setStatusError(error.message)
    } else {
      setStatusInput('')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main>

      {/* ── Top nav ── */}
      <nav>
        <strong>{currentUser?.username ?? session.user.email}</strong>
        {currentUser?.public_status && <span> — {currentUser.public_status}</span>}
        {' '}
        <button onClick={() => supabase.auth.signOut()}>Salir</button>
      </nav>

      <hr />

      {/* ── Estatus propio ── */}
      <section>
        <h2>Tu estatus público</h2>
        <form onSubmit={updateStatus}>
          <input
            type="text"
            placeholder="Escribe tu estatus…"
            value={statusInput}
            onChange={e => setStatusInput(e.target.value)}
            maxLength={280}
          />
          {' '}
          <button type="submit">Actualizar</button>
        </form>
        {statusError && <p>{statusError}</p>}
      </section>

      <hr />

      {/* ── Usuarios ── */}
      <section>
        <h2>Usuarios ({users.length})</h2>
        <ul>
          {users.map(u => (
            <li key={u.id}>
              <strong>{u.username}</strong>
              {u.public_status ? `: ${u.public_status}` : ''}
              {u.id === session.user.id ? ' (tú)' : ''}
            </li>
          ))}
        </ul>
      </section>

      <hr />

      {/* ── Comunidades ── */}
      <section>
        <h2>Comunidades</h2>
        <ul>
          {communities.map(c => (
            <li key={c.id}>
              <button onClick={() => setActiveCommunity(c)}>
                {activeCommunity?.id === c.id ? <strong>{c.name}</strong> : c.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <hr />

      {/* ── Chat ── */}
      {activeCommunity ? (
        <section>
          <h2>Chat — {activeCommunity.name}</h2>
          <ul>
            {messages.map(m => (
              <li key={m.id}>
                <strong>{m.username}</strong>: {m.content}
                {m.optimistic ? ' …' : ''}
              </li>
            ))}
            <li ref={messagesEndRef} />
          </ul>
          <form onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Escribe un mensaje…"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              autoFocus
            />
            {' '}
            <button type="submit">Enviar</button>
          </form>
        </section>
      ) : (
        <section>
          <p>Selecciona una comunidad para ver el chat.</p>
        </section>
      )}

    </main>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClientPage() {
  const supabase = getSupabaseBrowserClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) return <main><p>Cargando…</p></main>

  return session ? <App session={session} /> : <AuthPanel />
}
