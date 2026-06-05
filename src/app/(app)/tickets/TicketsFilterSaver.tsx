'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const STORAGE_KEY = 'ticketsLastFilter'

export default function TicketsFilterSaver({ isAdmin, engineerId }: { isAdmin: boolean; engineerId: string }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = searchParams.toString()
    if (params) {
      // Save current filter URL to sessionStorage
      sessionStorage.setItem(STORAGE_KEY, '?' + params)
    } else if (!isAdmin) {
      // Engineer with no params — save the default
      sessionStorage.setItem(STORAGE_KEY, `?engineerFilter=${engineerId}`)
    } else {
      // Admin with no params — clear saved filter
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [searchParams, isAdmin, engineerId])

  return null
}

export function getLastTicketsFilter(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(STORAGE_KEY) ?? ''
}
