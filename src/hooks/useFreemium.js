import { useAuth } from './useAuth'
import { useGarden } from './useGarden'

const LIMITS = {
  free: { plants: 3, analysisPerMonth: 20 },
  premium: { plants: Infinity, analysisPerMonth: 50 },
  admin: { plants: Infinity, analysisPerMonth: Infinity },
}

export function useFreemium() {
  const { user, profile } = useAuth()
  const { plants } = useGarden(user?.uid)

  const role = profile?.role || 'free'
  const limits = LIMITS[role] || LIMITS.free

  const currentMonth = new Date().toISOString().slice(0, 7)
  const analysisThisMonth = profile?.analysisMonth === currentMonth
    ? (profile?.analysisCount || 0)
    : 0

  const canAddPlant = plants.length < limits.plants
  const canAnalyze = analysisThisMonth < limits.analysisPerMonth
  const analysisRemaining = Math.max(0, limits.analysisPerMonth - analysisThisMonth)

  return { canAddPlant, canAnalyze, analysisRemaining, role, limits }
}
