import { useMemo, useState } from 'react'
import { useAdmin } from '../lib/data'
import { assetUrl } from '../lib/api'
import { toast } from '../lib/ui'
import BannerImageUpload from './BannerImageUpload'

const emptyForm = {
  id: null,
  title: '',
  subtitle: '',
  image: '',
  link: '',
  position: 0,
  format: 'banner',
  focusX: 0.5,
  focusY: 0.5,
  active: true,
}

export default function Banners() {
  const { banners, saveBanner, deleteBanner } = useAdmin()
  const [editing, setEditing] = useState(null)

  const list = useMemo(
    () => [...banners].sort((a, b) => a.position - b.position),
    [banners]
  )

  const openNew = () =>
    setEditing({ ...emptyForm, position: (list[list.length - 1]?.position || 0) + 1 })

  const save = async (form) => {
    if (!form.title.trim()) return toast('Informe um título para o banner.', 'danger')
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image: form.image.trim(),
      link: form.link.trim(),
      position: Number(form.position) || 0,
      format: form.format === 'quadrado' ? 'quadrado' : 'banner',
      focusX: Number.isFinite(Number(form.focusX)) ? Number(form.focusX) : 0.5,
      focusY: Number.isFinite(Number(form.focusY)) ? Number(form.focusY) : 0.5,
      active: form.active,
    }
    try {
      await saveBanner(form.id ? { ...payload, id: form.id } : payload, !form.id)
      toast('Banner salvo com sucesso.')
      setEditing(null)
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const remove = async (id) => {
    try {
      await deleteBanner(id)
      toast('Banner excluído.')
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  return (
    <div className="stack">
      <div className="panel-head">
        <div>
          <h1 className="page-title">Banners</h1>
          <p className="muted">
            Artes que aparecem na página inicial da loja. Use <strong>banner (865×147)</strong> para
            destaques horizontais e <strong>quadrado (1:1)</strong> para posts.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + Novo banner
        </button>
      </div>

      {list.length === 0 ? (
        <div className="panel center muted">Nenhum banner cadastrado ainda.</div>
      ) : (
        <div className="banner-admin-grid">
          {list.map((banner) => {
            const isSquare = banner.format === 'quadrado'
            return (
              <div
                className={`banner-admin-card ${isSquare ? '' : 'banner-admin-card-wide'} ${
                  !banner.active ? 'row-off' : ''
                }`}
                key={banner.id}
              >
                <div className={`banner-admin-art ${isSquare ? 'banner-admin-art-square' : 'banner-admin-art-banner'}`}>
                  {banner.image ? (
                    <img
                      src={assetUrl(banner.image)}
                      alt={banner.title}
                      style={{
                        objectPosition: `${Math.round((banner.focusX ?? 0.5) * 100)}% ${Math.round(
                          (banner.focusY ?? 0.5) * 100
                        )}%`,
                      }}
                    />
                  ) : (
                    <div className="banner-admin-ph">{banner.title}</div>
                  )}
                  <span className="banner-pos">#{banner.position} • {isSquare ? 'Quadrado' : 'Banner 865×147'}</span>
                </div>
                <div className="banner-admin-body">
                  <strong>{banner.title}</strong>
                  <span className="muted small">{banner.subtitle || 'Sem subtítulo'}</span>
                  <span className="banner-link">
                    {banner.link ? `→ ${banner.link}` : 'Sem link'}
                  </span>
                  <div className="row-actions">
                    <button className="btn btn-soft btn-sm" onClick={() => setEditing({ ...banner })}>
                      Editar
                    </button>
                    <ConfirmDelete onConfirm={() => remove(banner.id)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <BannerModal
          form={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
        />
      )}
    </div>
  )
}

function ConfirmDelete({ onConfirm }) {
  const [armed, setArmed] = useState(false)
  if (!armed) {
    return (
      <button className="btn btn-danger btn-sm" onClick={() => setArmed(true)}>
        Excluir
      </button>
    )
  }
  return (
    <span className="confirm-inline">
      <button className="btn btn-danger btn-sm" onClick={onConfirm}>
        Confirmar
      </button>
      <button className="btn btn-soft btn-sm" onClick={() => setArmed(false)}>
        Cancelar
      </button>
    </span>
  )
}

function BannerModal({ form, onChange, onClose, onSave }) {
  const set = (field, value) => onChange((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{form.id ? 'Editar banner' : 'Novo banner'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="modal-body single">
          <BannerImageUpload
            value={form.image}
            onChange={(v) => set('image', v)}
            format={form.format}
            focusX={form.focusX}
            focusY={form.focusY}
            onFocusXChange={(v) => set('focusX', v)}
            onFocusYChange={(v) => set('focusY', v)}
          />

          <div className="form">
            <label className="field">
              <span className="label">Título *</span>
              <input
                className="input"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Semana do Carregador"
              />
            </label>

            <label className="field">
              <span className="label">Subtítulo</span>
              <input
                className="input"
                value={form.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
                placeholder="Ex: Até 30% OFF em carregadores"
              />
            </label>

            <label className="field">
              <span className="label">Link ao clicar</span>
              <input
                className="input"
                value={form.link}
                onChange={(e) => set('link', e.target.value)}
                placeholder="/catalogo?cat=fones ou https://..."
              />
              <small className="muted small">
                Para uma categoria use <code>/catalogo?cat=ID</code> (carregadores, cabos, fones,
                peliculas, capas, acessorios). Também aceita link externo.
              </small>
            </label>

            <div className="form-grid">
              <label className="field">
                <span className="label">Formato do banner</span>
                <select
                  className="input"
                  value={form.format}
                  onChange={(e) => set('format', e.target.value)}
                >
                  <option value="banner">Banner (865×147)</option>
                  <option value="quadrado">Quadrado (1:1)</option>
                </select>
                <small className="muted small">
                  Banner: arte de 865×147px (horizontal, ocupa toda a largura). Quadrado: arte
                  1:1.
                </small>
              </label>
              <label className="field">
                <span className="label">Ordem de exibição</span>
                <input
                  className="input"
                  value={form.position}
                  onChange={(e) => set('position', e.target.value)}
                  inputMode="numeric"
                />
              </label>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
              />
              Banner ativo na loja
            </label>
          </div>
        </div>

        <footer className="modal-foot">
          <button className="btn btn-soft" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Salvar banner
          </button>
        </footer>
      </div>
    </div>
  )
}
