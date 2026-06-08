'use client'

import { useEffect, useRef, useState } from 'react'

export default function ExportMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function exportExcel() {
    setOpen(false)
    window.open('/api/dashboard/export', '_blank')
  }

  function exportPdf() {
    setOpen(false)
    window.open('/api/dashboard/export-pdf', '_blank')
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
    padding: '10px 14px', background: 'transparent', border: 'none',
    fontSize: '13px', fontWeight: 500, color: 'var(--foreground)',
    cursor: 'pointer', textAlign: 'left',
  }

  return (
    <div ref={ref} className="no-print" style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            minWidth: '180px', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', padding: '4px',
          }}
        >
          <button
            role="menuitem"
            onClick={exportPdf}
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              <path d="M9 15h1.5a1.5 1.5 0 000-3H9v6M15.5 12H14v6M14 15h1" />
            </svg>
            Export as PDF
          </button>
          <button
            role="menuitem"
            onClick={exportExcel}
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              <path d="M9 13l3 4M12 13l-3 4" />
            </svg>
            Export as Excel
          </button>
        </div>
      )}
    </div>
  )
}
