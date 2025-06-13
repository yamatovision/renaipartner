'use client'

// 認証後ページ用レイアウト（ヘッダー + パートナーアバター常時表示）
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { partnersService } from '@/services'
import { Partner } from '@/types'

interface UserLayoutProps {
  children: React.ReactNode
}

export default function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loadingPartner, setLoadingPartner] = useState(true)
  const { logout } = useAuth()

  useEffect(() => {
    loadPartner()
  }, [])

  const loadPartner = async () => {
    try {
      const response = await partnersService.list()
      console.log('[UserLayout] パートナー一覧取得:', response)
      if (response.success && response.data && response.data.length > 0) {
        // 最初のパートナーを使用（将来的には選択機能を追加）
        setPartner(response.data[0])
        console.log('[UserLayout] パートナー設定:', response.data[0])
      }
    } catch (error) {
      console.error('パートナー情報の取得に失敗しました:', error)
    } finally {
      setLoadingPartner(false)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴとパートナーアバター */}
            <div className="flex items-center space-x-4">
              <Link href="/home" className="flex items-center">
                <h1 className="text-xl font-bold text-pink-600">恋AIパートナー</h1>
              </Link>
              
              {/* パートナーアバター（小） */}
              {!loadingPartner && partner && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-pink-700">
                      {partner.name?.[0] || 'P'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {partner.name}
                  </span>
                </div>
              )}
            </div>

            {/* 右側のアイコン群 */}
            <div className="flex items-center space-x-2">
              {/* メニューボタン（縦3つ点） */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
                  title="メニュー"
                >
                  <span className="text-xl">⋮</span>
                </button>

                {/* ドロップダウンメニュー */}
                {isMenuOpen && (
                  <>
                    {/* オーバーレイ（メニュー外クリックで閉じる） */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="py-1">
                        <Link
                          href="/home"
                          className={`block px-4 py-2 text-sm ${
                            isActive('/home') ? 'bg-pink-100 text-pink-700' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          🏠 ホーム
                        </Link>
                        <hr className="my-1" />
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={async () => {
                            setIsMenuOpen(false)
                            await logout()
                          }}
                        >
                          🚪 ログアウト
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* メインコンテンツ */}
      <main>{children}</main>
    </div>
  )
}