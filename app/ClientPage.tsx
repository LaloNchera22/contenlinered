'use client'

import { useState, useEffect, useRef, FormEvent, Component, ReactNode, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

// ─── Types ─────────────────────────────────────────────────────────────────────

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

type Section = 'communities' | 'friends' | 'profile' | 'explore' | 'settings'

// ─── Icons ─────────────────────────────────────────────────────────────────────

type IcoProps = { size?: number }

function Ico({ size = 20, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      {children}
    </svg>
  )
}


const IcoCommunities = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </Ico>
)

const IcoFriends = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </Ico>
)

const IcoProfile = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Ico>
)

const IcoExplore = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </Ico>
)

const IcoSettings = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Ico>
)

const IcoLogout = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Ico>
)

const IcoSearch = ({ size = 16 }: IcoProps) => (
  <Ico size={size}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </Ico>
)

// ─── TopBar ──────────────────────────────────────────────────────────────────────

function TopBar({
  searchQuery,
  onSearchChange,
  searchRef,
}: {
  searchQuery: string
  onSearchChange: (v: string) => void
  searchRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="topbar">
      <div className="topbar-search">
        <span className="topbar-search-icon"><IcoSearch size={14} /></span>
        <input
          ref={searchRef}
          className="topbar-input"
          type="text"
          placeholder="Buscar…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
        <span className="topbar-kbd">Ctrl K</span>
      </div>
    </div>
  )
}

// ─── Sidebar ────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { section: Section; label: string; Icon: (p: IcoProps) => ReactNode }[] = [
  { section: 'communities', label: 'Comunidades', Icon: IcoCommunities },
  { section: 'friends',     label: 'Amigos',      Icon: IcoFriends },
  { section: 'explore',     label: 'Explorar',    Icon: IcoExplore },
  { section: 'profile',     label: 'Perfil',      Icon: IcoProfile },
  { section: 'settings',    label: 'Ajustes',     Icon: IcoSettings },
]

function Sidebar({
  activeSection,
  onSectionChange,
  onLogout,
  username,
}: {
  activeSection: Section
  onSectionChange: (s: Section) => void
  onLogout: () => void
  username: string
}) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ section, label, Icon }) => (
          <button
            key={section}
            className={`sidebar-item${activeSection === section ? ' sidebar-item--active' : ''}`}
            onClick={() => onSectionChange(section)}
            title={label}
          >
            <Icon />
            <span className="sidebar-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <span className="sidebar-user-dot" />
          <span className="sidebar-user-name">{username}</span>
        </div>
        <button
          className="sidebar-item sidebar-item--logout"
          onClick={onLogout}
          title="Salir"
        >
          <IcoLogout />
          <span className="sidebar-label">Salir</span>
        </button>
      </div>
    </aside>
  )
}

// ─── Content Sections ───────────────────────────────────────────────────────────

function CommunitiesSection({
  communities,
  activeCommunity,
  setActiveCommunity,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  messagesEndRef,
}: {
  communities: Community[]
  activeCommunity: Community | null
  setActiveCommunity: (c: Community) => void
  messages: Message[]
  newMessage: string
  setNewMessage: (v: string) => void
  sendMessage: (e: FormEvent) => void
  messagesEndRef: React.RefObject<HTMLLIElement | null>
}) {
  return (
    <div>
      <div className="section-title">Comunidades</div>

      <h2>Grupos</h2>
      <div className="community-list">
        {communities.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: '#bbb' }}>Sin comunidades aún.</p>
        )}
        {communities.map(c => (
          <button
            key={c.id}
            className={`community-btn${activeCommunity?.id === c.id ? ' community-btn--active' : ''}`}
            onClick={() => setActiveCommunity(c)}
          >
            <IcoCommunities size={15} />
            {c.name}
          </button>
        ))}
      </div>

      {activeCommunity ? (
        <>
          <h2>Chat · {activeCommunity.name}</h2>
          <ul className="messages-list">
            {messages.map(m => (
              <li key={m.id} className={m.optimistic ? 'msg-pending' : ''}>
                <strong>{m.username}</strong>: {m.content}
              </li>
            ))}
            <li ref={messagesEndRef} />
          </ul>
          <form className="inline-form" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Escribe un mensaje…"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              autoFocus
            />
            <button type="submit">Enviar</button>
          </form>
        </>
      ) : (
        <p style={{ fontSize: '0.85rem', color: '#bbb' }}>
          Selecciona una comunidad para ver el chat.
        </p>
      )}
    </div>
  )
}

function FriendsSection({ users, currentUserId }: { users: AppUser[]; currentUserId: string }) {
  return (
    <div>
      <div className="section-title">Amigos</div>
      <h2>{users.length} {users.length === 1 ? 'persona' : 'personas'}</h2>
      {users.map(u => (
        <div key={u.id} className="friend-item">
          <div className="friend-avatar">
            {u.username.charAt(0).toUpperCase()}
          </div>
          <div className="friend-info">
            <div className="friend-name">
              {u.username}
              {u.id === currentUserId && <span className="friend-you">(tú)</span>}
            </div>
            {u.public_status
              ? <div className="friend-status">{u.public_status}</div>
              : <div className="friend-status" style={{ color: '#d8d8d8' }}>Sin estado</div>
            }
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileSection({
  currentUser,
  email,
  statusInput,
  setStatusInput,
  updateStatus,
  statusError,
}: {
  currentUser: AppUser | undefined
  email: string
  statusInput: string
  setStatusInput: (v: string) => void
  updateStatus: (e: FormEvent) => void
  statusError: string
}) {
  return (
    <div>
      <div className="section-title">Perfil</div>

      {currentUser && (
        <div className="profile-card">
          <div className="profile-avatar-large">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-username">@{currentUser.username}</div>
            <div className="profile-email">{email}</div>
            {currentUser.public_status && (
              <div className="profile-status-text">"{currentUser.public_status}"</div>
            )}
          </div>
        </div>
      )}

      <section>
        <h2>Estado público</h2>
        <form className="inline-form" onSubmit={updateStatus}>
          <input
            type="text"
            placeholder="¿En qué estás trabajando?"
            value={statusInput}
            onChange={e => setStatusInput(e.target.value)}
            maxLength={280}
          />
          <button type="submit">Actualizar</button>
        </form>
        {statusError && <p className="error-text">{statusError}</p>}
      </section>
    </div>
  )
}

function ExploreSection() {
  return (
    <div>
      <div className="section-title">Explorar</div>
      <div className="explore-placeholder">
        <IcoExplore size={36} />
        <h2>Próximamente</h2>
        <p>Descubre nuevas comunidades y personas.</p>
      </div>
    </div>
  )
}

function SettingsSection({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return (
    <div>
      <div className="section-title">Ajustes</div>

      <section className="settings-group">
        <h2>Cuenta</h2>
        <div className="settings-row">
          <div className="settings-label">Email</div>
          <div className="settings-value">{session.user.email}</div>
        </div>
        <div className="settings-row">
          <div className="settings-label">ID de usuario</div>
          <div className="settings-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#bbb' }}>
            {session.user.id.slice(0, 16)}…
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">Sesión iniciada</div>
          <div className="settings-value">
            {session.user.last_sign_in_at
              ? new Date(session.user.last_sign_in_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—'}
          </div>
        </div>
      </section>

      <hr />

      <section className="settings-group">
        <h2>Sesión</h2>
        <button className="btn-danger" onClick={onLogout}>
          Cerrar sesión
        </button>
      </section>
    </div>
  )
}

// ─── Not Configured ─────────────────────────────────────────────────────────────

function NotConfigured() {
  return (
    <div className="auth-screen">
      <div className="auth-inner">
        <div className="auth-logo">
          <h1>Red Social</h1>
        </div>
        <div className="setup-box">
          <p><strong>La aplicación no está configurada.</strong></p>
          <p>
            Añade las siguientes variables de entorno en Vercel → Project Settings → Environment Variables:
          </p>
          <br />
          <p><code>NEXT_PUBLIC_SUPABASE_URL</code></p>
          <p><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></p>
        </div>
      </div>
    </div>
  )
}

// ─── Auth Panel ─────────────────────────────────────────────────────────────────

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
    <div className="auth-screen">
      <div className="auth-inner">
        <div className="auth-logo">
          <h1>Red Social</h1>
          <p>Conecta, comparte, construye.</p>
        </div>

        <nav className="auth-nav">
          <button className="btn-link" onClick={() => { setMode('login'); setError('') }}>
            {mode === 'login' ? <strong>Entrar</strong> : 'Entrar'}
          </button>
          {' · '}
          <button className="btn-link" onClick={() => { setMode('signup'); setError('') }}>
            {mode === 'signup' ? <strong>Registrarse</strong> : 'Registrarse'}
          </button>
        </nav>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <p>
              <label htmlFor="username">Usuario</label>
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
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Contraseña</label>
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
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── App ────────────────────────────────────────────────────────────────────────

function App({ session }: { session: Session }) {
  const supabase = getSupabaseBrowserClient()

  const [activeSection, setActiveSection] = useState<Section>('communities')

  const [users, setUsers] = useState<AppUser[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [statusInput, setStatusInput] = useState('')
  const [statusError, setStatusError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLLIElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const currentUser = users.find(u => u.id === session.user.id)

  // ── Load users (+ real-time) ────────────────────────────────────────────────

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

  // ── Load communities ────────────────────────────────────────────────────────

  useEffect(() => {
    supabase
      .from('communities')
      .select('id, name')
      .order('name')
      .then(({ data }) => { if (data) setCommunities(data) })
  }, [supabase])

  // ── Load messages + real-time for active community ──────────────────────────

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
            const optimisticIdx = prev.findIndex(
              m => m.optimistic && m.user_id === row.user_id && m.content === row.content,
            )
            if (optimisticIdx !== -1) {
              const next = [...prev]
              next[optimisticIdx] = incoming
              return next
            }
            if (prev.some(m => m.id === row.id)) return prev
            return [...prev, incoming]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeCommunity, supabase])

  // ── Scroll to bottom when messages change ───────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Ctrl+K focuses search bar ────────────────────────────────────────────────

  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKey)
    return () => document.removeEventListener('keydown', handleGlobalKey)
  }, [handleGlobalKey])

  // ── Send message ────────────────────────────────────────────────────────────

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || !activeCommunity) return

    const optimisticId = `opt-${Date.now()}`

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

    await supabase.from('messages').insert({
      community_id: activeCommunity.id,
      user_id: session.user.id,
      content,
    })
  }

  // ── Update status ───────────────────────────────────────────────────────────

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

  function handleLogout() {
    supabase.auth.signOut()
  }

  function handleSectionChange(s: Section) {
    setActiveSection(s)
  }

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        username={currentUser?.username ?? session.user.email ?? ''}
      />

      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchRef={searchRef}
      />

      <div className="content-area">
        <div className="content-inner">
          {activeSection === 'communities' && (
            <CommunitiesSection
              communities={communities}
              activeCommunity={activeCommunity}
              setActiveCommunity={setActiveCommunity}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              messagesEndRef={messagesEndRef}
            />
          )}
          {activeSection === 'friends' && (
            <FriendsSection users={users} currentUserId={session.user.id} />
          )}
          {activeSection === 'profile' && (
            <ProfileSection
              currentUser={currentUser}
              email={session.user.email ?? ''}
              statusInput={statusInput}
              setStatusInput={setStatusInput}
              updateStatus={updateStatus}
              statusError={statusError}
            />
          )}
          {activeSection === 'explore' && <ExploreSection />}
          {activeSection === 'settings' && (
            <SettingsSection session={session} onLogout={handleLogout} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Error Boundary ──────────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="auth-screen">
          <div className="auth-inner">
            <div className="auth-logo"><h1>Red Social</h1></div>
            <div className="setup-box">
              <p><strong>Error al iniciar la aplicación</strong></p>
              <p>{this.state.error.message}</p>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Root ────────────────────────────────────────────────────────────────────────

function AppRoot() {
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

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-inner" style={{ textAlign: 'center' }}>
          <p style={{ color: '#bbb', fontSize: '0.88rem' }}>Cargando…</p>
        </div>
      </div>
    )
  }

  return session ? <App session={session} /> : <AuthPanel />
}

export default function ClientPage() {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  if (!isConfigured) return <NotConfigured />

  return (
    <ErrorBoundary>
      <AppRoot />
    </ErrorBoundary>
  )
}
