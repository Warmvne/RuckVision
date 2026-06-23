import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Film, BarChart2, Users, Zap } from 'lucide-react'
import MatchList from './pages/MatchList'
import ReviewPage from './pages/ReviewPage'
import DashboardPage from './pages/DashboardPage'
import TeamsPage from './pages/TeamsPage'

const NAV = [
  { to: '/',          icon: Film,     label: 'Matchs',   end: true },
  { to: '/teams',     icon: Users,    label: 'Équipes'            },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard'         },
]

export default function App() {
  const location = useLocation()
  const isReview = location.pathname.includes('/review')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {!isReview && (
        <aside style={{
          width: 72, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '24px 0', gap: 4,
          flexShrink: 0, background: 'var(--bg-2)',
          borderRight: '1px solid var(--border)', zIndex: 10,
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg, var(--green), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--green-glow)',
            }}>
              <Zap size={17} fill="var(--bg)" stroke="var(--bg)" />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--t3)', textTransform: 'uppercase' }}>RUCK</span>
          </div>

          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                position: 'relative',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, textDecoration: 'none',
                transition: 'all 0.2s',
                background: isActive ? 'var(--green-soft)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(0,229,160,0.3)' : 'transparent'}`,
                color: isActive ? 'var(--green)' : 'var(--t3)',
                boxShadow: isActive ? '0 0 16px var(--green-glow)' : 'none',
              })}>
              {({ isActive }) => (
                <div style={{ position: 'relative' }}
                  onMouseEnter={e => {
                    const tip = e.currentTarget.querySelector('.tip')
                    if (tip) tip.style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    const tip = e.currentTarget.querySelector('.tip')
                    if (tip) tip.style.opacity = '0'
                  }}>
                  <Icon size={18} />
                  <span className="tip" style={{
                    position: 'absolute', left: 26, top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '5px 10px', borderRadius: 8,
                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                    fontSize: 12, fontWeight: 500, color: 'var(--t1)',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                    opacity: 0, transition: 'opacity 0.15s', zIndex: 50,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}>{label}</span>
                </div>
              )}
            </NavLink>
          ))}

          <div style={{ marginTop: 'auto', width: 20, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--green), transparent)' }} />
        </aside>
      )}

      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Routes>
          <Route path="/"                    element={<MatchList />}     />
          <Route path="/match/:id/review"    element={<ReviewPage />}    />
          <Route path="/match/:id/dashboard" element={<DashboardPage />} />
          <Route path="/teams"               element={<TeamsPage />}     />
          <Route path="/dashboard"           element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  )
}
