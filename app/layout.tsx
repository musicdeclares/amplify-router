import type { Metadata } from 'next'
import { Karla } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const karla = Karla({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-karla',
})

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
    <html lang="en" className={karla.variable}>
      <body className={karla.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
