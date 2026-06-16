import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DANIK — Gestão de Moda',
  description: 'Plataforma de gestão para lojas de roupas femininas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
