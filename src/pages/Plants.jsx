import { useState } from 'react'
import { plants, categories } from '../data/plants'

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
      <h1 className="text-2xl font-bold text-green-800 mb-1">Растения</h1>
      <p className="text-gray-500 mb-4 text-sm">{plants.length} вида с данни за торене и поливане</p>

      <input
        type="text"
        placeholder="Търси растение..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
      />

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              category === c
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-green-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map(plant => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">Няма намерени растения</p>
        )}
      </div>
    </div>
  )
}

function PlantCard({ plant }) {
  const [tab, setTab] = useState('water')
  const [open, setOpen] = useState(false)
  const { fertilizing: f, watering: w } = plant

  const freqLabel = f.frequency_days === 365
    ? 'Веднъж годишно'
    : f.frequency_days === 1
    ? 'Всеки ден'
    : `На ${f.frequency_days} дни`

  const waterLabel = w.frequency_days === 1
    ? 'Всеки ден'
    : `На ${w.frequency_days} дни`

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors text-left"
      >
        <span className="text-2xl">{plant.emoji}</span>
        <div className="flex-1">
          <div className="font-semibold text-gray-800">{plant.name}</div>
          <div className="text-xs text-gray-400 capitalize flex gap-2">
            <span>💧 {waterLabel}</span>
            <span>·</span>
            <span>🌱 {freqLabel}</span>
          </div>
        </div>
        <span className="text-gray-300 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('water')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === 'water' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-400' : 'text-gray-500'
              }`}
            >
              💧 Поливане
            </button>
            <button
              onClick={() => setTab('fertilize')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === 'fertilize' ? 'bg-green-50 text-green-600 border-b-2 border-green-500' : 'text-gray-500'
              }`}
            >
              🌱 Торене
            </button>
            <button
              onClick={() => setTab('pest')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === 'pest' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-400' : 'text-gray-500'
              }`}
            >
              🐛 Защита
            </button>
          </div>

          {tab === 'water' && (
            <div className="p-4 bg-blue-50">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Info label="Честота" value={waterLabel} color="blue" />
                <Info label="Количество" value={w.amount} color="blue" />
              </div>
              <div className="text-xs text-gray-600 bg-white rounded-xl p-3 border border-blue-100">
                💡 {w.notes}
              </div>
            </div>
          )}

          {tab === 'fertilize' && (
            <div className="p-4 bg-green-50">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Info label="Честота" value={freqLabel} color="green" />
                <Info label="Сезон" value={f.seasons.join(', ')} color="green" />
                <Info label="Тор" value={f.fertilizer_type} color="green" />
                <Info label="Доза" value={f.dose} color="green" />
              </div>
              <div className="text-xs text-gray-600 bg-white rounded-xl p-3 border border-green-100">
                💡 {f.notes}
              </div>
            </div>
          )}

          {tab === 'pest' && (
            <div className="p-4 bg-orange-50">
              <div className="mb-3">
                <div className="text-xs font-semibold text-orange-700 mb-1.5">Чести проблеми</div>
                <div className="flex flex-wrap gap-1.5">
                  {plant.pest_control.pests.map((p, i) => (
                    <span key={i} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-semibold text-green-700 mb-1.5">🌿 Натурални методи</div>
                <div className="space-y-1.5">
                  {plant.pest_control.natural.map((n, i) => (
                    <div key={i} className="bg-white rounded-xl px-3 py-2 text-xs text-gray-700 border border-orange-100">
                      ✓ {n}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-600 bg-white rounded-xl p-3 border border-orange-100">
                🛡️ {plant.pest_control.prevention}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Info({ label, value, color }) {
  const colors = {
    green: 'border-green-100',
    blue: 'border-blue-100',
  }
  return (
    <div className={`bg-white rounded-xl p-2.5 border ${colors[color]}`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-gray-700 font-medium text-xs mt-0.5">{value}</div>
    </div>
  )
}
