import { useState } from 'react'
import { Search, Droplets, Sprout, Bug, ChevronDown, ChevronUp, Lightbulb, Shield, Check, CalendarDays } from 'lucide-react'
import { plants, categories } from '../data/plants'
import PlantTimeline from '../components/PlantTimeline'

export default function Plants() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('всички')

  const filtered = plants.filter(p => {
    const matchCat = category === 'всички' || p.category === category
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div>
      <h1 style={{ color: '#1E3A2F' }}>Растения</h1>
      <p className="text-sm mt-0.5 mb-4" style={{ color: '#6A9E78' }}>
        {plants.length} вида с данни за торене и поливане
      </p>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#B3D9C4' }} />
        <input
          type="text"
          placeholder="Търси растение..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
          style={{ border: '1px solid #B3D9C4', background: '#fff', color: '#1C2B23' }}
        />
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
            style={{
              background: category === c ? '#4A7C59' : '#fff',
              color: category === c ? '#fff' : '#6A9E78',
              border: `1px solid ${category === c ? '#4A7C59' : '#B3D9C4'}`,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
        {filtered.map(plant => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm lg:col-span-2" style={{ color: '#9CA3AF' }}>Няма намерени растения</p>
        )}
      </div>
    </div>
  )
}

const tabDefs = [
  { id: 'water', label: 'Поливане', Icon: Droplets, active: { background: '#EFF8FF', color: '#2563EB' } },
  { id: 'fertilize', label: 'Торене', Icon: Sprout, active: { background: '#E8F5F0', color: '#1E5C3A' } },
  { id: 'pest', label: 'Защита', Icon: Bug, active: { background: '#FDF3DC', color: '#7A4A00' } },
  { id: 'calendar', label: 'Календар', Icon: CalendarDays, active: { background: '#EDE4F5', color: '#4A2A6B' } },
]

function PlantCard({ plant }) {
  const [tab, setTab] = useState('water')
  const [open, setOpen] = useState(false)
  const { fertilizing: f, watering: w } = plant
  const visibleTabs = plant.calendar ? tabDefs : tabDefs.filter(t => t.id !== 'calendar')

  const freqLabel = f.frequency_days === 0
    ? 'Не се тори (по нужда)'
    : f.frequency_days === 365
    ? 'Веднъж годишно'
    : f.frequency_days === 1
    ? 'Всеки ден'
    : `На ${f.frequency_days} дни`

  const waterLabel = w.frequency_days === 1
    ? 'Всеки ден'
    : `На ${w.frequency_days} дни`

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-2xl leading-none">{plant.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color: '#1C2B23' }}>{plant.name}</div>
          <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: '#9CA3AF' }}>
            <span className="flex items-center gap-1"><Droplets size={11} /> {waterLabel}</span>
            <span className="flex items-center gap-1"><Sprout size={11} /> {freqLabel}</span>
          </div>
        </div>
        {open
          ? <ChevronUp size={16} style={{ color: '#B3D9C4' }} />
          : <ChevronDown size={16} style={{ color: '#B3D9C4' }} />}
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #F0EBE3' }}>
          <div className="flex" style={{ borderBottom: '1px solid #F0EBE3' }}>
            {visibleTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                style={tab === t.id ? t.active : { color: '#9CA3AF' }}
              >
                <t.Icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'water' && (
            <div className="p-4" style={{ background: '#F8FBFE' }}>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Info label="Честота" value={waterLabel} />
                <Info label="Количество" value={w.amount} />
              </div>
              <Note Icon={Lightbulb} text={w.notes} />
            </div>
          )}

          {tab === 'fertilize' && (
            <div className="p-4" style={{ background: '#F7FBF8' }}>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Info label="Честота" value={freqLabel} />
                <Info label="Сезон" value={f.seasons.join(', ')} />
                <Info label="Тор" value={f.fertilizer_type} />
                <Info label="Доза" value={f.dose} />
              </div>
              <Note Icon={Lightbulb} text={f.notes} />
            </div>
          )}

          {tab === 'pest' && (
            <div className="p-4" style={{ background: '#FDFAF3' }}>
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#7A4A00' }}>Чести проблеми</div>
                <div className="flex flex-wrap gap-1.5">
                  {plant.pest_control.pests.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full"
                      style={{ background: '#FDF3DC', color: '#7A4A00' }}>{p}</span>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#1E5C3A' }}>Натурални методи</div>
                <div className="space-y-1.5">
                  {plant.pest_control.natural.map((n, i) => (
                    <div key={i} className="rounded-xl px-3 py-2 text-xs flex items-start gap-1.5"
                      style={{ background: '#fff', border: '1px solid #E8E3D9', color: '#1C2B23' }}>
                      <Check size={12} className="shrink-0 mt-0.5" style={{ color: '#4A7C59' }} /> {n}
                    </div>
                  ))}
                </div>
              </div>
              <Note Icon={Shield} text={plant.pest_control.prevention} />
            </div>
          )}

          {tab === 'calendar' && plant.calendar && (
            <div className="p-4" style={{ background: '#FBF9FD' }}>
              <PlantTimeline calendar={plant.calendar} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: '#fff', border: '1px solid #E8E3D9' }}>
      <div className="text-xs" style={{ color: '#9CA3AF' }}>{label}</div>
      <div className="font-medium text-xs mt-0.5" style={{ color: '#1C2B23' }}>{value}</div>
    </div>
  )
}

function Note({ Icon, text }) {
  return (
    <div className="text-xs rounded-xl p-3 flex items-start gap-2"
      style={{ background: '#fff', border: '1px solid #E8E3D9', color: '#1C2B23' }}>
      <Icon size={13} className="shrink-0 mt-0.5" style={{ color: '#C97D0E' }} />
      <span>{text}</span>
    </div>
  )
}
