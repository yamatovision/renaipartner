import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 公開ルート（認証不要）
const publicRoutes = ['/login', '/register']

// 管理者専用ルート
const adminRoutes = ['/admin']

// オンボーディングルート
const onboardingRoute = '/onboarding'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 認証状態のチェック
  // モック環境ではmock-auth-token、本番環境ではauth-tokenをチェック
  const authToken = request.cookies.get('auth-token')?.value
  const mockAuthToken = request.cookies.get('mock-auth-token')?.value
  const isAuthenticated = authToken || mockAuthToken
  
  // モック環境での管理者チェック（localStorage から取得）
  let isAdmin = false
  let hasCompletedOnboarding = true
  
  if (mockAuthToken) {
    // モック環境の場合は、Cookieのトークンからロール情報を取得
    // トークンの形式: "mock_token_admin" または "mock_token_user"
    if (mockAuthToken.includes('_admin')) {
      isAdmin = true
    }
  } else if (authToken) {
    // TODO: 本番環境でのJWTトークンデコード
    // const decoded = jwt.decode(authToken)
    // isAdmin = decoded.role === 'admin'
    // hasCompletedOnboarding = decoded.hasCompletedOnboarding
  }

  // 公開ルートへのアクセス
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // 認証済みユーザーがログイン/登録ページにアクセスした場合
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', request.url))
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