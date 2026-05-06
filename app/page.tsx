'use client'

import dynamic from 'next/dynamic'

// ClientPage uses browser-only APIs (MediaRecorder, navigator.mediaDevices).
// Loading it dynamically with ssr: false skips SSR for the entire app shell.
const ClientPage = dynamic(() => import('./ClientPage'), {
  ssr: false,
  loading: () => (
    <div className="auth-screen">
      <div className="auth-inner" style={{ textAlign: 'center' }}>
        <p style={{ color: '#bbb', fontSize: '0.88rem' }}>Cargando…</p>
      </div>
    </div>
  ),
})

export default function Page() {
  return <ClientPage />
}
