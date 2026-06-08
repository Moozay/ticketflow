'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Attachment {
  id: string
  fileName: string
  fileUrl: string
  publicId: string | null
  fileSize: number | null
  mimeType: string | null
  createdAt: string
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_MB = 10

export default function TicketAttachments({
  ticketId,
  initialAttachments,
}: {
  ticketId: string
  initialAttachments: Attachment[]
}) {
  const router = useRouter()
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<Attachment | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Attachment | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PNG, JPG, GIF and WebP images are allowed.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_MB}MB.`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // 1. Get signed upload params from our API
      const signRes = await fetch('/api/attachments/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      })
      const { signature, timestamp, folder, cloudName, apiKey } = await signRes.json()

      // 2. Upload directly to Cloudinary with auto quality optimisation
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)
      formData.append('folder', folder)
      formData.append('quality', 'auto')
      formData.append('fetch_format', 'auto')

      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round(e.loaded / e.total * 100))
      }

      const uploadResult = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
        xhr.send(formData)
      })

      // 3. Save record to DB
      const saveRes = await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          fileName: file.name,
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          fileSize: uploadResult.bytes,
          mimeType: file.type,
        }),
      })
      const attachment = await saveRes.json()
      setAttachments(a => [...a, attachment])
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [ticketId, router])

  // Drag & drop
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  // Paste from clipboard
  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files)[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleDelete = async (att: Attachment) => {
    setDeleting(att.id)
    await fetch(`/api/attachments/${att.id}`, { method: 'DELETE' })
    setAttachments(a => a.filter(x => x.id !== att.id))
    setConfirmDelete(null)
    setDeleting(null)
    // Close lightbox if the deleted image was open
    if (lightbox?.id === att.id) setLightbox(null)
    router.refresh()
  }

  // Force direct download via Cloudinary's fl_attachment flag
  const downloadUrl = (url: string, fileName: string) =>
    url.replace('/upload/', `/upload/fl_attachment:${fileName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '_')}/`)

  const thumbUrl = (url: string) =>
    url.replace('/upload/', '/upload/w_200,h_150,c_fill,q_auto,f_auto/')

  return (
    <div onPaste={onPaste}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add image
        </button>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
      </div>

      {/* Thumbnail grid */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {attachments.map(att => (
            <div key={att.id} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setLightbox(att)}>
              <img src={thumbUrl(att.fileUrl)} alt={att.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} />
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 10, padding: '14px 16px', textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: dragging ? 'var(--accent-bg)' : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        {uploading ? (
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 6 }}>Uploading… {uploadProgress}%</div>
            <div style={{ height: 4, background: 'var(--muted)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', transition: 'width 0.2s', borderRadius: 2 }} />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
            Drop image here, click to browse, or <kbd style={{ fontSize: 11, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3 }}>Ctrl+V</kbd> to paste
            <br /><span style={{ fontSize: 11 }}>PNG, JPG, GIF, WebP · max {MAX_MB}MB</span>
          </p>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
            <a href={downloadUrl(lightbox.fileUrl, lightbox.fileName)} download={lightbox.fileName}
              style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download
            </a>
            <button onClick={() => setConfirmDelete(lightbox)}
              style={{ padding: '7px 14px', borderRadius: 8, background: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Delete
            </button>
            <button onClick={() => setLightbox(null)}
              style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              ✕ Close
            </button>
          </div>
          <img src={lightbox.fileUrl} alt={lightbox.fileName} onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 10 }}>
            {lightbox.fileName} {lightbox.fileSize ? `· ${(lightbox.fileSize / 1024).toFixed(0)}KB` : ''}
          </p>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmDelete(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 400, width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Delete this image?</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px' }}>
              {confirmDelete.fileName} will be permanently removed from Cloudinary.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting === confirmDelete.id}
                style={{ padding: '8px 18px', borderRadius: 8, background: '#dc2626', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting === confirmDelete.id ? 0.7 : 1 }}>
                {deleting === confirmDelete.id ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
