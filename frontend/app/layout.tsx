import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { MockIndicator, IS_MOCK_MODE } from '@/services/mock'
import '../src/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '恋AIパートナー',
  description: 'あなたの理想のAIパートナーと出会う',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className} style={IS_MOCK_MODE ? { paddingTop: '40px' } : {}}>
        <MockIndicator />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}