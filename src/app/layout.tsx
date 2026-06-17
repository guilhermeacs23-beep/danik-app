import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DANIK — Gestão de Moda',
  description: 'Plataforma de gestão para lojas de roupas femininas',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'DANIK' },
}

export default function RootLayout({ children }: { childre