'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 仮の認証チェック（後でモック/実APIに差し替え）
    const isAuthenticated = false // TODO: 実際の認証状態をチェック
    
    if (isAuthenticated) {
      router.push('/home')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">恋AIパートナー</h1>
        <p>リダイレクト中...</p>
      </div>
    </div>
  )
}