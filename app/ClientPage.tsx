'use client'

import { useState, useEffect, useRef, FormEvent, Component, ReactNode } from 'react'
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
  description?: string
  created_by?: string | null
  tags?: string[]
}

type Message = {
  id: string
  community_id: string
  user_id: string
  content: string
  title?: string | null
  attachment_url?: string | null
  attachment_type?: 'pdf' | 'audio' | null
  created_at: string
  username: string
  optimistic?: boolean
}

type SearchResults = {
  posts: Message[]
  communities: Community[]
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

type Comment = {
  id: string
  message_id: string
  user_id: string
  content: string
  created_at: string
  username: string
}

type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

type Notification = {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'mention'
  from_user_id: string | null
  entity_id: string | null
  content: string
  read: boolean
  created_at: string
  from_username?: string
}

type UserLink = {
  user_id: string
  link_type: 'github' | 'arxiv' | 'orcid' | 'linkedin' | 'twitter' | 'website'
  url: string
}

type Section = 'communities' | 'friends' | 'messages' | 'explore' | 'presence' | 'profile' | 'settings' | 'notifications'

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

const IcoComment = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </Ico>
)

const IcoBookmark = ({ size = 14, filled = false }: IcoProps & { filled?: boolean }) => (
  <Ico size={size}>
    <path
      d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Ico>
)

const IcoPlus = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <path d="M12 5v14M5 12h14" />
  </Ico>
)

const IcoUsers = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </Ico>
)

const IcoBell = ({ size = 20 }: IcoProps) => (
  <Ico size={size}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </Ico>
)

const IcoCode = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </Ico>
)

const IcoTag = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Ico>
)

const IcoLink = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </Ico>
)

const IcoCheck = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <polyline points="20 6 9 17 4 12" />
  </Ico>
)

const IcoUserPlus = ({ size = 14 }: IcoProps) => (
  <Ico size={size}>
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </Ico>
)

const IcoMenu = ({ size = 22 }: IcoProps) => (
  <Ico size={size}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </Ico>
)

// ─── TopBar ──────────────────────────────────────────────────────────────────────

function TopBar({
  searchQuery,
  onSearchChange,
  searchRef,
  onMenuToggle,
  onLogout,
  onNotificationsClick,
  unreadCount,
  username,
}: {
  searchQuery: string
  onSearchChange: (v: string) => void
  searchRef: React.RefObject<HTMLInputElement | null>
  onMenuToggle: () => void
  onLogout: () => void
  onNotificationsClick: () => void
  unreadCount: number
  username: string
}) {
  const initial = (username || '?').charAt(0).toUpperCase()
  return (
    <header className="topbar" role="banner">
      <button
        type="button"
        className="topbar-menu-btn"
        onClick={onMenuToggle}
        aria-label="Abrir menú de navegación"
      >
        <IcoMenu size={22} />
      </button>
      <span className="topbar-brand">Contenline</span>
      <div className="topbar-search-wrap">
        <label className="topbar-search" onClick={() => searchRef.current?.focus()}>
          <span className="topbar-search-icon" aria-hidden><IcoSearch size={15} /></span>
          <span className="sr-only">Buscar</span>
          <input
            ref={searchRef}
            className="topbar-input"
            type="text"
            placeholder="Buscar"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Buscar comunidades, publicaciones y personas"
          />
          <span className="topbar-kbd" aria-hidden>Ctrl K</span>
        </label>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-icon-btn"
          onClick={onNotificationsClick}
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
          title="Notificaciones"
        >
          <span className="sidebar-icon-wrap">
            <IcoBell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge" aria-hidden>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          className="topbar-link"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          Salir
        </button>
        <span className="topbar-avatar" aria-hidden>{initial}</span>
      </div>
    </header>
  )
}

// ─── Sidebar ────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { section: Section; label: string; Icon: (p: IcoProps) => ReactNode }[] = [
  { section: 'communities',   label: 'Comunidades',    Icon: IcoCommunities },
  { section: 'friends',       label: 'Amigos',         Icon: IcoFriends },
  { section: 'messages',      label: 'Mensajes',       Icon: IcoMessages },
  { section: 'explore',       label: 'Explorar',       Icon: IcoExplore },
  { section: 'presence',      label: 'Presencia',      Icon: IcoPresence },
  { section: 'notifications', label: 'Notificaciones', Icon: IcoBell },
  { section: 'profile',       label: 'Perfil',         Icon: IcoProfile },
  { section: 'settings',      label: 'Ajustes',        Icon: IcoSettings },
]

function Sidebar({
  activeSection,
  onSectionChange,
  onLogout,
  username,
  unreadCount,
  open,
  onClose,
}: {
  activeSection: Section
  onSectionChange: (s: Section) => void
  onLogout: () => void
  username: string
  unreadCount: number
  open: boolean
  onClose: () => void
}) {
  const handleSelect = (s: Section) => {
    onSectionChange(s)
    onClose()
  }

  return (
    <>
      <div
        className={`sidebar-overlay${open ? ' sidebar-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`sidebar${open ? ' sidebar--open' : ''}`}
        aria-label="Navegación principal"
        role="navigation"
      >
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ section, label, Icon }) => (
            <button
              key={section}
              className={`sidebar-item${activeSection === section ? ' sidebar-item--active' : ''}`}
              onClick={() => handleSelect(section)}
              title={label}
              aria-current={activeSection === section ? 'page' : undefined}
            >
              <span className="sidebar-icon-wrap">
                <Icon />
                {section === 'notifications' && unreadCount > 0 && (
                  <span className="notif-badge" aria-label={`${unreadCount} sin leer`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="sidebar-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="sidebar-user-dot" aria-hidden />
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
    </>
  )
}

// ─── Bottom Navigation (mobile only) ─────────────────────────────────────────

const BOTTOM_NAV_ITEMS: { section: Section; label: string; Icon: (p: IcoProps) => ReactNode }[] = [
  { section: 'communities',   label: 'Inicio',    Icon: IcoCommunities },
  { section: 'explore',       label: 'Explorar',  Icon: IcoExplore },
  { section: 'presence',      label: 'Presencia', Icon: IcoPresence },
  { section: 'notifications', label: 'Avisos',    Icon: IcoBell },
  { section: 'profile',       label: 'Perfil',    Icon: IcoProfile },
]

function BottomNav({
  activeSection,
  onSectionChange,
  unreadCount,
}: {
  activeSection: Section
  onSectionChange: (s: Section) => void
  unreadCount: number
}) {
  return (
    <nav className="bottom-nav" aria-label="Navegación inferior">
      {BOTTOM_NAV_ITEMS.map(({ section, label, Icon }) => (
        <button
          key={section}
          type="button"
          className={`bottom-nav-item${activeSection === section ? ' bottom-nav-item--active' : ''}`}
          onClick={() => onSectionChange(section)}
          aria-current={activeSection === section ? 'page' : undefined}
          aria-label={label}
        >
          <span className="sidebar-icon-wrap">
            <Icon size={20} />
            {section === 'notifications' && unreadCount > 0 && (
              <span className="notif-badge" aria-label={`${unreadCount} sin leer`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// Supabase joins on a to-one relation can be typed as either a single object
// or an array depending on the schema introspection. Normalize both shapes.
type UserRelation = { username: string } | { username: string }[] | null
function pickUsername(rel: UserRelation, fallback: string): string {
  if (!rel) return fallback
  if (Array.isArray(rel)) return rel[0]?.username ?? fallback
  return rel.username ?? fallback
}

// ─── Content Sections ───────────────────────────────────────────────────────────

// ─── Content renderer: @mentions, ```code```, and URL link previews ─────────────

const URL_REGEX = /https?:\/\/[^\s<>"]+/g
const MENTION_REGEX = /@([\w-]+)/g

function LinkChip({ url }: { url: string }) {
  let label = url.replace(/^https?:\/\//, '')
  let chipClass = 'link-chip'

  if (/github\.com/.test(url)) {
    const m = url.match(/github\.com\/([^/]+\/[^/\s?#]+)/)
    label = m ? `GitHub: ${m[1]}` : 'GitHub'
    chipClass += ' link-chip--github'
  } else if (/arxiv\.org/.test(url)) {
    const m = url.match(/arxiv\.org\/abs\/([^\s?#]+)/)
    label = m ? `arXiv: ${m[1]}` : 'arXiv'
    chipClass += ' link-chip--arxiv'
  } else if (label.length > 50) {
    label = label.slice(0, 47) + '…'
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={chipClass}>
      <IcoLink size={12} />
      {label}
    </a>
  )
}

function renderContent(text: string, allUsers: AppUser[]): ReactNode {
  if (!text) return null

  // Split on ``` code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).replace(/^\n/, '')
          return <pre key={i} className="msg-code-block"><code>{code}</code></pre>
        }

        // For non-code parts: split on URLs then process mentions
        const urlSplit = part.split(URL_REGEX)
        const urls = part.match(URL_REGEX) ?? []

        const nodes: ReactNode[] = []
        urlSplit.forEach((segment, j) => {
          // Process @mentions within non-URL text
          const mentionParts = segment.split(MENTION_REGEX)
          mentionParts.forEach((mp, k) => {
            if (k % 2 === 1) {
              // This is a capture group (username)
              const mentioned = allUsers.find(u => u.username.toLowerCase() === mp.toLowerCase())
              nodes.push(
                <span key={`m-${i}-${j}-${k}`} className={`mention${mentioned ? ' mention--valid' : ''}`}>
                  @{mp}
                </span>
              )
            } else if (mp) {
              nodes.push(<span key={`t-${i}-${j}-${k}`}>{mp}</span>)
            }
          })
          if (urls[j]) {
            nodes.push(<LinkChip key={`u-${i}-${j}`} url={urls[j]} />)
          }
        })
        return <span key={i}>{nodes}</span>
      })}
    </>
  )
}

function MessageAttachment({ url, type }: { url: string; type: 'pdf' | 'audio' }) {
  if (type === 'pdf') {
    const filename = decodeURIComponent(url.split('/').pop() ?? 'documento.pdf').replace(/^\d+-/, '')
    const viewerUrl = `/pdf-viewer?url=${encodeURIComponent(url)}`
    return (
      <div className="msg-attachment-pdf-wrap">
        <a
          href={viewerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="msg-attachment-pdf"
        >
          <IcoPdf size={14} />
          {filename}
        </a>
        <a
          href={url}
          download={filename}
          className="msg-attachment-download"
          title="Descargar PDF"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>
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
  messageTitle,
  setMessageTitle,
  sendMessage,
  messagesEndRef,
  allUsers,
  attachedFile,
  attachmentType,
  isRecording,
  isUploading,
  recordError,
  onPdfSelect,
  onStartRecord,
  onStopRecord,
  onClearAttach,
  comments,
  expandedComments,
  commentInputs,
  toggleComments,
  setCommentInput,
  sendComment,
  currentUser,
  joinedCommunityIds,
  allCommunityMembers,
  onJoinCommunity,
  onLeaveCommunity,
  savedPostIds,
  onSavePost,
  onUnsavePost,
  showCreateCommunity,
  setShowCreateCommunity,
  newCommunityName,
  setNewCommunityName,
  newCommunityDesc,
  setNewCommunityDesc,
  createCommunity,
  communityError,
  showAllCommunities,
  setShowAllCommunities,
}: {
  communities: Community[]
  activeCommunity: Community | null
  setActiveCommunity: (c: Community) => void
  messages: Message[]
  newMessage: string
  setNewMessage: (v: string) => void
  messageTitle: string
  setMessageTitle: (v: string) => void
  sendMessage: (e: FormEvent) => void
  messagesEndRef: React.RefObject<HTMLLIElement | null>
  attachedFile: File | null
  attachmentType: 'pdf' | 'audio' | null
  isRecording: boolean
  isUploading: boolean
  recordError: string
  onPdfSelect: (file: File) => void
  onStartRecord: () => void
  onStopRecord: () => void
  onClearAttach: () => void
  allUsers: AppUser[]
  comments: Record<string, Comment[]>
  expandedComments: Set<string>
  commentInputs: Record<string, string>
  toggleComments: (messageId: string) => void
  setCommentInput: (messageId: string, value: string) => void
  sendComment: (messageId: string, e: FormEvent) => void
  currentUser: AppUser | undefined
  joinedCommunityIds: Set<string>
  allCommunityMembers: { community_id: string; user_id: string }[]
  onJoinCommunity: (id: string) => void
  onLeaveCommunity: (id: string) => void
  savedPostIds: Set<string>
  onSavePost: (id: string) => void
  onUnsavePost: (id: string) => void
  showCreateCommunity: boolean
  setShowCreateCommunity: (v: boolean) => void
  newCommunityName: string
  setNewCommunityName: (v: string) => void
  newCommunityDesc: string
  setNewCommunityDesc: (v: string) => void
  createCommunity: (e: FormEvent) => void
  communityError: string
  showAllCommunities: boolean
  setShowAllCommunities: (v: boolean) => void
}) {
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const displayCommunities = showAllCommunities
    ? communities
    : communities.filter(c => joinedCommunityIds.has(c.id))

  return (
    <div>
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Comunidades</span>
        {currentUser && (
          <button
            className="comm-create-btn"
            onClick={() => setShowCreateCommunity(!showCreateCommunity)}
            title="Crear comunidad"
          >
            <IcoPlus size={12} />
            {showCreateCommunity ? 'Cancelar' : 'Nueva'}
          </button>
        )}
      </div>

      {showCreateCommunity && (
        <div className="create-community-form">
          <form onSubmit={createCommunity}>
            <input
              type="text"
              placeholder="Nombre de la comunidad"
              value={newCommunityName}
              onChange={e => setNewCommunityName(e.target.value)}
              maxLength={100}
              required
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={newCommunityDesc}
              onChange={e => setNewCommunityDesc(e.target.value)}
              maxLength={500}
              style={{ marginTop: '0.4rem' }}
            />
            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" disabled={!newCommunityName.trim()}>
                Crear comunidad
              </button>
            </div>
            {communityError && <p className="error-text">{communityError}</p>}
          </form>
        </div>
      )}

      <div className="comm-filter-tabs">
        <button
          className={`comm-tab${!showAllCommunities ? ' comm-tab--active' : ''}`}
          onClick={() => setShowAllCommunities(false)}
        >
          Mis comunidades
        </button>
        <button
          className={`comm-tab${showAllCommunities ? ' comm-tab--active' : ''}`}
          onClick={() => setShowAllCommunities(true)}
        >
          Todas
        </button>
      </div>

      <div className="community-list">
        {displayCommunities.length === 0 && !showAllCommunities && (
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.83rem', color: '#bbb', marginBottom: '0.5rem' }}>
              Aún no te has unido a ninguna comunidad.
            </p>
            <button className="comm-tab" style={{ fontSize: '0.78rem' }} onClick={() => setShowAllCommunities(true)}>
              Ver todas →
            </button>
          </div>
        )}
        {displayCommunities.map(c => {
          const memberCount = allCommunityMembers.filter(m => m.community_id === c.id).length
          const isJoined = joinedCommunityIds.has(c.id)
          return (
            <div key={c.id} className="community-item">
              <button
                className={`community-btn${activeCommunity?.id === c.id ? ' community-btn--active' : ''}`}
                onClick={() => setActiveCommunity(c)}
                style={{ flex: 1 }}
              >
                <IcoCommunities size={15} />
                <span style={{ flex: 1, textAlign: 'left' }}>{c.name}</span>
                {memberCount > 0 && (
                  <span className="community-member-count">
                    <IcoUsers size={11} />
                    {memberCount}
                  </span>
                )}
              </button>
              {currentUser && (
                <button
                  className={isJoined ? 'community-leave-btn' : 'community-join-btn'}
                  onClick={() => isJoined ? onLeaveCommunity(c.id) : onJoinCommunity(c.id)}
                  title={isJoined ? 'Salir de la comunidad' : 'Unirse a la comunidad'}
                >
                  {isJoined ? '✓' : '+'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {activeCommunity ? (
        <>
          <div style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ marginBottom: '0.15rem' }}>{activeCommunity.name}</h2>
            {activeCommunity.description && (
              <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>{activeCommunity.description}</p>
            )}
          </div>

          <ul className="messages-list">
            {messages.length === 0 && (
              <li style={{ color: '#ccc', fontSize: '0.8rem', fontStyle: 'italic', border: 'none' }}>
                Sé el primero en publicar algo…
              </li>
            )}
            {messages.map(m => (
              <li key={m.id} className={m.optimistic ? 'msg-pending' : ''}>
                {m.title && <div className="post-title">{m.title}</div>}
                <div className="msg-content-row">
                  <div className="msg-body">
                    <strong>{m.username}</strong>
                    {m.content && <span className="msg-text">: {renderContent(m.content, allUsers)}</span>}
                    {m.attachment_url && m.attachment_type && (
                      <div className="msg-attachment-wrap">
                        <MessageAttachment url={m.attachment_url} type={m.attachment_type} />
                      </div>
                    )}
                  </div>
                  <div className="msg-actions">
                    {!m.optimistic && currentUser && (
                      <button
                        className={`post-save-btn${savedPostIds.has(m.id) ? ' post-save-btn--saved' : ''}`}
                        onClick={() => savedPostIds.has(m.id) ? onUnsavePost(m.id) : onSavePost(m.id)}
                        title={savedPostIds.has(m.id) ? 'Quitar de guardados' : 'Guardar publicación'}
                      >
                        <IcoBookmark size={12} filled={savedPostIds.has(m.id)} />
                      </button>
                    )}
                    {!m.optimistic && (
                      <button
                        className="comment-toggle-btn"
                        onClick={() => toggleComments(m.id)}
                        title={expandedComments.has(m.id) ? 'Ocultar comentarios' : 'Ver comentarios'}
                      >
                        <IcoComment size={12} />
                        {(comments[m.id]?.length ?? 0) > 0 && (
                          <span className="comment-count">{comments[m.id].length}</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {!m.optimistic && expandedComments.has(m.id) && (
                  <div className="comment-section">
                    {(comments[m.id] ?? []).length === 0 ? (
                      <p className="comment-empty">Sin comentarios aún.</p>
                    ) : (
                      <ul className="comment-list">
                        {(comments[m.id] ?? []).map(c => (
                          <li key={c.id} className="comment-item">
                            <strong className="comment-author">{c.username}</strong>
                            <span className="comment-text">: {renderContent(c.content, allUsers)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {currentUser && (
                      <form className="comment-form" onSubmit={e => sendComment(m.id, e)}>
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Añade un comentario…"
                          value={commentInputs[m.id] ?? ''}
                          onChange={e => setCommentInput(m.id, e.target.value)}
                          maxLength={1000}
                        />
                        <button
                          type="submit"
                          className="comment-submit-btn"
                          disabled={!(commentInputs[m.id]?.trim())}
                        >
                          Enviar
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            ))}
            <li ref={messagesEndRef} />
          </ul>

          {currentUser && (
            <div className="post-form">
              <input
                type="text"
                className="post-title-input"
                placeholder="Título de la publicación (opcional)"
                value={messageTitle}
                onChange={e => setMessageTitle(e.target.value)}
                maxLength={300}
              />
              {attachedFile && (
                <div className="attach-preview" style={{ margin: '0.4rem 0' }}>
                  {attachmentType === 'pdf' ? <IcoPdf size={14} /> : <IcoMic size={14} />}
                  <span className="attach-preview-name">{attachedFile.name}</span>
                  <button type="button" className="attach-clear-btn" onClick={onClearAttach} title="Quitar archivo">
                    <IcoX size={12} />
                  </button>
                </div>
              )}
              <form className="inline-form" style={{ marginTop: '0.4rem' }} onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder={attachedFile ? 'Añade texto opcional…' : 'Escribe el contenido…'}
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

                <button
                  type="button"
                  className="attach-btn"
                  title="Insertar bloque de código"
                  onClick={() => {
                    const before = newMessage
                    setNewMessage(before + (before && !before.endsWith('\n') ? '\n' : '') + '```\n\n```')
                  }}
                >
                  <IcoCode size={15} />
                </button>

                <button
                  type="submit"
                  disabled={isUploading || isRecording || (!newMessage.trim() && !attachedFile && !messageTitle.trim())}
                >
                  {isUploading ? 'Subiendo…' : 'Publicar'}
                </button>
              </form>
              {recordError && <p className="error-text">{recordError}</p>}
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: '0.85rem', color: '#bbb' }}>
          {displayCommunities.length > 0
            ? 'Selecciona una comunidad para ver las publicaciones.'
            : 'Únete a una comunidad para comenzar.'}
        </p>
      )}
    </div>
  )
}

function FriendsSection({
  users,
  currentUserId,
  friendships,
  onSendRequest,
  onAccept,
  onReject,
  onRemove,
  userSkillsMap,
}: {
  users: AppUser[]
  currentUserId: string
  friendships: Friendship[]
  onSendRequest: (userId: string) => void
  onAccept: (friendshipId: string) => void
  onReject: (friendshipId: string) => void
  onRemove: (friendshipId: string) => void
  userSkillsMap: Record<string, string[]>
}) {
  const [tab, setTab] = useState<'friends' | 'pending' | 'discover'>('friends')

  const getFriendship = (userId: string) =>
    friendships.find(f =>
      (f.requester_id === currentUserId && f.addressee_id === userId) ||
      (f.addressee_id === currentUserId && f.requester_id === userId)
    )

  const friends = friendships
    .filter(f => f.status === 'accepted')
    .map(f => {
      const otherId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
      return { friendship: f, user: users.find(u => u.id === otherId) }
    })
    .filter(x => x.user)

  const incoming = friendships.filter(
    f => f.status === 'pending' && f.addressee_id === currentUserId
  )
  const outgoing = friendships.filter(
    f => f.status === 'pending' && f.requester_id === currentUserId
  )

  const discover = users.filter(u => u.id !== currentUserId && !getFriendship(u.id))

  return (
    <div>
      <div className="section-title">Amigos</div>

      <div className="comm-filter-tabs" style={{ marginBottom: '1.25rem' }}>
        <button
          className={`comm-tab${tab === 'friends' ? ' comm-tab--active' : ''}`}
          onClick={() => setTab('friends')}
        >
          Amigos ({friends.length})
        </button>
        <button
          className={`comm-tab${tab === 'pending' ? ' comm-tab--active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Solicitudes {incoming.length > 0 && <span className="notif-inline">{incoming.length}</span>}
        </button>
        <button
          className={`comm-tab${tab === 'discover' ? ' comm-tab--active' : ''}`}
          onClick={() => setTab('discover')}
        >
          Descubrir
        </button>
      </div>

      {tab === 'friends' && (
        <>
          {friends.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#bbb' }}>
              Aún no tienes amigos. Ve a &ldquo;Descubrir&rdquo; para enviar solicitudes.
            </p>
          ) : (
            friends.map(({ friendship, user }) => user && (
              <div key={user.id} className="friend-item">
                <div className="friend-avatar">{user.username.charAt(0).toUpperCase()}</div>
                <div className="friend-info">
                  <div className="friend-name">@{user.username}</div>
                  {user.public_status
                    ? <div className="friend-status">{user.public_status}</div>
                    : <div className="friend-status" style={{ color: '#ccc' }}>Sin estado</div>
                  }
                  {(userSkillsMap[user.id] ?? []).length > 0 && (
                    <div className="skill-tags-row">
                      {userSkillsMap[user.id].map(s => (
                        <span key={s} className="skill-tag">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="btn-ghost-sm"
                  onClick={() => onRemove(friendship.id)}
                  title="Eliminar amistad"
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'pending' && (
        <>
          {incoming.length === 0 && outgoing.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#bbb' }}>No hay solicitudes pendientes.</p>
          ) : null}

          {incoming.length > 0 && (
            <>
              <h2>Recibidas ({incoming.length})</h2>
              {incoming.map(f => {
                const sender = users.find(u => u.id === f.requester_id)
                if (!sender) return null
                return (
                  <div key={f.id} className="friend-item">
                    <div className="friend-avatar">{sender.username.charAt(0).toUpperCase()}</div>
                    <div className="friend-info">
                      <div className="friend-name">@{sender.username}</div>
                      {sender.public_status && <div className="friend-status">{sender.public_status}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="community-join-btn"
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                        onClick={() => onAccept(f.id)}
                      >
                        <IcoCheck size={12} /> Aceptar
                      </button>
                      <button
                        className="btn-ghost-sm"
                        onClick={() => onReject(f.id)}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {outgoing.length > 0 && (
            <>
              <h2 style={{ marginTop: incoming.length > 0 ? '1rem' : 0 }}>Enviadas ({outgoing.length})</h2>
              {outgoing.map(f => {
                const receiver = users.find(u => u.id === f.addressee_id)
                if (!receiver) return null
                return (
                  <div key={f.id} className="friend-item">
                    <div className="friend-avatar">{receiver.username.charAt(0).toUpperCase()}</div>
                    <div className="friend-info">
                      <div className="friend-name">@{receiver.username}</div>
                      <div className="friend-status" style={{ color: '#aaa' }}>Solicitud pendiente…</div>
                    </div>
                    <button className="btn-ghost-sm" onClick={() => onReject(f.id)}>Cancelar</button>
                  </div>
                )
              })}
            </>
          )}
        </>
      )}

      {tab === 'discover' && (
        <>
          <h2>{discover.length} {discover.length === 1 ? 'persona' : 'personas'}</h2>
          {discover.map(u => (
            <div key={u.id} className="friend-item">
              <div className="friend-avatar">{u.username.charAt(0).toUpperCase()}</div>
              <div className="friend-info">
                <div className="friend-name">@{u.username}</div>
                {u.public_status
                  ? <div className="friend-status">{u.public_status}</div>
                  : <div className="friend-status" style={{ color: '#ccc' }}>Sin estado</div>
                }
                {(userSkillsMap[u.id] ?? []).length > 0 && (
                  <div className="skill-tags-row">
                    {userSkillsMap[u.id].map(s => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="community-join-btn"
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => onSendRequest(u.id)}
              >
                <IcoUserPlus size={12} /> Agregar
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const LINK_TYPES: UserLink['link_type'][] = ['github', 'arxiv', 'orcid', 'linkedin', 'twitter', 'website']
const LINK_LABELS: Record<UserLink['link_type'], string> = {
  github: 'GitHub', arxiv: 'arXiv', orcid: 'ORCID',
  linkedin: 'LinkedIn', twitter: 'Twitter/X', website: 'Sitio web',
}

function ProfileSection({
  currentUser,
  email,
  statusInput,
  setStatusInput,
  updateStatus,
  statusError,
  mySkills,
  onAddSkill,
  onRemoveSkill,
  myLinks,
  onUpsertLink,
  onRemoveLink,
}: {
  currentUser: AppUser | undefined
  email: string
  statusInput: string
  setStatusInput: (v: string) => void
  updateStatus: (e: FormEvent) => void
  statusError: string
  mySkills: string[]
  onAddSkill: (s: string) => void
  onRemoveSkill: (s: string) => void
  myLinks: UserLink[]
  onUpsertLink: (lt: UserLink['link_type'], url: string) => void
  onRemoveLink: (lt: UserLink['link_type']) => void
}) {
  const [skillInput, setSkillInput] = useState('')
  const [editingLink, setEditingLink] = useState<UserLink['link_type'] | null>(null)
  const [linkInput, setLinkInput] = useState('')

  function handleAddSkill(e: FormEvent) {
    e.preventDefault()
    const s = skillInput.trim().toLowerCase()
    if (!s || mySkills.includes(s) || mySkills.length >= 10) return
    onAddSkill(s)
    setSkillInput('')
  }

  function startEditLink(lt: UserLink['link_type']) {
    const existing = myLinks.find(l => l.link_type === lt)
    setLinkInput(existing?.url ?? '')
    setEditingLink(lt)
  }

  function handleSaveLink(e: FormEvent) {
    e.preventDefault()
    if (!editingLink) return
    const url = linkInput.trim()
    if (url) onUpsertLink(editingLink, url)
    else onRemoveLink(editingLink)
    setEditingLink(null)
    setLinkInput('')
  }

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
              <div className="profile-status-text">&ldquo;{currentUser.public_status}&rdquo;</div>
            )}
            {mySkills.length > 0 && (
              <div className="skill-tags-row" style={{ marginTop: '0.5rem' }}>
                {mySkills.map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
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

      <section>
        <h2><IcoTag size={11} /> Especialidades / Skills</h2>
        <div className="skill-tags-row" style={{ marginBottom: '0.75rem', minHeight: '1.5rem' }}>
          {mySkills.map(s => (
            <span key={s} className="skill-tag skill-tag--editable">
              {s}
              <button
                type="button"
                className="skill-tag-remove"
                onClick={() => onRemoveSkill(s)}
                title={`Eliminar ${s}`}
              >
                <IcoX size={10} />
              </button>
            </span>
          ))}
          {mySkills.length === 0 && (
            <span style={{ fontSize: '0.8rem', color: '#bbb' }}>Sin skills aún.</span>
          )}
        </div>
        {mySkills.length < 10 && (
          <form className="inline-form" onSubmit={handleAddSkill}>
            <input
              type="text"
              placeholder="Ej: python, machine-learning…"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              maxLength={50}
              style={{ maxWidth: '220px' }}
            />
            <button type="submit" disabled={!skillInput.trim()}>Añadir</button>
          </form>
        )}
      </section>

      <section>
        <h2><IcoLink size={11} /> Links de perfil</h2>
        <div className="links-list">
          {LINK_TYPES.map(lt => {
            const existing = myLinks.find(l => l.link_type === lt)
            return (
              <div key={lt} className="profile-link-row">
                <span className="profile-link-type">{LINK_LABELS[lt]}</span>
                {editingLink === lt ? (
                  <form className="inline-form" onSubmit={handleSaveLink} style={{ flex: 1, display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder={`URL de ${LINK_LABELS[lt]}`}
                      value={linkInput}
                      onChange={e => setLinkInput(e.target.value)}
                      style={{ flex: 1, maxWidth: 'none' }}
                      autoFocus
                    />
                    <button type="submit" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}>
                      Guardar
                    </button>
                    <button type="button" className="btn-ghost-sm" onClick={() => setEditingLink(null)}>
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {existing ? (
                      <a href={existing.url} target="_blank" rel="noopener noreferrer" className="profile-link-url">
                        {existing.url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#ccc' }}>No configurado</span>
                    )}
                    <button
                      type="button"
                      className="btn-ghost-sm"
                      onClick={() => startEditLink(lt)}
                    >
                      {existing ? 'Editar' : 'Agregar'}
                    </button>
                    {existing && (
                      <button type="button" className="btn-ghost-sm" onClick={() => onRemoveLink(lt)}>
                        Quitar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ExploreSection({
  communities,
  joinedCommunityIds,
  allCommunityMembers,
  onJoinCommunity,
  onLeaveCommunity,
  currentUser,
  savedMessages,
  onLoadSavedMessages,
  searchQuery,
  searchResults,
  onNavigateToCommunity,
  exploreTab,
  setExploreTab,
  users,
  userSkillsMap,
}: {
  communities: Community[]
  joinedCommunityIds: Set<string>
  allCommunityMembers: { community_id: string; user_id: string }[]
  onJoinCommunity: (id: string) => void
  onLeaveCommunity: (id: string) => void
  currentUser: AppUser | undefined
  savedMessages: Message[]
  onLoadSavedMessages: () => void
  searchQuery: string
  searchResults: SearchResults | null
  onNavigateToCommunity: (c: Community) => void
  exploreTab: 'browse' | 'saved' | 'people'
  setExploreTab: (t: 'browse' | 'saved' | 'people') => void
  users: AppUser[]
  userSkillsMap: Record<string, string[]>
}) {
  const [skillFilter, setSkillFilter] = useState('')

  const prevTab = useRef(exploreTab)
  useEffect(() => {
    if (exploreTab === 'saved' && prevTab.current !== 'saved') {
      onLoadSavedMessages()
    }
    prevTab.current = exploreTab
  }, [exploreTab, onLoadSavedMessages])

  const filteredUsers = skillFilter.trim()
    ? users.filter(u => {
        if (!currentUser || u.id === currentUser.id) return false
        const skills = userSkillsMap[u.id] ?? []
        return skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()))
      })
    : users.filter(u => currentUser && u.id !== currentUser.id)

  if (searchQuery.length >= 2 && searchResults) {
    const hasResults = searchResults.communities.length > 0 || searchResults.posts.length > 0
    return (
      <div>
        <div className="section-title">Resultados para &ldquo;{searchQuery}&rdquo;</div>

        {!hasResults && (
          <p style={{ fontSize: '0.85rem', color: '#bbb' }}>Sin resultados. Intenta con otro término.</p>
        )}

        {searchResults.communities.length > 0 && (
          <>
            <h2>Comunidades</h2>
            <div className="explore-community-list" style={{ marginBottom: '1.5rem' }}>
              {searchResults.communities.map(c => {
                const memberCount = allCommunityMembers.filter(m => m.community_id === c.id).length
                const isJoined = joinedCommunityIds.has(c.id)
                return (
                  <div key={c.id} className="explore-community-card">
                    <div
                      className="explore-community-info"
                      onClick={() => onNavigateToCommunity(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="explore-community-name">{c.name}</div>
                      {c.description && <div className="explore-community-desc">{c.description}</div>}
                      <div className="explore-community-meta">
                        <IcoUsers size={11} />
                        {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                      </div>
                    </div>
                    {currentUser && (
                      <button
                        className={isJoined ? 'community-leave-btn' : 'community-join-btn'}
                        onClick={() => isJoined ? onLeaveCommunity(c.id) : onJoinCommunity(c.id)}
                      >
                        {isJoined ? 'Unido ✓' : 'Unirse'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {searchResults.posts.length > 0 && (
          <>
            <h2>Publicaciones</h2>
            <ul className="messages-list" style={{ maxHeight: 'none' }}>
              {searchResults.posts.map(m => (
                <li key={m.id}>
                  {m.title && <div className="post-title">{m.title}</div>}
                  <span><strong>{m.username}</strong>: {m.content}</span>
                  {m.attachment_url && m.attachment_type && (
                    <div className="msg-attachment-wrap">
                      <MessageAttachment url={m.attachment_url} type={m.attachment_type} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="section-title">Explorar</div>

      <div className="comm-filter-tabs" style={{ marginBottom: '1.25rem' }}>
        <button
          className={`comm-tab${exploreTab === 'browse' ? ' comm-tab--active' : ''}`}
          onClick={() => setExploreTab('browse')}
        >
          Comunidades
        </button>
        <button
          className={`comm-tab${exploreTab === 'people' ? ' comm-tab--active' : ''}`}
          onClick={() => setExploreTab('people')}
        >
          Personas
        </button>
        <button
          className={`comm-tab${exploreTab === 'saved' ? ' comm-tab--active' : ''}`}
          onClick={() => setExploreTab('saved')}
        >
          Guardados
        </button>
      </div>

      {exploreTab === 'browse' && (
        <>
          <h2>{communities.length} {communities.length === 1 ? 'comunidad' : 'comunidades'}</h2>
          <div className="explore-community-list">
            {communities.map(c => {
              const memberCount = allCommunityMembers.filter(m => m.community_id === c.id).length
              const isJoined = joinedCommunityIds.has(c.id)
              return (
                <div key={c.id} className="explore-community-card">
                  <div
                    className="explore-community-info"
                    onClick={() => onNavigateToCommunity(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="explore-community-name">{c.name}</div>
                    {c.description && <div className="explore-community-desc">{c.description}</div>}
                    <div className="explore-community-meta">
                      <IcoUsers size={11} />
                      {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                    </div>
                  </div>
                  {currentUser && (
                    <button
                      className={isJoined ? 'community-leave-btn' : 'community-join-btn'}
                      onClick={() => isJoined ? onLeaveCommunity(c.id) : onJoinCommunity(c.id)}
                    >
                      {isJoined ? 'Unido ✓' : 'Unirse'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {exploreTab === 'people' && (
        <>
          <h2>Buscar por skill</h2>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Ej: python, machine-learning, NLP…"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              style={{ maxWidth: '280px' }}
            />
          </div>
          {filteredUsers.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#bbb' }}>
              {skillFilter ? 'Sin resultados para ese skill.' : 'No hay otros usuarios aún.'}
            </p>
          ) : (
            filteredUsers.map(u => (
              <div key={u.id} className="friend-item">
                <div className="friend-avatar">{u.username.charAt(0).toUpperCase()}</div>
                <div className="friend-info">
                  <div className="friend-name">@{u.username}</div>
                  {u.public_status && <div className="friend-status">{u.public_status}</div>}
                  {(userSkillsMap[u.id] ?? []).length > 0 && (
                    <div className="skill-tags-row">
                      {userSkillsMap[u.id].map(s => (
                        <span
                          key={s}
                          className={`skill-tag${skillFilter && s.toLowerCase().includes(skillFilter.toLowerCase()) ? ' skill-tag--match' : ''}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {exploreTab === 'saved' && (
        <>
          <h2>Publicaciones guardadas</h2>
          {savedMessages.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#bbb' }}>
              Aún no has guardado ninguna publicación. Usa el icono <IcoBookmark size={12} /> en cualquier post.
            </p>
          ) : (
            <ul className="messages-list" style={{ maxHeight: 'none', marginBottom: 0 }}>
              {savedMessages.map(m => (
                <li key={m.id}>
                  {m.title && <div className="post-title">{m.title}</div>}
                  <span><strong>{m.username}</strong>: {m.content}</span>
                  {m.attachment_url && m.attachment_type && (
                    <div className="msg-attachment-wrap">
                      <MessageAttachment url={m.attachment_url} type={m.attachment_type} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
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
  onDeleteSession,
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
  onDeleteSession: (s: LiveSession) => void
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
          {currentUser && activeSession.created_by === currentUser.id && (
            <button
              className="btn-danger"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
              onClick={() => onDeleteSession(activeSession)}
              title="Eliminar sala"
            >
              Eliminar sala
            </button>
          )}
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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="session-enter-btn" onClick={() => onJoinSession(s)}>
                    Entrar →
                  </button>
                  {currentUser && s.created_by === currentUser.id && (
                    <button
                      className="btn-danger"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                      onClick={() => onDeleteSession(s)}
                      title="Eliminar sala"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
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

function NotificationsSection({
  notifications,
  users,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}: {
  notifications: Notification[]
  users: AppUser[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onNavigate: (n: Notification) => void
}) {
  const unread = notifications.filter(n => !n.read).length

  function label(n: Notification): string {
    const from = users.find(u => u.id === n.from_user_id)?.username ?? 'alguien'
    if (n.type === 'friend_request') return `@${from} te envió una solicitud de amistad`
    if (n.type === 'friend_accepted') return `@${from} aceptó tu solicitud de amistad`
    if (n.type === 'mention') return `@${from} te mencionó: ${n.content}`
    return n.content
  }

  return (
    <div>
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Notificaciones</span>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', fontWeight: 500 }}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#bbb' }}>Sin notificaciones por ahora.</p>
      ) : (
        <ul className="notif-list">
          {notifications.map(n => (
            <li
              key={n.id}
              className={`notif-item${n.read ? '' : ' notif-item--unread'}`}
              onClick={() => { if (!n.read) onMarkRead(n.id); onNavigate(n) }}
            >
              <div className="notif-dot-wrap">
                {!n.read && <span className="notif-dot" />}
              </div>
              <div className="notif-body">
                <div className="notif-text">{label(n)}</div>
                <div className="notif-time">
                  {new Date(n.created_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </li>
          ))}
        </ul>
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
          <h1>Contenline.</h1>
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
    <div className="auth-page">
      <div className="auth-container">

        <header className="auth-header">
          <div className="auth-header-brand">
            <span className="auth-dot" />
            <span className="auth-header-name">Contenline</span>
          </div>
          <nav className="auth-header-nav">
            <a href="#">Sobre</a>
            <a href="#">Privacidad</a>
            <a href="#">Ayuda</a>
          </nav>
        </header>

        <div className="auth-grid">
          <div className="auth-brand-col-mobile">
            <h1>Contenline.</h1>
            <p>Hub social intelectual</p>
          </div>

          <div className="auth-brand-col">
            <p className="auth-version">v1.0 — Beta abierta</p>
            <h1 className="auth-title">Contenline.</h1>
            <p className="auth-tagline">
              Una red social para conectar ideas, compartir conocimiento y construir comunidades en torno a lo que importa.
            </p>
          </div>

          <div className="auth-form-col">
            <div className="auth-form-wrap">
              <div className="auth-tab-nav">
                <button
                  type="button"
                  className={`auth-tab-btn${mode === 'login' ? ' auth-tab-btn--active' : ''}`}
                  onClick={() => { setMode('login'); setError('') }}
                >
                  Entrar
                </button>
                <span className="auth-tab-sep">·</span>
                <button
                  type="button"
                  className={`auth-tab-btn${mode === 'signup' ? ' auth-tab-btn--active' : ''}`}
                  onClick={() => { setMode('signup'); setError('') }}
                >
                  Registrarse
                </button>
              </div>

              <form className="auth-form-inner" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <label className="auth-field">
                    <span className="auth-field-label">Usuario</span>
                    <input
                      id="username"
                      type="text"
                      className="auth-field-input"
                      placeholder="@tuusuario"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                    />
                  </label>
                )}
                <label className="auth-field">
                  <span className="auth-field-label">Email</span>
                  <input
                    id="email"
                    type="email"
                    className="auth-field-input"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span className="auth-field-label">Contraseña</span>
                  <input
                    id="password"
                    type="password"
                    className="auth-field-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </label>
                {error && <p className="error-text">{error}</p>}
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                  {!loading && <span aria-hidden>→</span>}
                </button>
                <p className="auth-terms">Al continuar aceptas nuestros términos.</p>
              </form>
            </div>
          </div>
        </div>

        <footer className="auth-footer">
          <span>© 2026 Contenline</span>
          <span className="auth-footer-tagline">Hecho con calma.</span>
        </footer>

      </div>
    </div>
  )
}

// ─── App ────────────────────────────────────────────────────────────────────────

function App({ session }: { session: Session }) {
  const supabase = getSupabaseBrowserClient()

  const [activeSection, setActiveSection] = useState<Section>('communities')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
  const [recordError, setRecordError] = useState('')
  const messagesEndRef = useRef<HTMLLIElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const messagesRef = useRef<Message[]>([])

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
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Reddit-style state ──────────────────────────────────────────────────────
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<Set<string>>(new Set())
  const [allCommunityMembers, setAllCommunityMembers] = useState<{ community_id: string; user_id: string }[]>([])
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set())
  const [savedMessages, setSavedMessages] = useState<Message[]>([])
  const [showCreateCommunity, setShowCreateCommunity] = useState(false)
  const [newCommunityName, setNewCommunityName] = useState('')
  const [newCommunityDesc, setNewCommunityDesc] = useState('')
  const [communityError, setCommunityError] = useState('')
  const [showAllCommunities, setShowAllCommunities] = useState(false)
  const [messageTitle, setMessageTitle] = useState('')
  const [exploreTab, setExploreTab] = useState<'browse' | 'saved' | 'people'>('browse')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)

  // ── Social features state ──────────────────────────────────────────────────
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [mySkills, setMySkills] = useState<string[]>([])
  const [myLinks, setMyLinks] = useState<UserLink[]>([])
  const [userSkillsMap, setUserSkillsMap] = useState<Record<string, string[]>>({})

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

  // ── Load communities (+ real-time) ─────────────────────────────────────────

  useEffect(() => {
    async function fetchCommunities() {
      const { data } = await supabase
        .from('communities')
        .select('id, name, description, created_by')
        .order('name')
      if (data) setCommunities(data as unknown as Community[])
    }
    fetchCommunities()
    const channel = supabase
      .channel('communities-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, fetchCommunities)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // ── Load messages + real-time for active community ──────────────────────────

  useEffect(() => {
    if (!activeCommunity) return

    type RawMessage = {
      id: string
      community_id: string
      user_id: string
      content: string
      title: string | null
      attachment_url: string | null
      attachment_type: 'pdf' | 'audio' | null
      created_at: string
      users: UserRelation
    }

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('id, community_id, user_id, content, title, attachment_url, attachment_type, created_at, users(username)')
        .eq('community_id', activeCommunity!.id)
        .order('created_at', { ascending: true })
        .limit(100)
        .returns<RawMessage[]>()

      if (data) {
        setMessages(
          data.map(m => ({
            id: m.id,
            community_id: m.community_id,
            user_id: m.user_id,
            content: m.content,
            title: m.title ?? null,
            attachment_url: m.attachment_url,
            attachment_type: m.attachment_type,
            created_at: m.created_at,
            username: pickUsername(m.users, m.user_id),
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
          const row = payload.new as { id: string; community_id: string; user_id: string; content: string; title?: string | null; attachment_url: string | null; attachment_type: 'pdf' | 'audio' | null; created_at: string }

          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', row.user_id)
            .single()

          const incoming: Message = {
            ...row,
            title: row.title ?? null,
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

  // ── Keep messagesRef in sync ─────────────────────────────────────────────────

  useEffect(() => { messagesRef.current = messages }, [messages])

  // ── Load comments for active community + real-time ───────────────────────────

  useEffect(() => {
    if (!activeCommunity) {
      setComments({})
      setExpandedComments(new Set())
      return
    }

    type RawComment = {
      id: string
      message_id: string
      user_id: string
      content: string
      created_at: string
      users: UserRelation
    }

    async function fetchComments() {
      const { data: msgs } = await supabase
        .from('messages')
        .select('id')
        .eq('community_id', activeCommunity!.id)

      if (!msgs || msgs.length === 0) { setComments({}); return }
      const messageIds = msgs.map(m => m.id)

      const { data } = await supabase
        .from('comments')
        .select('id, message_id, user_id, content, created_at, users(username)')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true })
        .returns<RawComment[]>()

      if (data) {
        const grouped: Record<string, Comment[]> = {}
        data.forEach(c => {
          const comment: Comment = {
            id: c.id,
            message_id: c.message_id,
            user_id: c.user_id,
            content: c.content,
            created_at: c.created_at,
            username: pickUsername(c.users, c.user_id),
          }
          if (!grouped[c.message_id]) grouped[c.message_id] = []
          grouped[c.message_id].push(comment)
        })
        setComments(grouped)
      }
    }

    fetchComments()

    const channel = supabase
      .channel(`comments-${activeCommunity.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
      }, async payload => {
        const row = payload.new as { id: string; message_id: string; user_id: string; content: string; created_at: string }
        if (!messagesRef.current.some(m => m.id === row.message_id)) return
        const { data: ud } = await supabase.from('users').select('username').eq('id', row.user_id).single()
        setComments(prev => {
          const existing = prev[row.message_id] ?? []
          if (existing.some(c => c.id === row.id)) return prev
          return { ...prev, [row.message_id]: [...existing, { ...row, username: ud?.username ?? row.user_id }] }
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeCommunity, supabase])

  // ── Load community memberships (+ real-time) ────────────────────────────────

  useEffect(() => {
    async function fetchMemberships() {
      const { data } = await supabase.from('community_members').select('community_id, user_id')
      if (data) {
        setAllCommunityMembers(data)
        setJoinedCommunityIds(new Set(
          data.filter(m => m.user_id === session.user.id).map(m => m.community_id)
        ))
      }
    }
    fetchMemberships()
    const channel = supabase
      .channel('community-members-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members' }, fetchMemberships)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, session.user.id])

  // ── Load saved post IDs ──────────────────────────────────────────────────────

  useEffect(() => {
    supabase
      .from('saved_posts')
      .select('message_id')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        if (data) setSavedPostIds(new Set(data.map(s => s.message_id)))
      })
  }, [supabase, session.user.id])

  // ── Search effect (debounced) ────────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      const q = `%${searchQuery}%`
      type PostWithUser = {
        id: string
        community_id: string
        user_id: string
        content: string
        title: string | null
        attachment_url: string | null
        attachment_type: 'pdf' | 'audio' | null
        created_at: string
        users: UserRelation
      }
      const [{ data: posts }, { data: comms }] = await Promise.all([
        supabase
          .from('messages')
          .select('id, community_id, user_id, content, title, attachment_url, attachment_type, created_at, users(username)')
          .or(`content.ilike.${q},title.ilike.${q}`)
          .limit(15)
          .returns<PostWithUser[]>(),
        supabase
          .from('communities')
          .select('id, name, description, created_by')
          .or(`name.ilike.${q},description.ilike.${q}`)
          .limit(10),
      ])
      setSearchResults({
        posts: (posts ?? []).map(m => ({
          id: m.id,
          community_id: m.community_id,
          user_id: m.user_id,
          content: m.content,
          title: m.title ?? null,
          attachment_url: m.attachment_url ?? null,
          attachment_type: m.attachment_type ?? null,
          created_at: m.created_at,
          username: pickUsername(m.users, m.user_id),
        })),
        communities: (comms ?? []) as Community[],
      })
      if ((posts?.length ?? 0) > 0 || (comms?.length ?? 0) > 0) {
        setActiveSection('explore')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, supabase])

  // ── Load friendships (+ real-time) ──────────────────────────────────────────

  useEffect(() => {
    async function fetchFriendships() {
      const { data } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
      if (data) setFriendships(data)
    }
    fetchFriendships()
    const ch = supabase
      .channel('friendships-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, fetchFriendships)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, session.user.id])

  // ── Load notifications (+ real-time) ────────────────────────────────────────

  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setNotifications(data)
    }
    fetchNotifications()
    const ch = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${session.user.id}` }, fetchNotifications)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, session.user.id])

  // ── Load my skills + all users' skills ──────────────────────────────────────

  useEffect(() => {
    async function fetchSkills() {
      const { data } = await supabase.from('user_skills').select('user_id, skill')
      if (data) {
        const map: Record<string, string[]> = {}
        data.forEach(({ user_id, skill }) => {
          if (!map[user_id]) map[user_id] = []
          map[user_id].push(skill)
        })
        setUserSkillsMap(map)
        setMySkills(map[session.user.id] ?? [])
      }
    }
    fetchSkills()
    const ch = supabase
      .channel('skills-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_skills' }, fetchSkills)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, session.user.id])

  // ── Load my links ────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase
      .from('user_links')
      .select('user_id, link_type, url')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        if (data) setMyLinks(data)
      })
  }, [supabase, session.user.id])

  // ── Ctrl+K focuses search bar; Esc closes mobile drawer ─────────────────────

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleGlobalKey)
    return () => document.removeEventListener('keydown', handleGlobalKey)
  }, [])

  // ── Lock body scroll when mobile drawer is open ─────────────────────────────

  useEffect(() => {
    if (mobileMenuOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [mobileMenuOpen])

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

    type RawSessionMsg = { id: string; session_id: string; user_id: string; content: string; created_at: string; users: UserRelation }
    type RawSessionMember = { session_id: string; user_id: string; joined_at: string; users: UserRelation }

    async function fetchSessionMessages() {
      const { data } = await supabase
        .from('session_messages')
        .select('id, session_id, user_id, content, created_at, users(username)')
        .eq('session_id', activeSession!.id)
        .order('created_at', { ascending: true })
        .limit(200)
        .returns<RawSessionMsg[]>()
      if (data) {
        setSessionMessages(data.map(m => ({
          id: m.id,
          session_id: m.session_id,
          user_id: m.user_id,
          content: m.content,
          created_at: m.created_at,
          username: pickUsername(m.users, m.user_id),
        })))
      }
    }

    async function fetchSessionMembers() {
      const { data } = await supabase
        .from('session_members')
        .select('session_id, user_id, joined_at, users(username)')
        .eq('session_id', activeSession!.id)
        .returns<RawSessionMember[]>()
      if (data) {
        setSessionMembers(data.map(m => ({
          session_id: m.session_id,
          user_id: m.user_id,
          joined_at: m.joined_at,
          username: pickUsername(m.users, m.user_id),
        })))
      }
    }

    fetchSessionMessages()
    fetchSessionMembers()
    supabase
      .from('session_members')
      .upsert({ session_id: activeSession.id, user_id: session.user.id })
      .then(({ error }) => {
        if (error) console.error('session_members upsert failed:', error.message)
      })

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
      supabase
        .from('session_members')
        .delete()
        .eq('session_id', activeSession.id)
        .eq('user_id', session.user.id)
        .then(({ error }) => {
          if (error) console.error('session_members delete failed:', error.message)
        })
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
      users: UserRelation
    }

    async function fetchDms() {
      const { data } = await supabase
        .from('private_messages')
        .select('id, sender_id, receiver_id, content, created_at, users!private_messages_sender_id_fkey(username)')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${activeDm!.id}),and(sender_id.eq.${activeDm!.id},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true })
        .limit(100)
        .returns<RawDm[]>()
      if (data) {
        setDmMessages(data.map(m => ({
          id: m.id,
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          content: m.content,
          created_at: m.created_at,
          username: pickUsername(m.users, m.sender_id),
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
    setRecordError('')
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setRecordError('Tu navegador no soporta grabación de audio.')
      return
    }
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
      setRecordError('No se pudo acceder al micrófono. Revisa los permisos del navegador.')
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
    const title = messageTitle.trim() || null
    if (!content && !attachedFile && !title) return
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
        title,
        attachment_url,
        attachment_type,
        created_at: new Date().toISOString(),
        username: currentUser?.username ?? session.user.email ?? session.user.id,
        optimistic: true,
      },
    ])
    setNewMessage('')
    setMessageTitle('')
    setAttachedFile(null)
    setAttachmentType(null)

    const { data: inserted } = await supabase
      .from('messages')
      .insert({
        community_id: activeCommunity.id,
        user_id: session.user.id,
        content: content || '',
        title,
        attachment_url,
        attachment_type,
      })
      .select('id')
      .single()

    // Fire mention notifications
    if (inserted?.id) {
      const mentionMatches = (content || '').match(MENTION_REGEX) ?? []
      const mentionedUsernames = new Set(mentionMatches.map(m => m.slice(1).toLowerCase()))
      for (const uname of mentionedUsernames) {
        const target = users.find(u => u.username.toLowerCase() === uname && u.id !== session.user.id)
        if (target) {
          await supabase.from('notifications').insert({
            user_id: target.id,
            type: 'mention',
            from_user_id: session.user.id,
            entity_id: inserted.id,
            content: (content || '').slice(0, 100),
          })
        }
      }
    }
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  function toggleComments(messageId: string) {
    setExpandedComments(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) next.delete(messageId)
      else next.add(messageId)
      return next
    })
  }

  function setCommentInput(messageId: string, value: string) {
    setCommentInputs(prev => ({ ...prev, [messageId]: value }))
  }

  async function sendComment(messageId: string, e: FormEvent) {
    e.preventDefault()
    const content = commentInputs[messageId]?.trim()
    if (!content) return
    setCommentInputs(prev => ({ ...prev, [messageId]: '' }))
    const { data: inserted } = await supabase
      .from('comments')
      .insert({
        message_id: messageId,
        user_id: session.user.id,
        content,
      })
      .select('id')
      .single()

    // Fire mention notifications from comments
    if (inserted?.id) {
      const mentionMatches = content.match(MENTION_REGEX) ?? []
      const mentionedUsernames = new Set(mentionMatches.map(m => m.slice(1).toLowerCase()))
      for (const uname of mentionedUsernames) {
        const target = users.find(u => u.username.toLowerCase() === uname && u.id !== session.user.id)
        if (target) {
          await supabase.from('notifications').insert({
            user_id: target.id,
            type: 'mention',
            from_user_id: session.user.id,
            entity_id: messageId,
            content: content.slice(0, 100),
          })
        }
      }
    }
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

  // ── Reddit-style handlers ───────────────────────────────────────────────────

  async function joinCommunity(communityId: string) {
    const { error } = await supabase
      .from('community_members')
      .insert({ community_id: communityId, user_id: session.user.id })
    if (!error) {
      setJoinedCommunityIds(prev => new Set([...prev, communityId]))
      setAllCommunityMembers(prev => [...prev, { community_id: communityId, user_id: session.user.id }])
    }
  }

  async function leaveCommunity(communityId: string) {
    await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', session.user.id)
    setJoinedCommunityIds(prev => { const next = new Set(prev); next.delete(communityId); return next })
    setAllCommunityMembers(prev => prev.filter(m => !(m.community_id === communityId && m.user_id === session.user.id)))
  }

  async function savePost(messageId: string) {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ user_id: session.user.id, message_id: messageId })
    if (!error) setSavedPostIds(prev => new Set([...prev, messageId]))
  }

  async function unsavePost(messageId: string) {
    await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', session.user.id)
      .eq('message_id', messageId)
    setSavedPostIds(prev => { const next = new Set(prev); next.delete(messageId); return next })
    setSavedMessages(prev => prev.filter(m => m.id !== messageId))
  }

  async function createCommunity(e: FormEvent) {
    e.preventDefault()
    const name = newCommunityName.trim()
    if (!name) return
    setCommunityError('')
    const { error } = await supabase.from('communities').insert({
      name,
      description: newCommunityDesc.trim(),
      created_by: session.user.id,
    })
    if (error) { setCommunityError(error.message); return }
    setNewCommunityName('')
    setNewCommunityDesc('')
    setShowCreateCommunity(false)
  }

  async function loadSavedMessages() {
    type SavedMessageRow = {
      message_id: string
      messages: {
        id: string
        community_id: string
        user_id: string
        content: string
        title: string | null
        attachment_url: string | null
        attachment_type: 'pdf' | 'audio' | null
        created_at: string
        users: UserRelation
      } | null
    }
    const { data } = await supabase
      .from('saved_posts')
      .select('message_id, messages(id, community_id, user_id, content, title, attachment_url, attachment_type, created_at, users(username))')
      .eq('user_id', session.user.id)
      .order('saved_at', { ascending: false })
      .returns<SavedMessageRow[]>()

    if (data) {
      setSavedMessages(
        data
          .map(s => s.messages)
          .filter((m): m is NonNullable<SavedMessageRow['messages']> => m !== null)
          .map(m => ({
            id: m.id,
            community_id: m.community_id,
            user_id: m.user_id,
            content: m.content,
            title: m.title ?? null,
            attachment_url: m.attachment_url ?? null,
            attachment_type: m.attachment_type ?? null,
            created_at: m.created_at,
            username: pickUsername(m.users, m.user_id),
          }))
      )
    }
  }

  function navigateToCommunity(c: Community) {
    setShowAllCommunities(true)
    setActiveCommunity(c)
    setActiveSection('communities')
  }

  // ── Friend request handlers ──────────────────────────────────────────────────

  async function sendFriendRequest(addresseeId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .insert({ requester_id: session.user.id, addressee_id: addresseeId })
      .select()
      .single()
    if (!error && data) {
      setFriendships(prev => [data, ...prev])
      await supabase.from('notifications').insert({
        user_id: addresseeId,
        type: 'friend_request',
        from_user_id: session.user.id,
        entity_id: data.id,
        content: '',
      })
    }
  }

  async function acceptFriendRequest(friendshipId: string) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    if (!error) {
      const fs = friendships.find(f => f.id === friendshipId)
      setFriendships(prev => prev.map(f => f.id === friendshipId ? { ...f, status: 'accepted' } : f))
      if (fs) {
        await supabase.from('notifications').insert({
          user_id: fs.requester_id,
          type: 'friend_accepted',
          from_user_id: session.user.id,
          entity_id: friendshipId,
          content: '',
        })
      }
    }
  }

  async function rejectOrCancelFriendship(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriendships(prev => prev.filter(f => f.id !== friendshipId))
  }

  // ── Skills handlers ──────────────────────────────────────────────────────────

  async function addSkill(skill: string) {
    const { error } = await supabase
      .from('user_skills')
      .insert({ user_id: session.user.id, skill })
    if (!error) {
      setMySkills(prev => [...prev, skill])
      setUserSkillsMap(prev => ({
        ...prev,
        [session.user.id]: [...(prev[session.user.id] ?? []), skill],
      }))
    }
  }

  async function removeSkill(skill: string) {
    await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', session.user.id)
      .eq('skill', skill)
    setMySkills(prev => prev.filter(s => s !== skill))
    setUserSkillsMap(prev => ({
      ...prev,
      [session.user.id]: (prev[session.user.id] ?? []).filter(s => s !== skill),
    }))
  }

  // ── Links handlers ───────────────────────────────────────────────────────────

  async function upsertLink(link_type: UserLink['link_type'], url: string) {
    const { error } = await supabase
      .from('user_links')
      .upsert({ user_id: session.user.id, link_type, url })
    if (!error) {
      setMyLinks(prev => {
        const filtered = prev.filter(l => l.link_type !== link_type)
        return [...filtered, { user_id: session.user.id, link_type, url }]
      })
    }
  }

  async function removeLink(link_type: UserLink['link_type']) {
    await supabase
      .from('user_links')
      .delete()
      .eq('user_id', session.user.id)
      .eq('link_type', link_type)
    setMyLinks(prev => prev.filter(l => l.link_type !== link_type))
  }

  // ── Notification handlers ────────────────────────────────────────────────────

  async function markNotificationRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllNotificationsRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function handleNotificationNavigate(n: Notification) {
    if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      setActiveSection('friends')
    } else if (n.type === 'mention' && n.entity_id) {
      setActiveSection('communities')
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

  async function deleteSession(s: LiveSession) {
    if (activeSession?.id === s.id) setActiveSession(null)
    await supabase.from('live_sessions').delete().eq('id', s.id)
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

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-to-content">Saltar al contenido</a>

      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchRef={searchRef}
        onMenuToggle={() => setMobileMenuOpen(v => !v)}
        onLogout={handleLogout}
        onNotificationsClick={() => handleSectionChange('notifications')}
        unreadCount={unreadCount}
        username={currentUser?.username ?? session.user.email ?? '?'}
      />

      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        username={currentUser?.username ?? session.user.email ?? ''}
        unreadCount={unreadCount}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main id="main-content" className="content-area" role="main">
        <div className="content-inner">
          {activeSection === 'communities' && (
            <CommunitiesSection
              communities={communities}
              activeCommunity={activeCommunity}
              setActiveCommunity={setActiveCommunity}
              messages={messages}
              allUsers={users}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              messageTitle={messageTitle}
              setMessageTitle={setMessageTitle}
              sendMessage={sendMessage}
              messagesEndRef={messagesEndRef}
              attachedFile={attachedFile}
              attachmentType={attachmentType}
              isRecording={isRecording}
              isUploading={isUploading}
              recordError={recordError}
              onPdfSelect={handlePdfSelect}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              onClearAttach={clearAttachment}
              comments={comments}
              expandedComments={expandedComments}
              commentInputs={commentInputs}
              toggleComments={toggleComments}
              setCommentInput={setCommentInput}
              sendComment={sendComment}
              currentUser={currentUser}
              joinedCommunityIds={joinedCommunityIds}
              allCommunityMembers={allCommunityMembers}
              onJoinCommunity={joinCommunity}
              onLeaveCommunity={leaveCommunity}
              savedPostIds={savedPostIds}
              onSavePost={savePost}
              onUnsavePost={unsavePost}
              showCreateCommunity={showCreateCommunity}
              setShowCreateCommunity={setShowCreateCommunity}
              newCommunityName={newCommunityName}
              setNewCommunityName={setNewCommunityName}
              newCommunityDesc={newCommunityDesc}
              setNewCommunityDesc={setNewCommunityDesc}
              createCommunity={createCommunity}
              communityError={communityError}
              showAllCommunities={showAllCommunities}
              setShowAllCommunities={setShowAllCommunities}
            />
          )}
          {activeSection === 'friends' && (
            <FriendsSection
              users={users}
              currentUserId={session.user.id}
              friendships={friendships}
              onSendRequest={sendFriendRequest}
              onAccept={acceptFriendRequest}
              onReject={rejectOrCancelFriendship}
              onRemove={rejectOrCancelFriendship}
              userSkillsMap={userSkillsMap}
            />
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
              mySkills={mySkills}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
              myLinks={myLinks}
              onUpsertLink={upsertLink}
              onRemoveLink={removeLink}
            />
          )}
          {activeSection === 'explore' && (
            <ExploreSection
              communities={communities}
              joinedCommunityIds={joinedCommunityIds}
              allCommunityMembers={allCommunityMembers}
              onJoinCommunity={joinCommunity}
              onLeaveCommunity={leaveCommunity}
              currentUser={currentUser}
              savedMessages={savedMessages}
              onLoadSavedMessages={loadSavedMessages}
              searchQuery={searchQuery}
              searchResults={searchResults}
              onNavigateToCommunity={navigateToCommunity}
              exploreTab={exploreTab}
              setExploreTab={setExploreTab}
              users={users}
              userSkillsMap={userSkillsMap}
            />
          )}
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
              onDeleteSession={deleteSession}
              sessionEndRef={sessionEndRef}
            />
          )}
          {activeSection === 'notifications' && (
            <NotificationsSection
              notifications={notifications}
              users={users}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
              onNavigate={handleNotificationNavigate}
            />
          )}
          {activeSection === 'settings' && (
            <SettingsSection session={session} onLogout={handleLogout} />
          )}
        </div>
      </main>

      <BottomNav
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        unreadCount={unreadCount}
      />
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
            <div className="auth-logo"><h1>Contenline.</h1></div>
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
