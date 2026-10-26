import { useMemo } from 'react'
import { useAdmin } from '../lib/data'
import { brl, dateShort, ORDER_STATUS } from '../lib/format'
import ProductImage from './ProductImage'

export default function Dashboard({ onNavigate }) {
  const { orders, products } = useAdmin()

  const stats = useMemo(() => {
    const now = Date.now()
    const cutoff = now - 30 * 86400000
    const valid = orders.filter((o) => o.status !== 'cancelado')
    const recent = valid.filter((o) => new Date(o.date).getTime() >= cutoff)

    const revenue = recent.reduce((s, o) => s + o.total, 0)
    const itemsSold = recent.reduce(
      (s, o) => s + o.items.reduce((x, i) => x + i.qty, 0),
      0
    )

    const days = []
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now - i * 86400000)
      const key = day.toDateString()
      const total = valid
        .filter((o) => new Date(o.date).toDateString() === key)
        .reduce((s, o) => s + o.total, 0)
      days.push({ label: dateShort(day.toISOString()), total })
    }

    const productCount = {}
    valid.forEach((o) =>
      o.items.forEach((i) => {
        productCount[i.name] = (productCount[i.name] || 0) + i.qty
      })
    )
    const top = Object.entries(productCount)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    const lowStock = products.filter((p) => p.active && Number(p.stock) <= 5)

    return {
      revenue,
      orderCount: recent.length,
      itemsSold,
      ticket: recent.length ? revenue / recent.length : 0,
      days,
      top,
      lowStock,
      maxDay: Math.max(...days.map((d) => d.total), 1),
      recentOrders: [...orders]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6),
    }
  }, [orders, products])

  return (
    <div className="stack">
      <div className="kpis">
        <Kpi label="Faturamento (30 dias)" value={brl(stats.revenue)} hint="Pedidos não cancelados" />
        <Kpi label="Pedidos (30 dias)" value={stats.orderCount} hint="Total no período" />
        <Kpi label="Itens vendidos" value={stats.itemsSold} hint="Nos últimos 30 dias" />
        <Kpi label="Ticket médio" value={brl(stats.ticket)} hint="Por pedido" />
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Vendas dos últimos 14 dias</h2>
          </div>
          <div className="chart">
            {stats.days.map((d, i) => (
              <div className="chart-col" key={i} title={`${d.label}: ${brl(d.total)}`}>
                <div
                  className="chart-bar"
                  style={{ height: `${Math.max((d.total / stats.maxDay) * 100, 3)}%` }}
                />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Mais vendidos</h2>
          </div>
          {stats.top.length === 0 ? (
            <p className="muted">Nenhuma venda registrada ainda.</p>
          ) : (
            <ul className="rank">
              {stats.top.map((p, i) => (
                <li key={p.name}>
                  <span className="rank-pos">{i + 1}</span>
                  <span className="rank-name">{p.name}</span>
                  <strong>{p.qty} un.</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Pedidos recentes</h2>
            <button className="link" onClick={() => onNavigate('pedidos')}>
              Ver todos →
            </button>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="muted">Nenhum pedido por aqui.</p>
          ) : (
            <div className="mini-list">
              {stats.recentOrders.map((o) => (
                <div className="mini-row" key={o.id}>
                  <div>
                    <strong>{o.number}</strong>
                    <span className="muted"> • {o.customer.name}</span>
                    <div className="muted small">{dateShort(o.date)}</div>
                  </div>
                  <div className="mini-right">
                    <strong>{brl(o.total)}</strong>
                    <StatusPill status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Estoque baixo</h2>
            <button className="link" onClick={() => onNavigate('produtos')}>
              Gerenciar →
            </button>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="muted">Nenhum produto com estoque crítico. 👍</p>
          ) : (
            <div className="mini-list">
              {stats.lowStock.map((p) => (
                <div className="mini-row" key={p.id}>
                  <div className="mini-prod">
                    <ProductImage product={p} className="mini-img" />
                    <div>
                      <strong>{p.name}</strong>
                      <div className={`muted small ${p.stock <= 0 ? 'danger-text' : ''}`}>
                        {p.stock <= 0 ? 'Sem estoque' : `${p.stock} restantes`}
                      </div>
                    </div>
                  </div>
                  <strong>{brl(p.price)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Kpi({ label, value, hint }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      {hint && <span className="kpi-hint">{hint}</span>}
    </div>
  )
}

export function StatusPill({ status }) {
  const meta = ORDER_STATUS[status] || ORDER_STATUS.pendente
  return <span className={`status status-${meta.tone}`}>{meta.label}</span>
}
