export const brl = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value) || 0
  )

export const dateShort = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export const dateLong = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const onlyDigits = (value = '') => String(value).replace(/\D/g, '')

export const ORDER_STATUS = {
  pendente: { label: 'Pendente', tone: 'warn' },
  separacao: { label: 'Em separação', tone: 'info' },
  enviado: { label: 'Enviado', tone: 'info' },
  entregue: { label: 'Entregue', tone: 'ok' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
}
