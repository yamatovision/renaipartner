import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

// JWT ペイロードの型定義
interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
  exp: number
  iat: number
  hasCompletedOnboarding?: boolean
}

// 公開ルート（認証不要）
const publicRoutes = ['/login', '/register']

// 管理者専用ルート
const adminRoutes = ['/admin']

// オンボーディングルート
const onboardingRoute = '/onboarding'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 認証状態のチェック
  const authToken = request.cookies.get('auth-token')?.value
  const isAuthenticated = !!authToken
  
  // 管理者チェック
  let isAdmin = false
  let hasCompletedOnboarding = true
  
  if (authToken) {
    try {
      const decoded = jwtDecode<JWTPayload>(authToken)
      
      // トークンの有効期限チェック
      const isExpired = decoded.exp * 1000 < Date.now()
      if (isExpired) {
        // トークンが期限切れの場合はログインページへリダイレクト
        const url = new URL('/login', request.url)
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      }
      
      isAdmin = decoded.role === 'admin'
      hasCompletedOnboarding = decoded.hasCompletedOnboarding !== false
    } catch (error) {
      // 無効なトークンの場合はログインページへリダイレクト
      console.error('Invalid JWT token:', error)
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // ルートパスへのアクセス
  if (pathname === '/') {
    if (isAuthenticated) {
      // 認証済みユーザーはロールに応じてリダイレクト
      const redirectUrl = isAdmin ? '/admin/users' : '/home'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    } else {
      // 未認証ユーザーはログインページへ
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 公開ルートへのアクセス
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // 認証済みユーザーがログイン/登録ページにアクセスした場合
    if (isAuthenticated) {
      const redirectUrl = isAdmin ? '/admin/users' : '/home'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.next()
  }

  // 認証が必要なルートへのアクセス
  if (!isAuthenticated) {
    // リダイレクト時に元のURLを保存（ログイン後に戻るため）
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 管理者ルートへのアクセス
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // オンボーディング未完了のユーザー
  if (!hasCompletedOnboarding && pathname !== onboardingRoute) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // オンボーディング完了済みのユーザーがオンボーディングページにアクセス
  if (hasCompletedOnboarding && pathname === onboardingRoute) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}