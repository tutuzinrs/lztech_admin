import { useEffect, useState } from 'react'
import { onToast } from '../lib/ui'

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return onToast((detail) => {
      setToasts((prev) => [...prev, detail])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id))
      }, 3000)
    })
  }, [])

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
