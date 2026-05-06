'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'

function IcoDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IcoArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

// Only allow PDFs hosted on the configured Supabase project. This prevents the
// viewer from being abused as an open redirect / phishing surface.
function isAllowedPdfUrl(raw: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return false

  let supabaseHost: string
  try {
    supabaseHost = new URL(supabaseUrl).host
  } catch {
    return false
  }
  return parsed.host === supabaseHost
}

function goBack(router: ReturnType<typeof useRouter>) {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function PDFViewer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const url = searchParams.get('url')
  const isValid = useMemo(() => (url ? isAllowedPdfUrl(url) : false), [url])

  if (!url || !isValid) {
    return (
      <div className="pdf-error">
        <p>URL de PDF no válida.</p>
        <button onClick={() => goBack(router)} className="pdf-back-btn">
          <IcoArrowLeft /> Volver
        </button>
      </div>
    )
  }

  const rawName = decodeURIComponent(url.split('/').pop() ?? 'documento.pdf')
  const filename = rawName.replace(/^\d+-/, '')

  return (
    <div className="pdf-page">
      <header className="pdf-header">
        <button onClick={() => goBack(router)} className="pdf-back-btn">
          <IcoArrowLeft /> Volver
        </button>
        <span className="pdf-header-filename" title={filename}>{filename}</span>
        <a
          href={url}
          download={filename}
          className="pdf-download-btn"
          rel="noopener noreferrer"
        >
          <IcoDownload /> Descargar PDF
        </a>
      </header>
      <div className="pdf-viewer-wrap">
        <iframe
          src={url}
          className="pdf-iframe"
          title={filename}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  )
}

export default function PDFViewerPage() {
  return (
    <Suspense fallback={<div className="pdf-loading">Cargando visor…</div>}>
      <PDFViewer />
    </Suspense>
  )
}
