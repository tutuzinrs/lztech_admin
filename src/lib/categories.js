export const CATEGORIES = [
  { id: 'carregadores', label: 'Carregadores', emoji: '⚡' },
  { id: 'cabos', label: 'Cabos', emoji: '🔌' },
  { id: 'fones', label: 'Fones', emoji: '🎧' },
  { id: 'peliculas', label: 'Películas', emoji: '🛡️' },
  { id: 'capas', label: 'Capas', emoji: '📱' },
  { id: 'acessorios', label: 'Acessórios', emoji: '🔧' },
]

export const categoryLabel = (id) =>
  (CATEGORIES.find((c) => c.id === id) || {}).label || 'Acessórios'

export const categoryEmoji = (id) =>
  (CATEGORIES.find((c) => c.id === id) || {}).emoji || '📦'
