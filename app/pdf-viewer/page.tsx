'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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

function PDFViewer() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')

  if (!url) {
    return (
      <div className="pdf-error">
        <p>URL de PDF no válida.</p>
        <button onClick={() => window.history.back()} className="pdf-back-btn">
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
        <button onClick={() => window.history.back()} className="pdf-back-btn">
          <IcoArrowLeft /> Volver
        </button>
        <span className="pdf-header-filename" title={filename}>{filename}</span>
        <a
          href={url}
          download={filename}
          className="pdf-download-btn"
        >
          <IcoDownload /> Descargar PDF
        </a>
      </header>
      <div className="pdf-viewer-wrap">
        <iframe
          src={url}
          className="pdf-iframe"
          title={filename}
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
