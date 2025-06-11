'use client'

// 管理者ページ用レイアウト（ヘッダー + 管理メニュー）
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ */}
            <div className="flex items-center">
              <Link href="/admin/users" className="flex items-center">
                <h1 className="text-xl font-bold">恋AIパートナー 管理画面</h1>
              </Link>
            </div>

            {/* 管理メニュー */}
            <nav className="flex items-center space-x-8">
              <Link
                href="/admin/users"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin/users')
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } transition-colors`}
              >
                ユーザー管理
              </Link>
              <Link
                href="/admin/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin/dashboard')
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } transition-colors`}
              >
                ダッシュボード
              </Link>
            </nav>

            {/* ログアウトボタン */}
            <button
              onClick={() => {
                // TODO: ログアウト処理
                console.log('管理者ログアウト')
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>{children}</main>
    </div>
  )
}