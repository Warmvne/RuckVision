const BASE = ''

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  // Matches
  getMatches: () => req('/matches/'),
  getMatch: (id) => req(`/matches/${id}`),
  deleteMatch: (id) => req(`/matches/${id}`, { method: 'DELETE' }),
  analyzeMatch: (id) => req(`/matches/${id}/analyze`, { method: 'POST' }),
  uploadMatch: (formData) => req('/matches/', { method: 'POST', body: formData }),

  // Segments
  getSegments: (matchId) => req(`/segments/match/${matchId}`),
  createSegment: (data) => req('/segments/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  updateSegment: (id, data) => req(`/segments/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  validateSegment: (id) => req(`/segments/${id}/validate`, { method: 'PATCH' }),
  rejectSegment: (id) => req(`/segments/${id}/reject`, { method: 'PATCH' }),
  splitSegment: (id, splitTime) => req(`/segments/${id}/split?split_time=${splitTime}`, { method: 'POST' }),
  deleteSegment: (id) => req(`/segments/${id}`, { method: 'DELETE' }),

  // Stats
  getMatchStats: (id) => req(`/stats/match/${id}`),
  getTeamStats: (id) => req(`/stats/team/${id}`),
  getTeams: () => req('/stats/teams'),
}
