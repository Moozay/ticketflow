import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl, auth: session } = req

  const isLoginPage = nextUrl.pathname === '/login'
  const isAuthApi = nextUrl.pathname.startsWith('/api/auth')

  if (isLoginPage || isAuthApi) {
    if (isLoginPage && session) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf)).*)',
  ],
}
