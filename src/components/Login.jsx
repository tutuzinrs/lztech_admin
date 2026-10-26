import { useState } from 'react'
import { api, setToken } from '../lib/api'

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await api.login(password)
      setToken(token)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Senha incorreta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <span className="logo-mark lg">LZ</span>
        <h1>LZ Tech Admin</h1>
        <p className="login-sub">Acesse o painel para gerenciar produtos, banners e vendas.</p>

        <label className="field">
          <span className="label">Senha de acesso</span>
          <input
            type="password"
            className={`input ${error ? 'invalid' : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            placeholder="••••••••"
            autoFocus
          />
        </label>

        {error && <small className="error">{error}</small>}

        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="login-hint">
          Senha padrão: <code>admin123</code> — altere em Configurações.
        </p>
      </form>
    </div>
  )
}
