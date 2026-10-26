import { useRef, useState } from 'react'
import { api, assetUrl } from '../lib/api'
import { toast } from '../lib/ui'

export default function ImageUpload({ value, onChange, label = 'Foto do produto' }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const { url } = await api.upload(file)
      onChange(url)
    } catch (err) {
      setError(err.message)
      toast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field">
      <span className="label">{label}</span>
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
              className="btn btn-danger btn-sm"
              onClick={() => onChange('')}
              disabled={busy}
            >
              Remover
            </button>
          )}
        </div>
      </div>
      <small className="muted small">
        Formatos aceitos: JPG, PNG, WEBP (até 6 MB). A imagem fica salva no servidor.
      </small>
      {error && <small className="error">{error}</small>}
    </div>
  )
}
