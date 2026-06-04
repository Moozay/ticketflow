import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req

  // Allow public paths
  const isLoginPage = nextUrl.pathname === '/login'
  const isAuthApi = nextUrl.pathname.startsWith('/api/auth')

  if (isLoginPage || isAuthApi) {
    // If already authenticated and trying to visit login, redirect to dashboard
    if (isLoginPage && session) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // All other routes require authentication
  if (!session) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf)).*)',
  ],
}
