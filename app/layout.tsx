import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AMPLIFY Router',
  description: 'Climate action routing for musical artists',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}