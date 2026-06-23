import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Film, BarChart2, Users, Zap } from 'lucide-react'
import MatchList from './pages/MatchList'
import ReviewPage from './pages/ReviewPage'
import DashboardPage from './pages/DashboardPage'
import TeamsPage from './pages/TeamsPage'

const NAV = [
  { to: '/', icon: Film, label: 'Matchs', end: true },
  { to: '/teams', icon: Users, label: 'Équipes' },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
]

export default function App() {
  const location = useLocation()
  const isReview = location.pathname.includes('/review')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--navy)' }}>
      {/* Sidebar */}
      {!isReview && (
        <aside className="w-20 flex flex-col items-center py-8 gap-2 shrink-0 relative z-10"
          style={{ background: 'var(--navy-2)', borderRight: '1px solid var(--glass-border)' }}>

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00e676, #00b0ff)', boxShadow: '0 0 20px rgba(0,230,118,0.4)' }}>
              <Zap size={18} fill="white" stroke="white" />
            </div>
          </div>

          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              title={label}
              className={({ isActive }) => [
                'w-12 h-12 flex flex-col items-center justify-center rounded-xl gap-1 transition-all duration-200 group relative',
                isActive
                  ? 'text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
              style={({ isActive }) => isActive ? {
                background: 'var(--green-glow)',
                border: '1px solid rgba(0,230,118,0.3)',
                boxShadow: '0 0 16px rgba(0,230,118,0.2)',
              } : {}}>
              {({ isActive }) => (
                <>
                  <Icon size={18} style={isActive ? { color: 'var(--green)' } : {}} />
                  {/* Tooltip */}
                  <span className="absolute left-16 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                    style={{ background: 'var(--navy-3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Bottom glow line */}
          <div className="mt-auto w-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--green), transparent)' }} />
        </aside>
      )}

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<MatchList />} />
          <Route path="/match/:id/review" element={<ReviewPage />} />
          <Route path="/match/:id/dashboard" element={<DashboardPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  )
}
