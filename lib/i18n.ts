// ─── i18n: Spanish (default) and English translations ──────────────────────────

export type Language = 'es' | 'en'

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
]

type Dict = Record<string, string>

const es: Dict = {
  // Navigation
  'nav.communities': 'Comunidades',
  'nav.friends': 'Amigos',
  'nav.messages': 'Mensajes',
  'nav.explore': 'Explorar',
  'nav.presence': 'Salas',
  'nav.notifications': 'Notificaciones',
  'nav.profile': 'Perfil',
  'nav.settings': 'Ajustes',
  'nav.home': 'Inicio',
  'nav.rooms': 'Salas',
  'nav.alerts': 'Avisos',

  // TopBar
  'topbar.search': 'Buscar',
  'topbar.searchAria': 'Buscar comunidades, publicaciones y personas',
  'topbar.notifications': 'Notificaciones',
  'topbar.logout': 'Salir',
  'topbar.menuOpen': 'Abrir menú de navegación',

  // Common
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.add': 'Añadir',
  'common.remove': 'Quitar',
  'common.edit': 'Editar',
  'common.delete': 'Eliminar',
  'common.close': 'Cerrar',
  'common.back': 'Volver',
  'common.send': 'Enviar',
  'common.loading': 'Cargando…',
  'common.publish': 'Publicar',
  'common.uploading': 'Subiendo…',
  'common.update': 'Actualizar',
  'common.private': 'Privado',
  'common.skipToContent': 'Saltar al contenido',

  // Messages section
  'messages.title': 'Mensajes.',
  'messages.eyebrow': 'DIRECTOS',
  'messages.sub': 'Conversaciones privadas, uno a uno.',
  'messages.directHeading': 'DIRECTO',
  'messages.empty': 'Aún no tienes chats activos.',
  'messages.emptyHint': 'Empieza una conversación con un amigo.',
  'messages.startNewChat': 'Iniciar nuevo chat',
  'messages.pickPerson': 'Elige a quién escribir',
  'messages.noFriends': 'Aún no tienes amigos a quien escribir. Ve a Amigos → Descubrir.',
  'messages.placeholder': 'Escribe un mensaje privado…',
  'messages.firstMessage': 'Escribe el primer mensaje…',
  'messages.backToList': '← Volver a mensajes',
  'messages.message': 'Mensaje →',
  'messages.activeCount': '{count} chats activos',
  'messages.activeCountOne': '1 chat activo',
  'messages.cannotMessage': 'Este usuario no acepta mensajes ahora mismo.',
  'messages.onlyFriends': 'Este usuario solo recibe mensajes de amigos.',

  // Settings section
  'settings.title': 'Ajustes.',
  'settings.eyebrow': 'CUENTA',
  'settings.sub': 'Personaliza tu cuenta, privacidad y experiencia.',
  'settings.profileGroup': 'Perfil',
  'settings.usernameLabel': 'Nombre de usuario',
  'settings.usernameHelp': 'Identificador único, sin espacios.',
  'settings.displayNameLabel': 'Nombre para mostrar',
  'settings.displayNameHelp': 'Se muestra junto a tu @usuario (opcional).',
  'settings.privacyGroup': 'Privacidad',
  'settings.dmPolicy': '¿Quién puede escribirte?',
  'settings.dmAnyone': 'Cualquiera',
  'settings.dmFriends': 'Solo amigos',
  'settings.dmNobody': 'Nadie',
  'settings.profileVisibility': '¿Quién ve tu perfil?',
  'settings.profileVisPublic': 'Todos',
  'settings.profileVisFriends': 'Solo amigos',
  'settings.linksVisibility': '¿Quién ve tus enlaces?',
  'settings.linksVisPublic': 'Todos',
  'settings.linksVisFriends': 'Solo amigos',
  'settings.linksVisNobody': 'Nadie',
  'settings.showOnline': 'Mostrar mi estado en línea',
  'settings.allowMentions': 'Permitir que me mencionen con @',
  'settings.notificationsGroup': 'Notificaciones',
  'settings.notifyFriends': 'Solicitudes de amistad',
  'settings.notifyMentions': 'Menciones',
  'settings.notifyMessages': 'Mensajes nuevos',
  'settings.languageGroup': 'Idioma',
  'settings.languageLabel': 'Idioma de la interfaz',
  'settings.languageHelp': 'Elige el idioma con el que se muestra Contenline.',
  'settings.accountGroup': 'Cuenta',
  'settings.email': 'Email',
  'settings.userId': 'ID de usuario',
  'settings.lastSignIn': 'Sesión iniciada',
  'settings.sessionGroup': 'Sesión',
  'settings.logout': 'Cerrar sesión',
  'settings.saved': 'Cambios guardados.',
  'settings.usernameTaken': 'Ese nombre de usuario ya está en uso.',
  'settings.usernameInvalid': 'Solo letras, números, guion bajo y guion (3–32).',
  'settings.unsavedChanges': 'Cambios sin guardar',

  // Profile modal
  'profile.viewProfile': 'Ver perfil',
  'profile.sendMessage': 'Enviar mensaje',
  'profile.addFriend': 'Agregar',
  'profile.requestSent': 'Solicitud enviada',
  'profile.alreadyFriends': 'Ya son amigos',
  'profile.acceptRequest': 'Aceptar solicitud',
  'profile.noStatus': 'Sin estado',
  'profile.skillsHeading': 'Especialidades',
  'profile.linksHeading': 'Enlaces',
  'profile.noLinks': 'Sin enlaces públicos.',
  'profile.linksPrivate': 'Enlaces ocultos por privacidad.',
  'profile.profilePrivate': 'Este perfil es solo para amigos.',
  'profile.memberSince': 'Miembro desde',
  'profile.closeAria': 'Cerrar perfil',
  'profile.title': 'Perfil de usuario',

  // Friends section
  'friends.eyebrow': 'PERSONAS',
  'friends.title': 'Amigos.',
  'friends.sub': 'Tu red cercana. Solicitudes, conexiones y descubrimientos.',
  'friends.tabFriends': 'Amigos',
  'friends.tabPending': 'Solicitudes',
  'friends.tabDiscover': 'Descubrir',
  'friends.empty': 'Aún no tienes amigos. Ve a "Descubrir" para enviar solicitudes.',
  'friends.noPending': 'No hay solicitudes pendientes.',
  'friends.received': 'Recibidas',
  'friends.sent': 'Enviadas',
  'friends.accept': 'Aceptar',
  'friends.reject': 'Rechazar',
  'friends.cancel': 'Cancelar',
  'friends.removeTitle': 'Eliminar amistad',
  'friends.pendingNote': 'Solicitud pendiente…',

  // Errors
  'error.appError': 'Error al iniciar la aplicación',
  'error.notConfigured': 'La aplicación no está configurada.',
}

const en: Dict = {
  // Navigation
  'nav.communities': 'Communities',
  'nav.friends': 'Friends',
  'nav.messages': 'Messages',
  'nav.explore': 'Explore',
  'nav.presence': 'Rooms',
  'nav.notifications': 'Notifications',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  'nav.home': 'Home',
  'nav.rooms': 'Rooms',
  'nav.alerts': 'Alerts',

  // TopBar
  'topbar.search': 'Search',
  'topbar.searchAria': 'Search communities, posts, and people',
  'topbar.notifications': 'Notifications',
  'topbar.logout': 'Sign out',
  'topbar.menuOpen': 'Open navigation menu',

  // Common
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.add': 'Add',
  'common.remove': 'Remove',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.send': 'Send',
  'common.loading': 'Loading…',
  'common.publish': 'Publish',
  'common.uploading': 'Uploading…',
  'common.update': 'Update',
  'common.private': 'Private',
  'common.skipToContent': 'Skip to content',

  // Messages section
  'messages.title': 'Messages.',
  'messages.eyebrow': 'DIRECT',
  'messages.sub': 'Private one-to-one conversations.',
  'messages.directHeading': 'DIRECT',
  'messages.empty': 'You have no active chats yet.',
  'messages.emptyHint': 'Start a conversation with a friend.',
  'messages.startNewChat': 'Start a new chat',
  'messages.pickPerson': 'Pick someone to message',
  'messages.noFriends': "You don't have any friends to message yet. Visit Friends → Discover.",
  'messages.placeholder': 'Write a private message…',
  'messages.firstMessage': 'Write the first message…',
  'messages.backToList': '← Back to messages',
  'messages.message': 'Message →',
  'messages.activeCount': '{count} active chats',
  'messages.activeCountOne': '1 active chat',
  'messages.cannotMessage': "This user isn't accepting messages right now.",
  'messages.onlyFriends': 'This user only accepts messages from friends.',

  // Settings section
  'settings.title': 'Settings.',
  'settings.eyebrow': 'ACCOUNT',
  'settings.sub': 'Customize your account, privacy and experience.',
  'settings.profileGroup': 'Profile',
  'settings.usernameLabel': 'Username',
  'settings.usernameHelp': 'Unique handle, no spaces.',
  'settings.displayNameLabel': 'Display name',
  'settings.displayNameHelp': 'Shown next to your @handle (optional).',
  'settings.privacyGroup': 'Privacy',
  'settings.dmPolicy': 'Who can message you?',
  'settings.dmAnyone': 'Anyone',
  'settings.dmFriends': 'Friends only',
  'settings.dmNobody': 'No one',
  'settings.profileVisibility': 'Who can see your profile?',
  'settings.profileVisPublic': 'Everyone',
  'settings.profileVisFriends': 'Friends only',
  'settings.linksVisibility': 'Who can see your links?',
  'settings.linksVisPublic': 'Everyone',
  'settings.linksVisFriends': 'Friends only',
  'settings.linksVisNobody': 'No one',
  'settings.showOnline': 'Show my online status',
  'settings.allowMentions': 'Allow others to @mention me',
  'settings.notificationsGroup': 'Notifications',
  'settings.notifyFriends': 'Friend requests',
  'settings.notifyMentions': 'Mentions',
  'settings.notifyMessages': 'New messages',
  'settings.languageGroup': 'Language',
  'settings.languageLabel': 'Interface language',
  'settings.languageHelp': 'Choose the language Contenline is shown in.',
  'settings.accountGroup': 'Account',
  'settings.email': 'Email',
  'settings.userId': 'User ID',
  'settings.lastSignIn': 'Last sign-in',
  'settings.sessionGroup': 'Session',
  'settings.logout': 'Sign out',
  'settings.saved': 'Changes saved.',
  'settings.usernameTaken': 'That username is already taken.',
  'settings.usernameInvalid': 'Letters, numbers, underscore, dash only (3–32).',
  'settings.unsavedChanges': 'Unsaved changes',

  // Profile modal
  'profile.viewProfile': 'View profile',
  'profile.sendMessage': 'Send message',
  'profile.addFriend': 'Add',
  'profile.requestSent': 'Request sent',
  'profile.alreadyFriends': 'Already friends',
  'profile.acceptRequest': 'Accept request',
  'profile.noStatus': 'No status',
  'profile.skillsHeading': 'Skills',
  'profile.linksHeading': 'Links',
  'profile.noLinks': 'No public links.',
  'profile.linksPrivate': 'Links hidden by privacy settings.',
  'profile.profilePrivate': 'This profile is friends-only.',
  'profile.memberSince': 'Member since',
  'profile.closeAria': 'Close profile',
  'profile.title': 'User profile',

  // Friends section
  'friends.eyebrow': 'PEOPLE',
  'friends.title': 'Friends.',
  'friends.sub': 'Your inner circle. Requests, connections and discovery.',
  'friends.tabFriends': 'Friends',
  'friends.tabPending': 'Requests',
  'friends.tabDiscover': 'Discover',
  'friends.empty': 'No friends yet. Go to "Discover" to send requests.',
  'friends.noPending': 'No pending requests.',
  'friends.received': 'Received',
  'friends.sent': 'Sent',
  'friends.accept': 'Accept',
  'friends.reject': 'Reject',
  'friends.cancel': 'Cancel',
  'friends.removeTitle': 'Remove friend',
  'friends.pendingNote': 'Pending request…',

  // Errors
  'error.appError': 'Failed to start the application',
  'error.notConfigured': 'The application is not configured.',
}

const DICTIONARIES: Record<Language, Dict> = { es, en }

export function translate(lang: Language, key: string, vars?: Record<string, string | number>): string {
  const dict = DICTIONARIES[lang] ?? es
  let str = dict[key] ?? es[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return str
}

const STORAGE_KEY = 'contenline.lang'

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'es'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return 'es'
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, lang)
  document.documentElement.lang = lang
}
