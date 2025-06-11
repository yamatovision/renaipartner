'use client'

// 認証後ページ用レイアウト（ヘッダー + パートナーアバター常時表示）
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface UserLayoutProps {
  children: React.ReactNode
}

export default function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // モックデータ（後で実データに置き換え）
  const mockPartner = {
    name: 'パートナー名',
    avatarUrl: null, // 後で実装
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
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-pink-700">
                    {mockPartner.name?.[0] || 'P'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {mockPartner.name}
                </span>
              </div>
            </div>

            {/* 右側のアイコン群 */}
            <div className="flex items-center space-x-2">
              {/* 設定アイコン */}
              <Link 
                href="/settings"
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
                title="設定"
              >
                <span className="text-xl">⚙️</span>
              </Link>

              {/* カメラ（画像生成）アイコン */}
              <button 
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
                title="画像生成"
                onClick={() => {
                  // TODO: 画像生成機能
                  console.log('画像生成')
                }}
              >
                <span className="text-xl">📷</span>
              </button>

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
                        <Link
                          href="/create-partner"
                          className={`block px-4 py-2 text-sm ${
                            isActive('/create-partner') ? 'bg-pink-100 text-pink-700' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          ➕ パートナー作成
                        </Link>
                        <Link
                          href="/edit-partner"
                          className={`block px-4 py-2 text-sm ${
                            isActive('/edit-partner') ? 'bg-pink-100 text-pink-700' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          ✏️ パートナー編集
                        </Link>
                        <Link
                          href="/settings"
                          className={`block px-4 py-2 text-sm ${
                            isActive('/settings') ? 'bg-pink-100 text-pink-700' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          ⚙️ 設定
                        </Link>
                        <hr className="my-1" />
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setIsMenuOpen(false)
                            // TODO: ログアウト処理
                            console.log('ログアウト')
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