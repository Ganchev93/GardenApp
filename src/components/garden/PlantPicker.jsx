import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { plants as catalog } from '../../data/plants'
import { companionHints } from '../../lib/companions'

const catalogById = Object.fromEntries(catalog.map(p => [p.id, p]))

function HintChips({ hints }) {
  if (!hints.good.length && !hints.bad.length) return null
  return (
    <span className="flex flex-wrap gap-1 mt-0.5">
      {hints.good.map(n => (
        <span key={n} className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: '#D4EDE0', color: '#1E5C3A' }}>✓ {n}</span>
      ))}
      {hints.bad.map(n => (
        <span key={n} className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: '#FDE8E8', color: '#B03A2E' }}>⚠ {n}</span>
      ))}
    </span>
  )
}

// Bottom sheet: pick a plant for a bed cell — unassigned garden plants first, then catalog.
export default function PlantPicker({ bed, bedEntries, unassigned, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()

  const ownMatches = unassigned.filter(p => p.name.toLowerCase().includes(q)).slice(0, 4)
  const catMatches = catalog.filter(p => p.name.toLowerCase().includes(q)).slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center"
      style={{ background: 'rgba(20,30,25,0.45)' }} onClick={onClose}>
      <div className="sheet-up w-full lg:max-w-md max-h-[70vh] rounded-t-3xl lg:rounded-3xl p-5 overflow-y-auto"
        style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ color: '#1E3A2F' }}>Засади в „{bed.name}“</h2>
          <button onClick={onClose} aria-label="Затвори"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F5F2EC', color: '#6A9E78' }}>
            <X size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#B3D9C4' }} />
          <input type="text" placeholder="Търси растение..." value={query} autoFocus
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
            style={{ border: '1px solid #D4EDE0', background: '#F5F2EC', color: '#1C2B23' }} />
        </div>

        {ownMatches.length > 0 && (
          <>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>ОТ ГРАДИНАТА ТИ</p>
            {ownMatches.map(p => (
              <PickRow key={`own-${p.uid}`} emoji={p.emoji} name={p.name}
                hints={companionHints(catalogById[p.plantId], bedEntries, catalogById)}
                badge="премести тук"
                onClick={() => onPick({ type: 'assign', entry: p })} />
            ))}
            <div className="h-px my-2" style={{ background: '#F0EBE3' }} />
          </>
        )}

        <p className="text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>НОВО РАСТЕНИЕ</p>
        {catMatches.map(p => (
          <PickRow key={p.id} emoji={p.emoji} name={p.name}
            hints={companionHints(p, bedEntries, catalogById)}
            onClick={() => onPick({ type: 'new', plant: p })} />
        ))}
        {catMatches.length === 0 && (
          <p className="text-sm py-3 text-center" style={{ color: '#9CA3AF' }}>Няма намерени растения</p>
        )}
      </div>
    </div>
  )
}

function PickRow({ emoji, name, hints, badge, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F5F2EC]">
      <span className="text-xl leading-none mt-0.5">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: '#1C2B23' }}>{name}</span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: '#EDE4F5', color: '#4A2A6B' }}>{badge}</span>
          )}
        </span>
        <HintChips hints={hints} />
      </span>
    </button>
  )
}
