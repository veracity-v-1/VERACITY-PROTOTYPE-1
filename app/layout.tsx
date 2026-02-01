import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import ErrorOverlaySuppressor from '@/components/ErrorOverlaySuppressor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Project Veracity - Software Defect Prediction',
  description: 'Comprehensive decision-support system for predicting software defects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ErrorOverlaySuppressor />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
