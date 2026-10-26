import { useEffect, useState } from 'react'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import Banners from './components/Banners'
import Orders from './components/Orders'
import Settings from './components/Settings'
import ToastHost from './components/Toast'
import { api, getToken, setToken, UNAUTHORIZED_EVENT } from './lib/api'
import { DataProvider, useAdmin } from './lib/data'

export default function App() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const onUnauthorized = () => setStatus('out')
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)

    if (!getToken()) {
      setStatus('out')
    } else {
      api
        .check()
        .then(() => setStatus('in'))
        .catch(() => {
          setToken('')
          setStatus('out')
        })
    }

    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  if (status === 'checking') {
    return (
      <div className="login">
        <div className="boot">
          <span className="spinner" />
          <p className="muted">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (status === 'out') {
    return (
      <>
        <Login onSuccess={() => setStatus('in')} />
        <ToastHost />
      </>
    )
  }

  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}

const TITLES = {
  dashboard: 'Visão geral',
  produtos: 'Produtos',
  banners: 'Banners',
  pedidos: 'Pedidos',
  config: 'Configurações',
}

function Shell() {
  const { orders, settings, loading, error, reload } = useAdmin()
  const [page, setPage] = useState('dashboard')

  if (loading) {
    return (
      <div className="login">
        <div className="boot">
          <span className="spinner" />
          <p className="muted">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="login">
        <div className="boot">
          <span className="boot-icon">📡</span>
          <h2>Não foi possível carregar os dados</h2>
          <p className="muted">{error}</p>
          <p className="muted small">Verifique se a API está rodando (npm run dev em lztech_api).</p>
          <button className="btn btn-primary" onClick={() => reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const pending = orders.filter((o) => o.status === 'pendente').length

  return (
    <div className="shell">
      <Sidebar page={page} onNavigate={setPage} counts={{ pending }} />

      <div className="content">
        <header className="topbar">
          <h2>{TITLES[page]}</h2>
          <span className="muted small">
            {settings?.storeName || 'LZ Tech'} • Painel de controle
          </span>
        </header>

        <main className="page-pad">
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'produtos' && <Products />}
          {page === 'banners' && <Banners />}
          {page === 'pedidos' && <Orders />}
          {page === 'config' && <Settings />}
        </main>
      </div>

      <ToastHost />
    </div>
  )
}
