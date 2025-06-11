// 公開ページ用レイアウト（ミニマルヘッダーのみ）
import Link from 'next/link'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ミニマルヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ */}
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-bold text-pink-600">恋AIパートナー</h1>
            </Link>
            
            {/* ログイン/登録リンク */}
            <nav className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-pink-600 transition-colors"
              >
                ログイン
              </Link>
              <Link 
                href="/register" 
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
              >
                新規登録
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>{children}</main>
    </div>
  )
}