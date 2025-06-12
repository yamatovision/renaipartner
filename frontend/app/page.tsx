'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    console.log('Root page - auth state:', { isAuthenticated, loading, mounted })
    console.log('Root page - current URL:', window.location.href)
    console.log('Root page - current pathname:', window.location.pathname)
    
    // マウントされていない場合はスキップ
    if (!mounted) return
    
    // もし既に正しいページにいる場合はリダイレクトしない
    if (window.location.pathname === '/home' && isAuthenticated) {
      console.log('Root page - already on /home and authenticated, skipping redirect')
      return
    }
    
    if (window.location.pathname === '/login' && !isAuthenticated) {
      console.log('Root page - already on /login and not authenticated, skipping redirect')
      return
    }
    
    // 認証状態をチェック
    if (!loading) {
      console.log('Root page - checking auth:', { isAuthenticated, loading })
      
      if (isAuthenticated) {
        console.log('Root page - redirecting to /home')
        router.push('/home')
      } else {
        console.log('Root page - redirecting to /login')
        router.push('/login')
      }
    } else {
      // 5秒後に強制的にログインページへ
      const timeout = setTimeout(() => {
        console.log('Root page - timeout reached, forcing redirect to login')
        router.push('/login')
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [router, isAuthenticated, loading, mounted])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">恋AIパートナー</h1>
        <p>リダイレクト中...</p>
      </div>
    </div>
  )
}