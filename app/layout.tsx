import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CONTENLINE',
  description: 'Intellectual Social Hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
