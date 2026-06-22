import { FormEvent, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import type { Admin, AdminScore, DashboardSummary, PanelSettings, PricingSettings, SalesPoint } from './types'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◇' },
  { path: '/sales', label: 'Sales Status', icon: '↗' },
  { path: '/leaderboard', label: 'Admin Leaderboard', icon: '★' },
  { path: '/pricing', label: 'Price & Variable Settings', icon: '◌' },
  { path: '/panel', label: 'Panel & Telegram Bot Settings', icon: '⚙' },
]

function formatMoney(value: number, currency = 'IRR') {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value) + ` ${currency}`
}

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || '/')
  useEffect(() => {
    const sync = () => setRoute(window.location.hash.replace('#', '') || '/')
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  return route
}

function App() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    api.session()
      .then((res) => setAdmin(res.admin))
      .catch(() => setAdmin(null))
      .finally(() => setBooting(false))
  }, [])

  if (booting) {
    return <div className="boot-screen"><div className="loader" /> RetroPanel</div>
  }

  if (!admin) {
    return <LoginScreen onLogin={setAdmin} />
  }

  return <Shell admin={admin} onLogout={() => setAdmin(null)} />
}

function LoginScreen({ onLogin }: { onLogin: (admin: Admin) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('ChangeMe123!')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.login(username, password)
      onLogin(res.admin)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">R</div>
        <p className="eyebrow">Accounting Control Panel</p>
        <h1>Sign in to RetroPanel</h1>
        <p className="muted">A private workspace for revenue tracking, pricing controls, and operator reporting.</p>
        <form onSubmit={submit} className="form-stack">
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button disabled={busy}>{busy ? 'Checking…' : 'Login'}</button>
        </form>
      </section>
    </main>
  )
}

function Shell({ admin, onLogout }: { admin: Admin; onLogout: () => void }) {
  const route = useHashRoute()

  async function logout() {
    await api.logout().catch(() => undefined)
    onLogout()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">R</div>
          <div>
            <strong>RetroPanel</strong>
            <span>Accounting Suite</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <a key={item.path} className={route === item.path ? 'active' : ''} href={`#${item.path}`}>
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>Signed in as</span>
          <strong>{admin.displayName || admin.username}</strong>
          <button className="ghost-button" onClick={logout}>Logout</button>
        </div>
      </aside>
      <section className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live workspace</p>
            <h2>{navItems.find((item) => item.path === route)?.label || 'Dashboard'}</h2>
          </div>
          <div className="topbar-pill">/opt/retropanel · /var/lib/retropanel</div>
        </header>
        {route === '/' && <DashboardPage />}
        {route === '/sales' && <SalesStatusPage />}
        {route === '/leaderboard' && <AdminLeaderboardPage />}
        {route === '/pricing' && <PricingSettingsPage />}
        {route === '/panel' && <PanelSettingsPage />}
      </section>
    </div>
  )
}

function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  useEffect(() => { api.dashboard().then(setData) }, [])

  if (!data) return <PageLoading />

  return (
    <div className="page-grid">
      <MetricCard label="Gross Sales" value={formatMoney(data.grossSales, data.currency)} detail="Recorded sales volume" />
      <MetricCard label="Net Revenue" value={formatMoney(data.netRevenue, data.currency)} detail="After discounts and fees" />
      <MetricCard label="Open Invoices" value={String(data.openInvoices)} detail="Need collection follow-up" />
      <MetricCard label="Conversion Rate" value={`${data.conversionRate}%`} detail="Lead to paid customer" />
      <section className="panel-card wide">
        <div className="section-heading">
          <h3>Accounting Snapshot</h3>
          <span>Last reconciliation: {new Date(data.lastReconciledAt).toLocaleString()}</span>
        </div>
        <div className="statement-row"><span>Active admins</span><strong>{data.activeAdmins}</strong></div>
        <div className="statement-row"><span>Database path</span><code>/var/lib/retropanel/retropanel.db</code></div>
        <div className="statement-row"><span>Project root</span><code>/opt/retropanel</code></div>
      </section>
    </div>
  )
}

function SalesStatusPage() {
  const [items, setItems] = useState<SalesPoint[]>([])
  useEffect(() => { api.sales().then((res) => setItems(res.items)) }, [])
  const max = useMemo(() => Math.max(...items.map((item) => item.amount), 1), [items])

  return (
    <section className="panel-card wide">
      <div className="section-heading">
        <h3>Sales Status</h3>
        <span>Temporary visual overview</span>
      </div>
      <div className="bar-list">
        {items.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track"><div style={{ width: `${(item.amount / max) * 100}%` }} /></div>
            <strong>{formatMoney(item.amount)}</strong>
            <em>{item.orders} orders</em>
          </div>
        ))}
      </div>
    </section>
  )
}

function AdminLeaderboardPage() {
  const [items, setItems] = useState<AdminScore[]>([])
  useEffect(() => { api.leaderboard().then((res) => setItems(res.items)) }, [])

  return (
    <section className="panel-card wide">
      <div className="section-heading">
        <h3>Admin Leaderboard</h3>
        <span>Performance placeholder</span>
      </div>
      <table>
        <thead><tr><th>Rank</th><th>Admin</th><th>Closed Deals</th><th>Revenue</th><th>Collection</th></tr></thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.adminId}>
              <td>#{index + 1}</td>
              <td>{item.displayName}</td>
              <td>{item.closedDeals}</td>
              <td>{formatMoney(item.revenue)}</td>
              <td>{item.collectionPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function PricingSettingsPage() {
  const [data, setData] = useState<PricingSettings | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => { api.pricing().then(setData) }, [])
  if (!data) return <PageLoading />

  function update<K extends keyof PricingSettings>(key: K, value: PricingSettings[K]) {
    setData((current) => current ? { ...current, [key]: value } : current)
    setSaved(false)
  }

  async function save() {
    const next = await api.savePricing(data)
    setData(next)
    setSaved(true)
  }

  return (
    <section className="panel-card wide settings-form">
      <div className="section-heading">
        <h3>Price & Variable Settings</h3>
        <span>Values are stored in the backend database file</span>
      </div>
      <div className="form-grid">
        <label>Currency<input value={data.currency} onChange={(e) => update('currency', e.target.value)} /></label>
        <label>Base Plan Price<input type="number" value={data.basePlanPrice} onChange={(e) => update('basePlanPrice', Number(e.target.value))} /></label>
        <label>Renewal Discount %<input type="number" value={data.renewalDiscountPct} onChange={(e) => update('renewalDiscountPct', Number(e.target.value))} /></label>
        <label>Tax %<input type="number" value={data.taxPct} onChange={(e) => update('taxPct', Number(e.target.value))} /></label>
        <label>Commission %<input type="number" value={data.commissionPct} onChange={(e) => update('commissionPct', Number(e.target.value))} /></label>
      </div>
      <div className="variable-box">
        {Object.entries(data.variables).map(([key, value]) => (
          <div key={key}><code>{key}</code><input value={value} onChange={(e) => update('variables', { ...data.variables, [key]: e.target.value })} /></div>
        ))}
      </div>
      <button onClick={save}>Save pricing settings</button>
      {saved && <span className="save-note">Saved.</span>}
    </section>
  )
}

function PanelSettingsPage() {
  const [data, setData] = useState<PanelSettings | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => { api.panel().then(setData) }, [])
  if (!data) return <PageLoading />

  function update<K extends keyof PanelSettings>(key: K, value: PanelSettings[K]) {
    setData((current) => current ? { ...current, [key]: value } : current)
    setSaved(false)
  }

  async function save() {
    const next = await api.savePanel(data)
    setData(next)
    setSaved(true)
  }

  return (
    <section className="panel-card wide settings-form">
      <div className="section-heading">
        <h3>Panel & Telegram Bot Settings</h3>
        <span>Temporary configuration surface</span>
      </div>
      <div className="form-grid">
        <label>Panel Name<input value={data.panelName} onChange={(e) => update('panelName', e.target.value)} /></label>
        <label>Public Base URL<input value={data.publicBaseUrl} onChange={(e) => update('publicBaseUrl', e.target.value)} /></label>
        <label>Telegram Bot Token<input value={data.telegramBotToken} onChange={(e) => update('telegramBotToken', e.target.value)} /></label>
        <label>Telegram Admin Chat<input value={data.telegramAdminChat} onChange={(e) => update('telegramAdminChat', e.target.value)} /></label>
      </div>
      <label className="toggle-row"><input type="checkbox" checked={data.dailyReportEnabled} onChange={(e) => update('dailyReportEnabled', e.target.checked)} /> Enable daily Telegram accounting report</label>
      <button onClick={save}>Save panel settings</button>
      {saved && <span className="save-note">Saved.</span>}
    </section>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <section className="panel-card metric"><span>{label}</span><strong>{value}</strong><p>{detail}</p></section>
}

function PageLoading() {
  return <div className="page-loading"><div className="loader" /> Loading</div>
}

export default App
