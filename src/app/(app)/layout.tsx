import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ name: session.user?.name, email: session.user?.email, role: (session.user as any)?.role }} />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
        {children}
      </main>
    </div>
  )
}
