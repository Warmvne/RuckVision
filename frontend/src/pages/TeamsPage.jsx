import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Users, BarChart2 } from 'lucide-react'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [teamStats, setTeamStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.getTeams().then(setTeams)
  }, [])

  const handleTeamClick = async (team) => {
    setSelectedTeam(team)
    const stats = await api.getTeamStats(team.id)
    setTeamStats(stats)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <Users size={24} /> Équipes
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">Toutes les équipes</h2>
          <div className="space-y-2">
            {teams.map(t => (
              <button key={t.id} onClick={() => handleTeamClick(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                  selectedTeam?.id === t.id
                    ? 'bg-rugby-green/20 border-rugby-green text-white'
                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: t.color }} />
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.short_name}</p>
                  </div>
                </div>
              </button>
            ))}
            {teams.length === 0 && (
              <p className="text-gray-600 text-sm">Aucune équipe. Importez des matchs pour créer des équipes.</p>
            )}
          </div>
        </div>

        <div className="col-span-2">
          {teamStats && selectedTeam ? (
            <div>
              <h2 className="text-white font-semibold text-lg mb-4">{selectedTeam.name}</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-500 text-sm">Matchs</p>
                  <p className="text-2xl font-bold text-white">{teamStats.match_count}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-500 text-sm">Possession moy.</p>
                  <p className="text-2xl font-bold text-white">{Math.round(teamStats.avg_possession_seconds / 60)} min</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-500 text-sm">Phases totales</p>
                  <p className="text-2xl font-bold text-white">
                    {Object.values(teamStats.phase_totals).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <h3 className="text-gray-300 text-sm font-medium mb-3">Phases jouées</h3>
                <div className="space-y-2">
                  {Object.entries(teamStats.phase_totals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([phase, count]) => {
                      const max = Math.max(...Object.values(teamStats.phase_totals))
                      return (
                        <div key={phase} className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm w-24 capitalize">{phase.replace('_', ' ')}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className="bg-rugby-green h-2 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                          <span className="text-white text-sm w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">
              <p>Sélectionnez une équipe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
