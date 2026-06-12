import { Routes, Route, NavLink } from 'react-router-dom'
import { Film, BarChart2, Users } from 'lucide-react'
import MatchList from './pages/MatchList'
import ReviewPage from './pages/ReviewPage'
import DashboardPage from './pages/DashboardPage'
import TeamsPage from './pages/TeamsPage'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <nav className="w-16 bg-rugby-green flex flex-col items-center py-6 gap-6 shrink-0">
        <div className="text-rugby-gold font-bold text-xl">RA</div>
        <NavLink to="/" end title="Matchs"
          className={({ isActive }) => `p-3 rounded-xl ${isActive ? 'bg-rugby-light text-white' : 'text-green-300 hover:text-white'}`}>
          <Film size={22} />
        </NavLink>
        <NavLink to="/teams" title="Équipes"
          className={({ isActive }) => `p-3 rounded-xl ${isActive ? 'bg-rugby-light text-white' : 'text-green-300 hover:text-white'}`}>
          <Users size={22} />
        </NavLink>
        <NavLink to="/dashboard" title="Dashboard"
          className={({ isActive }) => `p-3 rounded-xl ${isActive ? 'bg-rugby-light text-white' : 'text-green-300 hover:text-white'}`}>
          <BarChart2 size={22} />
        </NavLink>
      </nav>

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
