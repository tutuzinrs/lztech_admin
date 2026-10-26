const TOAST_EVT = 'lztech:toast'

export function toast(message, tone = 'ok') {
  window.dispatchEvent(new CustomEvent(TOAST_EVT, { detail: { message, tone, id: Date.now() } }))
}

export function onToast(handler) {
  const listener = (e) => handler(e.detail)
  window.addEventListener(TOAST_EVT, listener)
  return () => window.removeEventListener(TOAST_EVT, listener)
}
