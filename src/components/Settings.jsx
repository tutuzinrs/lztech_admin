import { useEffect, useRef, useState } from 'react'
import { useAdmin } from '../lib/data'
import { api } from '../lib/api'
import { toast } from '../lib/ui'

function emptyForm(settings) {
  return {
    storeName: settings?.storeName || '',
    tagline: settings?.tagline || '',
    whatsapp: settings?.whatsapp || '',
    address: settings?.address || '',
    city: settings?.city || '',
    instagram: settings?.instagram || '',
    hours: settings?.hours || '',
    deliveryFee: String(settings?.deliveryFee ?? ''),
    deliveryFreeKm: String(settings?.deliveryFreeKm ?? 5),
    deliveryBaseFee: String(settings?.deliveryBaseFee ?? 5),
    deliveryPerKm: String(settings?.deliveryPerKm ?? 2),
  }
}

export default function Settings() {
  const { settings, saveSettings } = useAdmin()
  const [form, setForm] = useState(() => emptyForm(settings))
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const fileRef = useRef(null)

  useEffect(() => {
    setForm(emptyForm(settings))
  }, [settings])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const saveStore = async () => {
    if (!form.storeName.trim()) return toast('Informe o nome da loja.', 'danger')
    if (form.whatsapp.replace(/\D/g, '').length < 10)
      return toast('Informe o WhatsApp com país e DDD (ex: 5511999999999).', 'danger')
    try {
      await saveSettings(form)
      toast('Configurações salvas.')
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const changePassword = async () => {
    if (!passwords.current || !passwords.next)
      return toast('Preencha a senha atual e a nova senha.', 'danger')
    try {
      await api.changePassword(passwords.current, passwords.next)
      setPasswords({ current: '', next: '' })
      toast('Senha alterada com sucesso.')
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const exportData = async () => {
    try {
      const data = await api.export()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lztech-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast('Backup exportado.')
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  const importData = (file) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result)
        await api.import(data)
        toast('Dados importados com sucesso. Recarregando...')
        setTimeout(() => window.location.reload(), 900)
      } catch (err) {
        toast(err.message || 'Arquivo inválido.', 'danger')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="stack">
      <div className="panel-head">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="muted">Dados da loja, contato do WhatsApp, senha e backup.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Dados da loja</h2>
        </div>
        <div className="form">
          <div className="form-grid">
            <label className="field">
              <span className="label">Nome da loja</span>
              <input
                className="input"
                value={form.storeName}
                onChange={(e) => set('storeName', e.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">Instagram</span>
              <input
                className="input"
                value={form.instagram}
                onChange={(e) => set('instagram', e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="label">Slogan</span>
            <input
              className="input"
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="label">WhatsApp (somente números, com país e DDD)</span>
            <input
              className="input"
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="5511999999999"
            />
            <small className="muted small">
              Todos os pedidos do site são enviados para este número.
            </small>
          </label>

          <div className="form-grid">
            <label className="field">
              <span className="label">Endereço</span>
              <input
                className="input"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">Cidade / UF</span>
              <input
                className="input"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="label">Horário de atendimento</span>
              <input
                className="input"
                value={form.hours}
                onChange={(e) => set('hours', e.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">Raio de entrega grátis (km)</span>
              <input
                className="input"
                value={form.deliveryFreeKm}
                onChange={(e) => set('deliveryFreeKm', e.target.value)}
                placeholder="5"
                inputMode="decimal"
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="label">Frete base acima do raio (R$)</span>
              <input
                className="input"
                value={form.deliveryBaseFee}
                onChange={(e) => set('deliveryBaseFee', e.target.value)}
                placeholder="5"
                inputMode="decimal"
              />
            </label>
            <label className="field">
              <span className="label">Acréscimo por km (R$)</span>
              <input
                className="input"
                value={form.deliveryPerKm}
                onChange={(e) => set('deliveryPerKm', e.target.value)}
                placeholder="2"
                inputMode="decimal"
              />
            </label>
          </div>

          <p className="muted small">
            O frete é calculado pela distância entre o <strong>endereço da loja acima</strong> e o
            endereço do cliente. Até <strong>{form.deliveryFreeKm || '5'} km</strong> é grátis;
            passando disso, cobra <strong>R$ {form.deliveryBaseFee || '5'}</strong> e mais{' '}
            <strong>R$ {form.deliveryPerKm || '2'}</strong> por km adicional (arredondando para
            cima).
          </p>

          <div className="panel-actions">
            <button className="btn btn-primary" onClick={saveStore}>
              Salvar configurações
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Senha do painel</h2>
        </div>
        <div className="form">
          <div className="form-grid">
            <label className="field">
              <span className="label">Senha atual</span>
              <input
                type="password"
                className="input"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              />
            </label>
            <label className="field">
              <span className="label">Nova senha</span>
              <input
                type="password"
                className="input"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              />
            </label>
          </div>
          <div className="panel-actions">
            <button className="btn btn-soft" onClick={changePassword}>
              Alterar senha
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Backup e dados</h2>
        </div>
        <div className="backup-grid">
          <div className="backup-card">
            <h3>Exportar</h3>
            <p className="muted small">
              Baixe um arquivo com produtos, banners, pedidos e configurações.
            </p>
            <button className="btn btn-soft" onClick={exportData}>
              Baixar backup (.json)
            </button>
          </div>

          <div className="backup-card">
            <h3>Importar</h3>
            <p className="muted small">Restaure os dados a partir de um backup.</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                if (e.target.files[0]) importData(e.target.files[0])
                e.target.value = ''
              }}
            />
            <button className="btn btn-soft" onClick={() => fileRef.current?.click()}>
              Selecionar arquivo
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
