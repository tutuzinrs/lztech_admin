import { setToken } from '../lib/api'
import { useAdmin } from '../lib/data'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'produtos', label: 'Produtos', icon: '📦' },
  { id: 'banners', label: 'Banners', icon: '🖼️' },
  { id: 'pedidos', label: 'Pedidos', icon: '🧾' },
  { id: 'config', label: 'Configurações', icon: '⚙️' },
]

const STORE_URL = import.meta.env.PROD ? '/' : 'http://localhost:5175'

export default function Sidebar({ page, onNavigate, counts }) {
  const { settings } = useAdmin()

  const logout = () => {
    setToken('')
    window.location.reload()
  }

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <span className="logo-mark">LZ</span>
        <div>
          <strong>{settings?.storeName || 'LZ Tech'}</strong>
          <small>Painel administrativo</small>
        </div>
      </div>

      <nav className="side-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`side-link ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="side-icon">{item.icon}</span>
            {item.label}
            {item.id === 'pedidos' && counts?.pending > 0 && (
              <span className="side-badge">{counts.pending}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="side-foot">
        <a className="side-store" href={STORE_URL} target="_blank" rel="noreferrer">
          🛍️ Ver loja
        </a>
        <button className="side-logout" onClick={logout}>
          Sair do painel
        </button>
      </div>
    </aside>
  )
}
