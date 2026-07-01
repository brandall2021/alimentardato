import type { Metadata } from 'next'
import { Open_Sans, Poppins } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/session-provider'

const openSans = Open_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})

const poppins = Poppins({
  variable: '--font-heading',
  weight: ['400', '600', '700'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Alimentar Dato | Sistema de Alumnos',
  description: 'Sistema de búsqueda y consulta de alumnos — FACET · UNT',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${openSans.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
