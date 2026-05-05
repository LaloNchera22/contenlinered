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
  attachment_url?: string | null
  attachment_type?: 'pdf' | 'audio' | null
  created_at: string
  username: string
  optimistic?: boolean
}

type LiveSession = {
  id: string
  topic: string
  created_by: string
  created_at: string
  expires_at: string
}

type SessionMember = {
  session_id: string
  user_id: string
  joined_at: string
  username: string
}

type SessionMessage = {
  id: string
  session_id: string
  user_id: string
  content: string
  created_at: string
  username: string
}

type PrivateMessage = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  username: string
}

type Section = 'communities' | 'friends' | 'messages' | 'explore' | 'presence' | 'profile' | 'settings'

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

const IcoPdf = ({ size = 16 }: IcoProps) => (
  <Ico size={size}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h4" />
  </Ico>
)

const IcoMic = ({ size = 16 }: IcoProps) => (
  <Ico size={size}>
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <path d="M12 19v4M8 23h8" />
  </Ico>
)

const IcoStop = ({ size = 16 }: IcoProps) => (
  <Ico size={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </Ico>
)

const IcoX = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Ico>
)

const IcoPresence = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </Ico>
)

const IcoMessages = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="12" y2="14" />
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
  { section: 'messages',    label: 'Mensajes',    Icon: IcoMessages },
  { section: 'explore',     label: 'Explorar',    Icon: IcoExplore },
  { section: 'presence',    label: 'Presencia',   Icon: IcoPresence },
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

function MessageAttachment({ url, type }: { url: string; type: 'pdf' | 'audio' }) {
  if (type === 'pdf') {
    const filename = decodeURIComponent(url.split('/').pop() ?? 'documento.pdf').replace(/^\d+-/, '')
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="msg-attachment-pdf"
      >
        <IcoPdf size={14} />
        {filename}
      </a>
    )
  }
  return (
    <audio controls src={url} className="msg-audio-player" />
  )
}

function CommunitiesSection({
  communities,
  activeCommunity,
  setActiveCommunity,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  messagesEndRef,
  attachedFile,
  attachmentType,
  isRecording,
  isUploading,
  onPdfSelect,
  onStartRecord,
  onStopRecord,
  onClearAttach,
}: {
  communities: Community[]
  activeCommunity: Community | null
  setActiveCommunity: (c: Community) => void
  messages: Message[]
  newMessage: string
  setNewMessage: (v: string) => void
  sendMessage: (e: FormEvent) => void
  messagesEndRef: React.RefObject<HTMLLIElement | null>
  attachedFile: File | null
  attachmentType: 'pdf' | 'audio' | null
  isRecording: boolean
  isUploading: boolean
  onPdfSelect: (file: File) => void
  onStartRecord: () => void
  onStopRecord: () => void
  onClearAttach: () => void
}) {
  const pdfInputRef = useRef<HTMLInputElement>(null)

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
                <strong>{m.username}</strong>
                {m.content && <span>: {m.content}</span>}
                {m.attachment_url && m.attachment_type && (
                  <div className="msg-attachment-wrap">
                    <MessageAttachment url={m.attachment_url} type={m.attachment_type} />
                  </div>
                )}
              </li>
            ))}
            <li ref={messagesEndRef} />
          </ul>

          {attachedFile && (
            <div className="attach-preview">
              {attachmentType === 'pdf' ? <IcoPdf size={14} /> : <IcoMic size={14} />}
              <span className="attach-preview-name">{attachedFile.name}</span>
              <button type="button" className="attach-clear-btn" onClick={onClearAttach} title="Quitar archivo">
                <IcoX size={12} />
              </button>
            </div>
          )}

          <form className="inline-form" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder={attachedFile ? 'Añade un mensaje opcional…' : 'Escribe un mensaje…'}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              autoFocus
            />

            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) onPdfSelect(file)
                e.target.value = ''
              }}
            />

            <button
              type="button"
              className="attach-btn"
              onClick={() => pdfInputRef.current?.click()}
              title="Adjuntar PDF"
              disabled={isRecording || isUploading}
            >
              <IcoPdf size={15} />
            </button>

            {isRecording ? (
              <button
                type="button"
                className="attach-btn attach-btn--recording"
                onClick={onStopRecord}
                title="Detener grabación"
              >
                <IcoStop size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="attach-btn"
                onClick={onStartRecord}
                title="Grabar mensaje de voz"
                disabled={!!attachedFile || isUploading}
              >
                <IcoMic size={15} />
              </button>
            )}

            <button type="submit" disabled={isUploading || isRecording || (!newMessage.trim() && !attachedFile)}>
              {isUploading ? 'Subiendo…' : 'Enviar'}
            </button>
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

function PresenceSection({
  currentUser,
  liveSessions,
  allSessionMembers,
  activeSession,
  sessionMessages,
  sessionMembers,
  typingUsers,
  sessionMsgInput,
  setSessionMsgInput,
  newSessionTopic,
  setNewSessionTopic,
  sessionError,
  onJoinSession,
  onLeaveSession,
  onCreateSession,
  onSendSessionMessage,
  onSessionTyping,
  sessionEndRef,
}: {
  currentUser: AppUser | undefined
  liveSessions: LiveSession[]
  allSessionMembers: { session_id: string; user_id: string }[]
  activeSession: LiveSession | null
  sessionMessages: SessionMessage[]
  sessionMembers: SessionMember[]
  typingUsers: string[]
  sessionMsgInput: string
  setSessionMsgInput: (v: string) => void
  newSessionTopic: string
  setNewSessionTopic: (v: string) => void
  sessionError: string
  onJoinSession: (s: LiveSession) => void
  onLeaveSession: () => void
  onCreateSession: (e: FormEvent) => void
  onSendSessionMessage: (e: FormEvent) => void
  onSessionTyping: () => void
  sessionEndRef: React.RefObject<HTMLLIElement | null>
}) {
  function computeAffinity(sessionTopic: string): number {
    if (!currentUser?.public_status) return 0
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^\w\sáéíóúñü]/g, '').split(/\s+/).filter(w => w.length > 3)
    const statusWords = new Set(normalize(currentUser.public_status))
    const topicWords = normalize(sessionTopic)
    if (statusWords.size === 0 || topicWords.length === 0) return 0
    const matches = topicWords.filter(w => statusWords.has(w)).length
    return matches / Math.max(statusWords.size, topicWords.length)
  }

  if (activeSession) {
    return (
      <div>
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="presence-back-btn" onClick={onLeaveSession} title="Salir de la sala">
            ←
          </button>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeSession.topic}
          </span>
        </div>

        <div className="presence-members-bar">
          {sessionMembers.map(m => (
            <span key={m.user_id} className="presence-member-chip">
              <span className="presence-dot-live" />
              {m.username}
            </span>
          ))}
        </div>

        <ul className="messages-list">
          {sessionMessages.length === 0 && (
            <li style={{ color: '#ccc', fontSize: '0.8rem', fontStyle: 'italic', border: 'none' }}>
              Sé el primero en escribir algo…
            </li>
          )}
          {sessionMessages.map(m => (
            <li key={m.id}>
              <strong>{m.username}</strong>: {m.content}
            </li>
          ))}
          {typingUsers.length > 0 && (
            <li className="typing-indicator-row">
              <span className="typing-dots"><span /><span /><span /></span>
              <span className="typing-label">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está escribiendo' : 'están escribiendo'}
              </span>
            </li>
          )}
          <li ref={sessionEndRef} />
        </ul>

        <form className="inline-form" onSubmit={onSendSessionMessage}>
          <input
            type="text"
            placeholder="Escribe un mensaje…"
            value={sessionMsgInput}
            onChange={e => { setSessionMsgInput(e.target.value); onSessionTyping() }}
            autoFocus
          />
          <button type="submit" disabled={!sessionMsgInput.trim()}>Enviar</button>
        </form>
      </div>
    )
  }

  const sortedSessions = [...liveSessions].sort(
    (a, b) => computeAffinity(b.topic) - computeAffinity(a.topic),
  )

  return (
    <div>
      <div className="section-title">Eventos de Presencia</div>

      <h2>Salas activas</h2>
      {sortedSessions.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#bbb', marginBottom: '1.5rem' }}>
          No hay salas activas. Crea la primera.
        </p>
      ) : (
        <div className="session-list">
          {sortedSessions.map(s => {
            const count = allSessionMembers.filter(m => m.session_id === s.id).length
            const af = computeAffinity(s.topic)
            return (
              <div key={s.id} className={`session-card${af > 0.15 ? ' session-card--match' : ''}`}>
                <div className="session-card-top">
                  <span className="session-card-topic">{s.topic}</span>
                  {af > 0.15 && (
                    <span className="session-affinity-tag">
                      {af > 0.5 ? 'Muy afín' : af > 0.3 ? 'Alta afinidad' : 'Afinidad'}
                    </span>
                  )}
                </div>
                <div className="session-card-meta">
                  <span className="session-pulse-dot" />
                  {count} {count === 1 ? 'persona' : 'personas'} en vivo
                </div>
                <button className="session-enter-btn" onClick={() => onJoinSession(s)}>
                  Entrar →
                </button>
              </div>
            )
          })}
        </div>
      )}

      <h2>Crear sala nueva</h2>
      <form className="inline-form" onSubmit={onCreateSession}>
        <input
          type="text"
          placeholder="¿Sobre qué quieres hablar?"
          value={newSessionTopic}
          onChange={e => setNewSessionTopic(e.target.value)}
          maxLength={200}
        />
        <button type="submit" disabled={!newSessionTopic.trim()}>Crear</button>
      </form>
      {sessionError && <p className="error-text">{sessionError}</p>}
    </div>
  )
}

function MessagesSection({
  users,
  currentUserId,
  activeDm,
  setActiveDm,
  dmMessages,
  dmInput,
  setDmInput,
  sendDm,
  dmEndRef,
}: {
  users: AppUser[]
  currentUserId: string
  activeDm: AppUser | null
  setActiveDm: (u: AppUser | null) => void
  dmMessages: PrivateMessage[]
  dmInput: string
  setDmInput: (v: string) => void
  sendDm: (e: FormEvent) => void
  dmEndRef: React.RefObject<HTMLLIElement | null>
}) {
  if (activeDm) {
    return (
      <div>
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="presence-back-btn" onClick={() => setActiveDm(null)} title="Volver">←</button>
          <span>@{activeDm.username}</span>
        </div>

        <ul className="messages-list">
          {dmMessages.length === 0 && (
            <li style={{ color: '#ccc', fontSize: '0.8rem', fontStyle: 'italic', border: 'none' }}>
              Escribe el primer mensaje…
            </li>
          )}
          {dmMessages.map(m => (
            <li
              key={m.id}
              className={m.sender_id === currentUserId ? 'dm-msg dm-msg--sent' : 'dm-msg'}
            >
              <strong>{m.username}</strong>: {m.content}
            </li>
          ))}
          <li ref={dmEndRef} />
        </ul>

        <form className="inline-form" onSubmit={sendDm}>
          <input
            type="text"
            placeholder="Escribe un mensaje privado…"
            value={dmInput}
            onChange={e => setDmInput(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!dmInput.trim()}>Enviar</button>
        </form>
      </div>
    )
  }

  const otherUsers = users.filter(u => u.id !== currentUserId)

  return (
    <div>
      <div className="section-title">Mensajes Privados</div>
      {otherUsers.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#bbb' }}>No hay otros usuarios aún.</p>
      ) : (
        <>
          <h2>{otherUsers.length} {otherUsers.length === 1 ? 'persona' : 'personas'}</h2>
          {otherUsers.map(u => (
            <div key={u.id} className="friend-item">
              <div className="friend-avatar">{u.username.charAt(0).toUpperCase()}</div>
              <div className="friend-info">
                <div className="friend-name">{u.username}</div>
                {u.public_status
                  ? <div className="friend-status">{u.public_status}</div>
                  : <div className="friend-status" style={{ color: '#d8d8d8' }}>Sin estado</div>
                }
              </div>
              <button className="dm-start-btn" onClick={() => setActiveDm(u)}>
                Mensaje →
              </button>
            </div>
          ))}
        </>
      )}
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachmentType, setAttachmentType] = useState<'pdf' | 'audio' | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLLIElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [activeDm, setActiveDm] = useState<AppUser | null>(null)
  const [dmMessages, setDmMessages] = useState<PrivateMessage[]>([])
  const [dmInput, setDmInput] = useState('')
  const dmEndRef = useRef<HTMLLIElement>(null)

  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [allSessionMembers, setAllSessionMembers] = useState<{ session_id: string; user_id: string }[]>([])
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null)
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([])
  const [sessionMembers, setSessionMembers] = useState<SessionMember[]>([])
  const [sessionMsgInput, setSessionMsgInput] = useState('')
  const [newSessionTopic, setNewSessionTopic] = useState('')
  const [sessionError, setSessionError] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const sessionEndRef = useRef<HTMLLIElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typingChannelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        .select('id, community_id, user_id, content, attachment_url, attachment_type, created_at, users(username)')
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
            attachment_url: m.attachment_url,
            attachment_type: m.attachment_type as 'pdf' | 'audio' | null,
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
          const row = payload.new as { id: string; community_id: string; user_id: string; content: string; attachment_url: string | null; attachment_type: 'pdf' | 'audio' | null; created_at: string }

          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', row.user_id)
            .single()

          const incoming: Message = {
            ...row,
            attachment_url: row.attachment_url,
            attachment_type: row.attachment_type,
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

  // ── Load live sessions (+ real-time) ──────────────────────────────────────

  useEffect(() => {
    async function fetchSessions() {
      const now = new Date().toISOString()
      const [{ data: sessions }, { data: members }] = await Promise.all([
        supabase.from('live_sessions').select('*').gt('expires_at', now).order('created_at', { ascending: false }),
        supabase.from('session_members').select('session_id, user_id'),
      ])
      if (sessions) setLiveSessions(sessions)
      if (members) setAllSessionMembers(members)
    }

    fetchSessions()

    const channel = supabase
      .channel('presence-sessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, fetchSessions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_members' }, fetchSessions)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // ── Active session: messages, members, typing ──────────────────────────────

  useEffect(() => {
    if (!activeSession) {
      setSessionMessages([])
      setSessionMembers([])
      setTypingUsers([])
      return
    }

    type RawSessionMsg = { id: string; session_id: string; user_id: string; content: string; created_at: string; users: { username: string } | { username: string }[] | null }
    type RawSessionMember = { session_id: string; user_id: string; joined_at: string; users: { username: string } | { username: string }[] | null }

    async function fetchSessionMessages() {
      const { data } = await supabase
        .from('session_messages')
        .select('id, session_id, user_id, content, created_at, users(username)')
        .eq('session_id', activeSession!.id)
        .order('created_at', { ascending: true })
        .limit(200) as { data: RawSessionMsg[] | null }
      if (data) {
        setSessionMessages(data.map(m => ({
          id: m.id,
          session_id: m.session_id,
          user_id: m.user_id,
          content: m.content,
          created_at: m.created_at,
          username: (Array.isArray(m.users) ? m.users[0]?.username : (m.users as { username: string } | null)?.username) ?? m.user_id,
        })))
      }
    }

    async function fetchSessionMembers() {
      const { data } = await supabase
        .from('session_members')
        .select('session_id, user_id, joined_at, users(username)')
        .eq('session_id', activeSession!.id) as { data: RawSessionMember[] | null }
      if (data) {
        setSessionMembers(data.map(m => ({
          session_id: m.session_id,
          user_id: m.user_id,
          joined_at: m.joined_at,
          username: (Array.isArray(m.users) ? m.users[0]?.username : (m.users as { username: string } | null)?.username) ?? m.user_id,
        })))
      }
    }

    fetchSessionMessages()
    fetchSessionMembers()
    supabase.from('session_members').upsert({ session_id: activeSession.id, user_id: session.user.id }).then()

    const msgChannel = supabase
      .channel(`s-msgs-${activeSession.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'session_messages',
        filter: `session_id=eq.${activeSession.id}`,
      }, async payload => {
        const row = payload.new as { id: string; session_id: string; user_id: string; content: string; created_at: string }
        const { data: ud } = await supabase.from('users').select('username').eq('id', row.user_id).single()
        setSessionMessages(prev => {
          if (prev.some(m => m.id === row.id)) return prev
          return [...prev, { ...row, username: ud?.username ?? row.user_id }]
        })
      })
      .subscribe()

    const memberChannel = supabase
      .channel(`s-members-${activeSession.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'session_members',
        filter: `session_id=eq.${activeSession.id}`,
      }, fetchSessionMembers)
      .subscribe()

    const typingCh = supabase
      .channel(`s-typing-${activeSession.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === session.user.id) return
        setTypingUsers(prev => prev.includes(payload.username) ? prev : [...prev, payload.username])
      })
      .on('broadcast', { event: 'idle' }, ({ payload }) => {
        setTypingUsers(prev => prev.filter(u => u !== payload.username))
      })
      .subscribe()

    typingChannelRef.current = typingCh

    return () => {
      supabase.from('session_members').delete()
        .eq('session_id', activeSession.id)
        .eq('user_id', session.user.id)
        .then()
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(memberChannel)
      supabase.removeChannel(typingCh)
      typingChannelRef.current = null
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [activeSession, supabase, session.user.id])

  // ── Scroll to bottom on session messages ───────────────────────────────────

  useEffect(() => {
    sessionEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessionMessages])

  // ── Load private messages + real-time ──────────────────────────────────────

  useEffect(() => {
    if (!activeDm) {
      setDmMessages([])
      return
    }

    type RawDm = {
      id: string
      sender_id: string
      receiver_id: string
      content: string
      created_at: string
      users: { username: string } | { username: string }[] | null
    }

    async function fetchDms() {
      const { data } = await supabase
        .from('private_messages')
        .select('id, sender_id, receiver_id, content, created_at, users!private_messages_sender_id_fkey(username)')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${activeDm!.id}),and(sender_id.eq.${activeDm!.id},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true })
        .limit(100) as { data: RawDm[] | null }
      if (data) {
        setDmMessages(data.map(m => ({
          id: m.id,
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          content: m.content,
          created_at: m.created_at,
          username: (Array.isArray(m.users) ? m.users[0]?.username : (m.users as { username: string } | null)?.username) ?? m.sender_id,
        })))
      }
    }

    fetchDms()

    const channel = supabase
      .channel(`dm-${[session.user.id, activeDm.id].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        async payload => {
          const row = payload.new as { id: string; sender_id: string; receiver_id: string; content: string; created_at: string }
          const isRelevant =
            (row.sender_id === session.user.id && row.receiver_id === activeDm!.id) ||
            (row.sender_id === activeDm!.id && row.receiver_id === session.user.id)
          if (!isRelevant) return
          const { data: ud } = await supabase.from('users').select('username').eq('id', row.sender_id).single()
          setDmMessages(prev => {
            if (prev.some(m => m.id === row.id)) return prev
            return [...prev, { ...row, username: ud?.username ?? row.sender_id }]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeDm, supabase, session.user.id])

  // ── Scroll to bottom on DM messages ────────────────────────────────────────

  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dmMessages])

  // ── Send message ────────────────────────────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voz-${Date.now()}.webm`, { type: 'audio/webm' })
        setAttachedFile(file)
        setAttachmentType('audio')
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch {
      alert('No se pudo acceder al micrófono.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  function handlePdfSelect(file: File) {
    setAttachedFile(file)
    setAttachmentType('pdf')
  }

  function clearAttachment() {
    setAttachedFile(null)
    setAttachmentType(null)
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content && !attachedFile) return
    if (!activeCommunity) return

    let attachment_url: string | null = null
    let attachment_type: 'pdf' | 'audio' | null = null

    if (attachedFile) {
      setIsUploading(true)
      const ext = attachedFile.name.split('.').pop() ?? 'bin'
      const path = `${session.user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, attachedFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path)
        attachment_url = urlData.publicUrl
        attachment_type = attachmentType
      }
      setIsUploading(false)
    }

    const optimisticId = `opt-${Date.now()}`

    setMessages(prev => [
      ...prev,
      {
        id: optimisticId,
        community_id: activeCommunity.id,
        user_id: session.user.id,
        content,
        attachment_url,
        attachment_type,
        created_at: new Date().toISOString(),
        username: currentUser?.username ?? session.user.email ?? session.user.id,
        optimistic: true,
      },
    ])
    setNewMessage('')
    setAttachedFile(null)
    setAttachmentType(null)

    await supabase.from('messages').insert({
      community_id: activeCommunity.id,
      user_id: session.user.id,
      content: content || '',
      attachment_url,
      attachment_type,
    })
  }

  // ── Send private message ─────────────────────────────────────────────────

  async function sendDm(e: FormEvent) {
    e.preventDefault()
    const content = dmInput.trim()
    if (!content || !activeDm) return
    setDmInput('')
    await supabase.from('private_messages').insert({
      sender_id: session.user.id,
      receiver_id: activeDm.id,
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

  // ── Presence handlers ───────────────────────────────────────────────────────

  async function createSession(e: FormEvent) {
    e.preventDefault()
    const topic = newSessionTopic.trim()
    if (!topic) return
    setSessionError('')
    const { data, error } = await supabase
      .from('live_sessions')
      .insert({ topic, created_by: session.user.id })
      .select()
      .single()
    if (error) { setSessionError(error.message); return }
    setNewSessionTopic('')
    if (data) setActiveSession(data as LiveSession)
  }

  function joinSession(s: LiveSession) {
    setActiveSession(s)
  }

  function leaveSession() {
    setActiveSession(null)
  }

  function handleSessionTyping() {
    const username = currentUser?.username ?? 'alguien'
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: session.user.id, username },
    })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.send({
        type: 'broadcast',
        event: 'idle',
        payload: { userId: session.user.id, username },
      })
    }, 1500)
  }

  async function sendSessionMessage(e: FormEvent) {
    e.preventDefault()
    const content = sessionMsgInput.trim()
    if (!content || !activeSession) return
    setSessionMsgInput('')
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'idle',
      payload: { userId: session.user.id, username: currentUser?.username ?? 'alguien' },
    })
    await supabase.from('session_messages').insert({
      session_id: activeSession.id,
      user_id: session.user.id,
      content,
    })
  }

  function handleLogout() {
    supabase.auth.signOut()
  }

  function handleSectionChange(s: Section) {
    if (activeSession && s !== 'presence') setActiveSession(null)
    if (s !== 'messages') setActiveDm(null)
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
              attachedFile={attachedFile}
              attachmentType={attachmentType}
              isRecording={isRecording}
              isUploading={isUploading}
              onPdfSelect={handlePdfSelect}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              onClearAttach={clearAttachment}
            />
          )}
          {activeSection === 'friends' && (
            <FriendsSection users={users} currentUserId={session.user.id} />
          )}
          {activeSection === 'messages' && (
            <MessagesSection
              users={users}
              currentUserId={session.user.id}
              activeDm={activeDm}
              setActiveDm={setActiveDm}
              dmMessages={dmMessages}
              dmInput={dmInput}
              setDmInput={setDmInput}
              sendDm={sendDm}
              dmEndRef={dmEndRef}
            />
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
          {activeSection === 'presence' && (
            <PresenceSection
              currentUser={currentUser}
              liveSessions={liveSessions}
              allSessionMembers={allSessionMembers}
              activeSession={activeSession}
              sessionMessages={sessionMessages}
              sessionMembers={sessionMembers}
              typingUsers={typingUsers}
              sessionMsgInput={sessionMsgInput}
              setSessionMsgInput={setSessionMsgInput}
              newSessionTopic={newSessionTopic}
              setNewSessionTopic={setNewSessionTopic}
              sessionError={sessionError}
              onJoinSession={joinSession}
              onLeaveSession={leaveSession}
              onCreateSession={createSession}
              onSendSessionMessage={sendSessionMessage}
              onSessionTyping={handleSessionTyping}
              sessionEndRef={sessionEndRef}
            />
          )}
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
