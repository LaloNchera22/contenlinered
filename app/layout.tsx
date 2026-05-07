import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CONTENLINE — Intellectual Social Hub',
  description:
    'CONTENLINE es un hub social intelectual para conectar, compartir conocimiento y crear comunidades en torno a las ideas.',
  applicationName: 'CONTENLINE',
  keywords: ['comunidad', 'social', 'conocimiento', 'intelectual', 'colaboración'],
  authors: [{ name: 'CONTENLINE' }],
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: '/logo-metadata.png', type: 'image/png' }],
    shortcut: '/logo-metadata.png',
    apple: '/logo-metadata.png',
  },
  openGraph: {
    title: 'CONTENLINE — Intellectual Social Hub',
    description:
      'CONTENLINE es un hub social intelectual para conectar, compartir conocimiento y crear comunidades en torno a las ideas.',
    siteName: 'CONTENLINE',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/logo-metadata.png',
        width: 2000,
        height: 2000,
        alt: 'CONTENLINE',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'CONTENLINE — Intellectual Social Hub',
    description:
      'CONTENLINE es un hub social intelectual para conectar, compartir conocimiento y crear comunidades en torno a las ideas.',
    images: ['/logo-metadata.png'],
  },
  appleWebApp: {
    title: 'CONTENLINE',
    capable: true,
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
  ],
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
