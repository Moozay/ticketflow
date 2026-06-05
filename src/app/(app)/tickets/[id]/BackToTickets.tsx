'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ticketsLastFilter'

export default function BackToTickets() {
  const [href, setHref] = useState('/tickets')

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) setHref('/tickets' + saved)
  }, [])

  return (
    <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--muted-foreground)', textDecoration: 'none' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      All tickets
    </Link>
  )
}
