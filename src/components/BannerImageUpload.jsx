import { useRef, useState } from 'react'
import { api, assetUrl } from '../lib/api'
import { toast } from '../lib/ui'

const clamp01 = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5
}

export default function BannerImageUpload({
  value,
  onChange,
  format = 'banner',
  focusX = 0.5,
  focusY = 0.5,
  onFocusXChange,
  onFocusYChange,
}) {
  const fileRef = useRef(null)
  const frameRef = useRef(null)
  const dragRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const isSquare = format === 'quadrado'
  const xPercent = Math.round(clamp01(focusX) * 100)
  const yPercent = Math.round(clamp01(focusY) * 100)
  const centered = xPercent === 50 && yPercent === 50
  const objectPosition = `${xPercent}% ${yPercent}%`

  const center = () => {
    onFocusXChange?.(0.5)
    onFocusYChange?.(0.5)
  }

  const pick = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const { url } = await api.upload(file)
      onChange(url)
      center()
    } catch (err) {
      setError(err.message)
      toast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  const startDrag = (e) => {
    if (!value) return
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      focusX: clamp01(focusX),
      focusY: clamp01(focusY),
    }
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const moveDrag = (e) => {
    if (!dragRef.current) return
    const width = frameRef.current?.clientWidth || 1
    const height = frameRef.current?.clientHeight || 1
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    onFocusXChange?.(clamp01(dragRef.current.focusX - dx / width))
    onFocusYChange?.(clamp01(dragRef.current.focusY - dy / height))
  }

  const endDrag = (e) => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  const onKeyDown = (e) => {
    if (!value) return
    const step = e.shiftKey ? 0.1 : 0.02
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onFocusYChange?.(clamp01(clamp01(focusY) - step))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onFocusYChange?.(clamp01(clamp01(focusY) + step))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onFocusXChange?.(clamp01(clamp01(focusX) - step))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onFocusXChange?.(clamp01(clamp01(focusX) + step))
    }
  }

  return (
    <div className="field">
      <span className="label">Arte do banner</span>

      {value && (
        <div
          ref={frameRef}
          className={`banner-focus ${isSquare ? 'banner-focus-square' : 'banner-focus-banner'} ${
            dragging ? 'is-dragging' : ''
          }`}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="application"
          tabIndex={0}
          aria-label="Recorte do banner. Use as setas ou arraste a imagem."
          onKeyDown={onKeyDown}
        >
          <img
            src={assetUrl(value)}
            alt="Prévia do banner"
            draggable={false}
            style={{ objectPosition }}
          />
          <span className="banner-focus-hint">
            Arraste a imagem para escolher o recorte
          </span>
        </div>
      )}

      <div className="upload">
        <div className="upload-preview">
          {value ? (
            <img src={assetUrl(value)} alt="Prévia" />
          ) : (
            <span className="upload-empty">🖼️</span>
          )}
        </div>
        <div className="upload-actions">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              pick(e.target.files[0])
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Enviando...' : value ? 'Trocar imagem' : 'Enviar imagem do PC'}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={center}
              disabled={busy || centered}
            >
              Centralizar
            </button>
          )}
          {value && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                onChange('')
                center()
              }}
              disabled={busy}
            >
              Remover
            </button>
          )}
        </div>
      </div>

      <small className="muted small">
        Formatos aceitos: JPG, PNG, WEBP (até 6 MB). Arraste a imagem para escolher o recorte
        (ou use as setas do teclado).
      </small>
      {error && <small className="error">{error}</small>}
    </div>
  )
}
