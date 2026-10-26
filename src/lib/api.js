export const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000')

const TOKEN_KEY = 'lztech_token'
export const UNAUTHORIZED_EVENT = 'lztech:unauthorized'

export function assetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path}`
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage indisponível */
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) headers.Authorization = `Bearer ${getToken()}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (res.status === 401) {
    setToken('')
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new Error((data && data.error) || 'Sessão expirada. Faça login novamente.')
  }

  if (!res.ok) {
    throw new Error((data && data.error) || 'Não foi possível conectar ao servidor.')
  }
  return data
}

export const api = {
  login: (password) => request('/api/auth/login', { method: 'POST', body: { password } }),
  check: () => request('/api/auth/check', { auth: true }),
  changePassword: (current, next) =>
    request('/api/auth/password', { method: 'POST', body: { current, next }, auth: true }),

  products: {
    list: () => request('/api/products', { auth: true }),
    create: (payload) => request('/api/products', { method: 'POST', body: payload, auth: true }),
    update: (id, payload) =>
      request(`/api/products/${id}`, { method: 'PUT', body: payload, auth: true }),
    patch: (id, payload) =>
      request(`/api/products/${id}`, { method: 'PATCH', body: payload, auth: true }),
    remove: (id) => request(`/api/products/${id}`, { method: 'DELETE', auth: true }),
  },

  banners: {
    list: () => request('/api/banners', { auth: true }),
    create: (payload) => request('/api/banners', { method: 'POST', body: payload, auth: true }),
    update: (id, payload) =>
      request(`/api/banners/${id}`, { method: 'PUT', body: payload, auth: true }),
    remove: (id) => request(`/api/banners/${id}`, { method: 'DELETE', auth: true }),
  },

  orders: {
    list: () => request('/api/orders', { auth: true }),
    update: (id, status) =>
      request(`/api/orders/${id}`, { method: 'PATCH', body: { status }, auth: true }),
    remove: (id) => request(`/api/orders/${id}`, { method: 'DELETE', auth: true }),
  },

  settings: {
    full: () => request('/api/settings/full', { auth: true }),
    update: (payload) => request('/api/settings', { method: 'PUT', body: payload, auth: true }),
  },

  export: () => request('/api/export', { auth: true }),
  import: (payload) => request('/api/import', { method: 'POST', body: payload, auth: true }),

  async upload(file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    })
    const text = await res.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }
    }
    if (res.status === 401) {
      setToken('')
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      throw new Error('Sessão expirada.')
    }
    if (!res.ok) throw new Error((data && data.error) || 'Falha no upload da imagem.')
    return data
  },
}
