'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { partnersApiService } from '@/services/api/partners.api'

interface PartnerGuardProps {
  children: React.ReactNode
}

export const PartnerGuard: React.FC<PartnerGuardProps> = ({ children }) => {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [checkingPartner, setCheckingPartner] = useState(true)
  const [hasPartner, setHasPartner] = useState<boolean | null>(null)

  useEffect(() => {
    const checkPartner = async () => {
      console.log('[PartnerGuard] Checking partner status...')
      
      // 認証チェック中は待機
      if (authLoading) {
        console.log('[PartnerGuard] Auth is still loading, waiting...')
        return
      }

      // 未認証の場合はログインへ
      if (!isAuthenticated || !user) {
        console.log('[PartnerGuard] Not authenticated, redirecting to login')
        router.push('/login')
        return
      }

      try {
        // パートナー存在チェック
        const response = await partnersApiService.getPartner()
        console.log('[PartnerGuard] Partner check response:', response)
        
        if (response.success && response.data) {
          console.log('[PartnerGuard] Partner found:', response.data.name)
          setHasPartner(true)
        } else {
          console.log('[PartnerGuard] No partner found, redirecting to onboarding')
          setHasPartner(false)
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('[PartnerGuard] Error checking partner:', error)
        // エラーの場合もオンボーディングへ
        setHasPartner(false)
        router.push('/onboarding')
      } finally {
        setCheckingPartner(false)
      }
    }

    checkPartner()
  }, [user, isAuthenticated, authLoading, router])

  // 認証チェック中
  if (authLoading || checkingPartner) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">確認中...</p>
        </div>
      </div>
    )
  }

  // パートナーが存在しない場合（リダイレクト処理中）
  if (hasPartner === false) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <p className="text-gray-600">オンボーディングへ移動中...</p>
        </div>
      </div>
    )
  }

  // パートナーが存在する場合は子コンポーネントを表示
  return <>{children}</>
}