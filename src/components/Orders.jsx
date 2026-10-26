import { useMemo, useState } from 'react'
import { useAdmin } from '../lib/data'
import { brl, dateLong, ORDER_STATUS, onlyDigits } from '../lib/format'
import { toast } from '../lib/ui'
import { StatusPill } from './Dashboard'

const STATUSES = Object.keys(ORDER_STATUS)

export default function Orders() {
  const { orders, settings, updateOrderStatus, deleteOrder } = useAdmin()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const list = useMemo(() => {
    let out = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date))
    if (filter) out = out.filter((o) => o.status === filter)
    if (search) {
      const t = search.toLowerCase()
      out = out.filter(
        (o) =>
          o.number.toLowerCase().includes(t) ||
          o.customer.name.toLowerCase().includes(t) ||
          onlyDigits(o.customer.phone).includes(onlyDigits(t))
      )
    }
    return out
  }, [orders, filter, search])

  const setStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status)
      toast('Status do pedido atualizado.')
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const remove = async (id) => {
    try {
      await deleteOrder(id)
      setSelected(null)
      toast('Pedido excluído.', 'danger')
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const current = selected ? orders.find((o) => o.id === selected) || null : null

  return (
    <div className="stack">
      <div className="panel-head">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="muted">Acompanhe as vendas e atualize o status de cada pedido.</p>
        </div>
      </div>

      <div className="filters">
        <button className={`chip ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>
          Todos ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s).length
          return (
            <button
              key={s}
              className={`chip ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {ORDER_STATUS[s].label} ({count})
            </button>
          )
        })}
      </div>

      <div className="table-tools">
        <input
          className="input"
          placeholder="Buscar por número, nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel table-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th className="right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.number}</strong>
                </td>
                <td>
                  <strong>{o.customer.name}</strong>
                  <div className="muted small">{o.customer.phone}</div>
                </td>
                <td className="muted small">{dateLong(o.date)}</td>
                <td className="muted small">
                  {o.items.reduce((s, i) => s + i.qty, 0)} itens
                </td>
                <td>
                  <strong>{brl(o.total)}</strong>
                </td>
                <td>
                  <select
                    className={`status-select tone-${ORDER_STATUS[o.status].tone}`}
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS[s].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="right">
                  <button className="btn btn-soft btn-sm" onClick={() => setSelected(o.id)}>
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="7" className="center muted">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {current && (
        <OrderModal
          order={current}
          settings={settings}
          onClose={() => setSelected(null)}
          onStatus={(s) => setStatus(current.id, s)}
          onDelete={() => remove(current.id)}
          onCopied={() => toast('Resumo copiado!')}
        />
      )}
    </div>
  )
}

function OrderModal({ order, settings, onClose, onStatus, onDelete, onCopied }) {
  const [armed, setArmed] = useState(false)

  const summaryText = () => {
    const lines = [
      `Pedido ${order.number} — ${settings.storeName}`,
      `Cliente: ${order.customer.name}`,
      `WhatsApp: ${order.customer.phone}`,
      `Entrega: ${
        order.customer.delivery === 'entrega'
          ? `${order.customer.address} ${order.customer.city || ''}`.trim()
          : 'Retirar na loja'
      }`,
      `Pagamento: ${order.customer.payment}`,
      '',
      ...order.items.map((i) => `${i.qty}x ${i.name} — ${brl(i.price * i.qty)}`),
      '',
      `Subtotal: ${brl(order.subtotal)}`,
      order.shipping > 0 ? `Entrega: ${brl(order.shipping)}` : 'Retirada: grátis',
      `Total: ${brl(order.total)}`,
    ]
    return lines.join('\n')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText())
      onCopied()
    } catch {
      toast('Não foi possível copiar.', 'danger')
    }
  }

  const waLink = `https://wa.me/${onlyDigits(order.customer.phone)}`

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2>Pedido {order.number}</h2>
            <p className="muted small">{dateLong(order.date)}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="modal-body order-body">
          <section className="order-block">
            <h3>Status do pedido</h3>
            <div className="filters">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`chip ${order.status === s ? 'active' : ''}`}
                  onClick={() => onStatus(s)}
                >
                  {ORDER_STATUS[s].label}
                </button>
              ))}
            </div>
            <div className="order-status-now">
              Status atual: <StatusPill status={order.status} />
            </div>
          </section>

          <section className="order-block">
            <h3>Dados do cliente</h3>
            <dl className="dl">
              <div>
                <dt>Nome</dt>
                <dd>{order.customer.name}</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>{order.customer.phone}</dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>
                  {order.customer.delivery === 'entrega'
                    ? `${order.customer.address}${order.customer.city ? ` — ${order.customer.city}` : ''}`
                    : 'Retirar na loja'}
                </dd>
              </div>
              <div>
                <dt>Pagamento</dt>
                <dd>{order.customer.payment}</dd>
              </div>
              {order.customer.notes && (
                <div>
                  <dt>Observações</dt>
                  <dd>{order.customer.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="order-block">
            <h3>Itens do pedido</h3>
            <div className="order-items">
              {order.items.map((i) => (
                <div className="order-item" key={i.id}>
                  <span>
                    {i.qty}x {i.name}
                  </span>
                  <strong>{brl(i.price * i.qty)}</strong>
                </div>
              ))}
            </div>
            <div className="order-totals">
              <div>
                <span>Subtotal</span>
                <span>{brl(order.subtotal)}</span>
              </div>
              <div>
                <span>Entrega</span>
                <span>{order.shipping > 0 ? brl(order.shipping) : 'Grátis'}</span>
              </div>
              <div className="order-total-final">
                <span>Total</span>
                <strong>{brl(order.total)}</strong>
              </div>
            </div>
          </section>
        </div>

        <footer className="modal-foot">
          {!armed ? (
            <button className="btn btn-danger btn-sm" onClick={() => setArmed(true)}>
              Excluir pedido
            </button>
          ) : (
            <span className="confirm-inline">
              <button className="btn btn-danger btn-sm" onClick={onDelete}>
                Confirmar exclusão
              </button>
              <button className="btn btn-soft btn-sm" onClick={() => setArmed(false)}>
                Cancelar
              </button>
            </span>
          )}
          <div className="modal-foot-right">
            <button className="btn btn-soft" onClick={copy}>
              Copiar resumo
            </button>
            <a className="btn btn-primary" href={waLink} target="_blank" rel="noreferrer">
              Abrir WhatsApp do cliente
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
