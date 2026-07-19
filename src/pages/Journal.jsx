import { useState } from 'react'
import { ShoppingBasket, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useHarvests } from '../hooks/useHarvests'

export default function Journal() {
  const { user } = useAuth()
  const { harvests, removeHarvest, loading } = useHarvests(user?.uid)
  const [confirmId, setConfirmId] = useState(null)

  if (loading) return <div className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Зареждане...</div>

  const totals = {}
  harvests.forEach(h => {
    const key = `${h.name}|${h.unit}`
    totals[key] = (totals[key] || 0) + h.amount
  })

  return (
    <div>
      <h1 style={{ color: '#1E3A2F' }}>Дневник</h1>
      <p className="text-sm mt-0.5 mb-4" style={{ color: '#6A9E78' }}>{harvests.length} записа за реколта</p>

      {harvests.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
          <ShoppingBasket size={32} className="mx-auto mb-3" style={{ color: '#B3D9C4' }} />
          <p className="font-semibold" style={{ color: '#1C2B23' }}>Още няма записана реколта</p>
          <p className="text-sm mt-1" style={{ color: '#6A9E78' }}>Записвай от картата на растението в "Градина"</p>
        </div>
      )}

      {Object.keys(totals).length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.entries(totals).map(([key, total]) => {
            const [name, unit] = key.split('|')
            return (
              <span key={key} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ background: '#D4EDE0', color: '#1E3A2F' }}>
                {name}: {total} {unit}
              </span>
            )
          })}
        </div>
      )}

      <div className="grid gap-2 lg:grid-cols-2 lg:items-start">
        {harvests.map(h => (
          <div key={h.id} className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
            <span className="text-xl leading-none">{h.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: '#1C2B23' }}>{h.name}</div>
              {h.note && <div className="text-xs" style={{ color: '#9CA3AF' }}>{h.note}</div>}
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold" style={{ color: '#4A7C59' }}>{h.amount} {h.unit}</div>
              <div className="text-xs" style={{ color: '#9CA3AF' }}>{h.date.toDate().toLocaleDateString('bg-BG')}</div>
            </div>
            {confirmId === h.id ? (
              <button onClick={() => { removeHarvest(h.id); setConfirmId(null) }}
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold shrink-0"
                style={{ background: '#E74C3C', color: '#fff' }}>
                Изтрий?
              </button>
            ) : (
              <button onClick={() => setConfirmId(h.id)} aria-label="Изтрий записа"
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
