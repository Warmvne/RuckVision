import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Film, BarChart2, Users, Zap } from 'lucide-react'
import MatchList from './pages/MatchList'
import ReviewPage from './pages/ReviewPage'
import DashboardPage from './pages/DashboardPage'
import TeamsPage from './pages/TeamsPage'

const NAV = [
  { to: '/', icon: Film,     label: 'Matchs',    end: true },
  { to: '/teams',     icon: Users,     label: 'Équipes'           },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard'         },
]

export default function App() {
  const location = useLocation()
  const isReview = location.pathname.includes('/review')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--navy)' }}>

      {/* ── Sidebar ── */}
      {!isReview && (
        <aside style={{
          width: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 0',
          gap: 6,
          flexShrink: 0,
          background: 'var(--navy-2)',
          borderRight: '1px solid var(--glass-border)',
          position: 'relative',
          zIndex: 10,
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--green), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px var(--green-glow), 0 0 60px rgba(0,255,136,0.05)',
            }}>
              <Zap size={18} fill="var(--navy)" stroke="var(--navy)" />
            </div>
          </div>

          {/* Nav items */}
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} title={label}
              style={({ isActive }) => ({
                width: 44, height: 44,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
                ...(isActive ? {
                  background: 'var(--green-glow)',
                  border: '1px solid rgba(0,255,136,0.25)',
                  boxShadow: '0 0 16px rgba(0,255,136,0.15)',
                  color: 'var(--green)',
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: 'var(--text-muted)',
                }),
              })}>
              {({ isActive }) => (
                <div className="group" style={{ position: 'relative' }}>
                  <Icon size={18} />
                  {/* Tooltip */}
                  <span style={{
                    position: 'absolute',
                    left: 28, top: '50%', transform: 'translateY(-50%)',
                    padding: '4px 10px',
                    background: 'var(--navy-3)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 8,
                    fontSize: 12, fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    zIndex: 50,
                  }}
                    className="nav-tooltip">
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}

          {/* Bottom accent line */}
          <div style={{
            marginTop: 'auto',
            width: 24, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--green), transparent)',
          }} />
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

      {/* Global tooltip CSS */}
      <style>{`
        a:hover .nav-tooltip { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
