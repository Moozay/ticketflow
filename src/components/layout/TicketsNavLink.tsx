'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ticketsLastFilter'

export default function TicketsNavLink({ icon, isExtern }: { icon: React.ReactNode; isExtern?: boolean }) {
  const pathname = usePathname()
  const [href, setHref] = useState('/tickets')
  const active = pathname === '/tickets' || pathname.startsWith('/tickets/')

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) setHref('/tickets' + saved)
  }, [])

  if (isExtern) return null

  return (
    <Link href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? '' : 'hover:bg-[#f5f5f5]'}`}
      style={{
        color: active ? 'var(--sidebar-active)' : 'var(--sidebar-muted)',
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
      }}
    >
      {icon}
      Tickets
    </Link>
  )
}
