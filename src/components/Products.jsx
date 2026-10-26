import { useMemo, useState } from 'react'
import { useAdmin } from '../lib/data'
import { CATEGORIES, categoryLabel } from '../lib/categories'
import { brl } from '../lib/format'
import { toast } from '../lib/ui'
import ProductImage from './ProductImage'
import ImageUpload from './ImageUpload'

const emptyForm = {
  id: null,
  name: '',
  category: 'carregadores',
  price: '',
  oldPrice: '',
  stock: '',
  badge: '',
  description: '',
  image: '',
  active: true,
  featured: false,
}

export default function Products() {
  const { products, saveProduct, deleteProduct, patchProduct } = useAdmin()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [editing, setEditing] = useState(null)

  const list = useMemo(() => {
    let out = [...products]
    if (filterCat) out = out.filter((p) => p.category === filterCat)
    if (search) {
      const t = search.toLowerCase()
      out = out.filter((p) => p.name.toLowerCase().includes(t))
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, search, filterCat])

  const openNew = () => setEditing({ ...emptyForm })
  const openEdit = (product) =>
    setEditing({
      ...emptyForm,
      ...product,
      price: String(product.price ?? ''),
      oldPrice: product.oldPrice == null ? '' : String(product.oldPrice),
      stock: String(product.stock ?? ''),
    })

  const save = async (form) => {
    const price = Number(String(form.price).replace(',', '.'))
    const oldPrice = form.oldPrice ? Number(String(form.oldPrice).replace(',', '.')) : null
    const stock = Number(String(form.stock).replace(',', '.')) || 0

    if (!form.name.trim()) return toast('Informe o nome do produto.', 'danger')
    if (!price || price <= 0) return toast('Informe um preço válido.', 'danger')

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price,
      oldPrice: oldPrice && oldPrice > 0 ? oldPrice : null,
      stock,
      badge: form.badge.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      active: form.active,
      featured: form.featured,
    }

    try {
      await saveProduct(form.id ? { ...payload, id: form.id } : payload, !form.id)
      toast('Produto salvo com sucesso.')
      setEditing(null)
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const remove = async (id) => {
    try {
      await deleteProduct(id)
      toast('Produto excluído.')
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const toggleActive = async (product) => {
    try {
      await patchProduct(product.id, { active: !product.active })
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  return (
    <div className="stack">
      <div className="panel-head">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="muted">Cadastre, edite e controle o estoque do seu catálogo.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + Novo produto
        </button>
      </div>

      <div className="table-tools">
        <input
          className="input"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="panel table-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th className="right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className={!p.active ? 'row-off' : ''}>
                <td>
                  <div className="prod-cell">
                    <ProductImage product={p} className="table-img" />
                    <div>
                      <strong>{p.name}</strong>
                      {p.badge && <span className="tag">{p.badge}</span>}
                    </div>
                  </div>
                </td>
                <td>{categoryLabel(p.category)}</td>
                <td>
                  <strong>{brl(p.price)}</strong>
                  {p.oldPrice ? (
                    <div className="muted small">
                      <s>{brl(p.oldPrice)}</s>
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className={Number(p.stock) <= 0 ? 'danger-text' : ''}>
                    {Number(p.stock) <= 0 ? 'Esgotado' : `${p.stock} un.`}
                  </span>
                </td>
                <td>
                  <button
                    className={`toggle ${p.active ? 'on' : 'off'}`}
                    onClick={() => toggleActive(p)}
                    title={p.active ? 'Visível na loja' : 'Oculto na loja'}
                  >
                    {p.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="right">
                  <div className="row-actions">
                    <button className="btn btn-soft btn-sm" onClick={() => openEdit(p)}>
                      Editar
                    </button>
                    <ConfirmDelete onConfirm={() => remove(p.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="6" className="center muted">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductModal
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

function ProductModal({ form, onChange, onClose, onSave }) {
  const set = (field, value) => onChange({ ...form, [field]: value })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{form.id ? 'Editar produto' : 'Novo produto'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="modal-body">
          <div className="preview">
            <ProductImage product={form} className="preview-img" />
            <p className="muted small">
              Sem foto? Exibimos um ícone da categoria automaticamente.
            </p>
          </div>

          <div className="form">
            <label className="field">
              <span className="label">Nome do produto *</span>
              <input
                className="input"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Ex: Carregador Turbo 20W"
              />
            </label>

            <div className="form-grid">
              <label className="field">
                <span className="label">Categoria</span>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Selo (opcional)</span>
                <input
                  className="input"
                  value={form.badge}
                  onChange={(e) => set('badge', e.target.value)}
                  placeholder="Promoção, Mais vendido..."
                />
              </label>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="label">Preço (R$) *</span>
                <input
                  className="input"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="49.90"
                  inputMode="decimal"
                />
              </label>
              <label className="field">
                <span className="label">Preço antigo (R$)</span>
                <input
                  className="input"
                  value={form.oldPrice}
                  onChange={(e) => set('oldPrice', e.target.value)}
                  placeholder="69.90"
                  inputMode="decimal"
                />
              </label>
            </div>

            <label className="field">
              <span className="label">Quantidade em estoque</span>
              <input
                className="input"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                placeholder="10"
                inputMode="numeric"
              />
            </label>

            <ImageUpload label="Foto do produto" value={form.image} onChange={(v) => set('image', v)} />

            <label className="field">
              <span className="label">Descrição</span>
              <textarea
                className="input textarea"
                rows="3"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Detalhes, compatibilidade, garantia..."
              />
            </label>

            <div className="checks">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                />
                Visível na loja
              </label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set('featured', e.target.checked)}
                />
                Destaque na página inicial
              </label>
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          <button className="btn btn-soft" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Salvar produto
          </button>
        </footer>
      </div>
    </div>
  )
}
