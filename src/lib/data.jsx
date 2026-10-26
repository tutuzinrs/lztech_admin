import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken } from './api'

const AdminDataContext = createContext(null)

export function DataProvider({ children }) {
  const [state, setState] = useState({
    products: [],
    orders: [],
    banners: [],
    settings: null,
    loading: true,
    error: null,
  })

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true }))
    try {
      const [products, orders, banners, settings] = await Promise.all([
        api.products.list(),
        api.orders.list(),
        api.banners.list(),
        api.settings.full(),
      ])
      setState({ products, orders, banners, settings, loading: false, error: null })
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }))
    }
  }, [])

  useEffect(() => {
    if (getToken()) load()
  }, [load])

  const value = {
    ...state,
    reload: load,

    async saveProduct(product, isNew) {
      const saved = isNew
        ? await api.products.create(product)
        : await api.products.update(product.id, product)
      setState((s) => ({
        ...s,
        products: isNew
          ? [saved, ...s.products]
          : s.products.map((p) => (p.id === saved.id ? saved : p)),
      }))
      return saved
    },

    async patchProduct(id, patch) {
      const saved = await api.products.patch(id, patch)
      setState((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? saved : p)) }))
      return saved
    },

    async deleteProduct(id) {
      await api.products.remove(id)
      setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }))
    },

    async saveBanner(banner, isNew) {
      const saved = isNew
        ? await api.banners.create(banner)
        : await api.banners.update(banner.id, banner)
      setState((s) => ({
        ...s,
        banners: isNew
          ? [...s.banners, saved].sort((a, b) => a.position - b.position)
          : s.banners.map((b) => (b.id === saved.id ? saved : b)),
      }))
      return saved
    },

    async deleteBanner(id) {
      await api.banners.remove(id)
      setState((s) => ({ ...s, banners: s.banners.filter((b) => b.id !== id) }))
    },

    async updateOrderStatus(id, status) {
      const saved = await api.orders.update(id, status)
      setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? saved : o)) }))
      return saved
    },

    async deleteOrder(id) {
      await api.orders.remove(id)
      setState((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }))
    },

    async saveSettings(payload) {
      const saved = await api.settings.update(payload)
      setState((s) => ({ ...s, settings: { ...s.settings, ...saved } }))
      return saved
    },
  }

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdmin deve ser usado dentro de DataProvider')
  return ctx
}
