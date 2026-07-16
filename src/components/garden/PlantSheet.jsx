import { Droplets, LogOut, X } from 'lucide-react'

function waterLabel(entry, today) {
  if (entry.nextWatering <= today) return { text: 'Чака поливане!', color: '#C97D0E' }
  const days = Math.round((new Date(entry.nextWatering) - new Date(today)) / 86400000)
  return { text: days === 1 ? 'Поливане утре' : `Поливане след ${days} дни`, color: '#6A9E78' }
}

// Bottom sheet: actions for a planted entry.
export default function PlantSheet({ entry, bedName, today, onWater, onUnassign, onClose }) {
  const status = waterLabel(entry, today)
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center"
      style={{ background: 'rgba(20,30,25,0.45)' }} onClick={onClose}>
      <div className="sheet-up w-full lg:max-w-sm rounded-t-3xl lg:rounded-3xl p-5"
        style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{entry.emoji}</span>
          <div className="flex-1">
            <h2 style={{ color: '#1E3A2F' }}>{entry.name}</h2>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>в „{bedName}“</p>
          </div>
          <button onClick={onClose} aria-label="Затвори"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F5F2EC', color: '#6A9E78' }}>
            <X size={16} />
          </button>
        </div>
        <p className="text-sm mb-4 font-medium" style={{ color: status.color }}>{status.text}</p>

        <div className="flex gap-2">
          <button onClick={() => onWater(entry.uid)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#3B82F6', color: '#fff' }}>
            <Droplets size={15} /> Полей
          </button>
          <button onClick={() => onUnassign(entry.uid)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#F5F2EC', color: '#1C2B23' }}>
            <LogOut size={15} /> Извади от лехата
          </button>
        </div>
      </div>
    </div>
  )
}
