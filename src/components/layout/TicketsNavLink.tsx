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
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
      style={{
        color: active ? '#ffffff' : 'var(--sidebar-muted)',
        background: active ? 'var(--sidebar-accent)' : 'transparent',
        borderLeft: active ? '2px solid var(--sidebar-active)' : '2px solid transparent',
      }}
    >
      {icon}
      Tickets
    </Link>
  )
}
