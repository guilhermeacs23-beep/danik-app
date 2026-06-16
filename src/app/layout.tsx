import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DANIK — Gestão de Moda',
  description: 'Plataforma de gestão para lojas de roupas femininas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('danik-theme')||'light';document.documentElement.classList.toggle('dark',t==='dark')}catch{}`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
