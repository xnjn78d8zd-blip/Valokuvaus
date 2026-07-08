import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tuotekorttikone',
  description: 'Ravintolabrändien tuotekortit, misa-ohjeet ja keittiöprintit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
