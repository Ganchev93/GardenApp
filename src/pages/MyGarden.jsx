import { useState, useEffect, useRef } from 'react'
import { plants } from '../data/plants'

const STORAGE_KEY = 'my_garden_plants'

function loadGarden() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function saveGarden(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function MyGarden() {
  const [myPlants, setMyPlants] = useState(loadGarden)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [lastWatered, setLastWatered] = useState(new Date().toISOString().slice(0, 10))
  const [lastFertilized, setLastFertilized] = useState(new Date().toISOString().slice(0, 10))
  const [activeTab, setActiveTab] = useState('water')
  const [photoView, setPhotoView] = useState(null)

  useEffect(() => { saveGarden(myPlants) }, [myPlants])

  function addPlant() {
    if (!selectedId) return
    const plant = plants.find(p => p.id === Number(selectedId))
    if (!plant) return
    setMyPlants(prev => [...prev, {
      uid: Date.now(),
      plantId: plant.id,
      name: plant.name,
      emoji: plant.emoji,
      category: plant.category,
      lastWatered,
      nextWatering: addDays(lastWatered, plant.watering.frequency_days),
      watering_frequency_days: plant.watering.frequency_days,
      watering_amount: plant.watering.amount,
      lastFertilized,
      nextFertilizing: addDays(lastFertilized, plant.fertilizing.frequency_days),
      frequency_days: plant.fertilizing.frequency_days,
      fertilizer_type: plant.fertilizing.fertilizer_type,
      dose: plant.fertilizing.dose,
    }])
    setShowAdd(false)
    setSelectedId('')
  }

  function markWatered(uid) {
    const today = new Date().toISOString().slice(0, 10)
    setMyPlants(prev => prev.map(p => p.uid !== uid ? p : {
      ...p,
      lastWatered: today,
      nextWatering: addDays(today, p.watering_frequency_days),
    }))
  }

  function markFertilized(uid) {
    const today = new Date().toISOString().slice(0, 10)
    setMyPlants(prev => prev.map(p => p.uid !== uid ? p : {
      ...p,
      lastFertilized: today,
      nextFertilizing: addDays(today, p.frequency_days),
    }))
  }

  function removePlant(uid) {
    setMyPlants(prev => prev.filter(p => p.uid !== uid))
  }

  function updateNote(uid, note) {
    setMyPlants(prev => prev.map(p => p.uid !== uid ? p : { ...p, note }))
  }

  const today = new Date().toISOString().slice(0, 10)

  const waterDue = myPlants.filter(p => p.nextWatering <= today)
  const waterUpcoming = myPlants.filter(p => p.nextWatering > today)
  const fertilizeDue = myPlants.filter(p => p.nextFertilizing <= today)
  const fertilizeUpcoming = myPlants.filter(p => p.nextFertilizing > today)

  const waterCount = waterDue.length
  const fertilizeCount = fertilizeDue.length

  return (
    <div>
      {photoView && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPhotoView(null)}
        >
          <img src={photoView} alt="plant" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Моята градина</h1>
          <p className="text-gray-400 text-sm">{myPlants.length} растения</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Добави
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">Добави растение</h3>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">-- Избери растение --</option>
            {plants.map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Последно поливане</label>
              <input type="date" value={lastWatered} onChange={e => setLastWatered(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Последно торене</label>
              <input type="date" value={lastFertilized} onChange={e => setLastFertilized(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addPlant}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">
              Добави
            </button>
            <button onClick={() => setShowAdd(false)}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Откажи
            </button>
          </div>
        </div>
      )}

      {myPlants.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-medium">Нямате добавени растения</p>
          <p className="text-sm mt-1">Натиснете "+ Добави" за начало</p>
        </div>
      )}

      {myPlants.length > 0 && (
        <>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('water')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'water' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'
              }`}
            >
              💧 Поливане {waterCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'water' ? 'bg-white text-blue-500' : 'bg-red-500 text-white'}`}>
                  {waterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('fertilize')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'fertilize' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              🌱 Торене {fertilizeCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'fertilize' ? 'bg-white text-green-600' : 'bg-red-500 text-white'}`}>
                  {fertilizeCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'water' && (
            <>
              {waterDue.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">Трябва поливане ({waterDue.length})</h2>
                  <div className="grid gap-2">
                    {waterDue.map(p => (
                      <PlantRow key={p.uid} plant={p} type="water" urgent onAction={markWatered} onRemove={removePlant} onPhotoView={setPhotoView} onNote={updateNote} />
                    ))}
                  </div>
                </section>
              )}
              {waterUpcoming.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Предстоящо</h2>
                  <div className="grid gap-2">
                    {waterUpcoming.map(p => (
                      <PlantRow key={p.uid} plant={p} type="water" onAction={markWatered} onRemove={removePlant} onPhotoView={setPhotoView} onNote={updateNote} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {activeTab === 'fertilize' && (
            <>
              {fertilizeDue.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">Трябва торене ({fertilizeDue.length})</h2>
                  <div className="grid gap-2">
                    {fertilizeDue.map(p => (
                      <PlantRow key={p.uid} plant={p} type="fertilize" urgent onAction={markFertilized} onRemove={removePlant} onPhotoView={setPhotoView} onNote={updateNote} />
                    ))}
                  </div>
                </section>
              )}
              {fertilizeUpcoming.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Предстоящо</h2>
                  <div className="grid gap-2">
                    {fertilizeUpcoming.map(p => (
                      <PlantRow key={p.uid} plant={p} type="fertilize" onAction={markFertilized} onRemove={removePlant} onPhotoView={setPhotoView} onNote={updateNote} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function PlantRow({ plant, type, urgent, onAction, onRemove, onPhotoView, onNote }) {
  const isWater = type === 'water'
  const nextDate = isWater ? plant.nextWatering : plant.nextFertilizing
  const daysUntil = Math.ceil((new Date(nextDate) - new Date()) / 86400000)
  const [editingNote, setEditingNote] = useState(false)
  const [noteVal, setNoteVal] = useState(plant.note || '')

  return (
    <div className={`bg-white rounded-2xl border shadow-sm ${
      urgent ? (isWater ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50') : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {plant.photo ? (
          <button onClick={() => onPhotoView(plant.photo)} className="shrink-0">
            <img src={plant.photo} alt={plant.name} className="w-10 h-10 rounded-xl object-cover" />
          </button>
        ) : (
          <span className="text-2xl">{plant.emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-sm">{plant.name}</div>
          <div className="text-xs text-gray-400 truncate">
            {isWater ? plant.watering_amount : plant.fertilizer_type}
          </div>
          <div className={`text-xs font-medium mt-0.5 ${
            urgent ? (isWater ? 'text-blue-500' : 'text-red-500') : 'text-green-600'
          }`}>
            {urgent
              ? `Просрочено с ${Math.abs(daysUntil)} дни`
              : `След ${daysUntil} дни (${nextDate})`}
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <button
            onClick={() => onAction(plant.uid)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${
              isWater ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isWater ? '💧 Полято' : '✓ Торено'}
          </button>
          <button onClick={() => onRemove(plant.uid)} className="text-red-400 text-xs hover:text-red-600">
            Премахни
          </button>
        </div>
      </div>

      {editingNote ? (
        <div className="px-4 pb-3 flex gap-2">
          <input
            autoFocus
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onNote(plant.uid, noteVal); setEditingNote(false) }
              if (e.key === 'Escape') { setNoteVal(plant.note || ''); setEditingNote(false) }
            }}
            placeholder="Добави бележка..."
            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
          />
          <button onClick={() => { onNote(plant.uid, noteVal); setEditingNote(false) }}
            className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg">
            OK
          </button>
        </div>
      ) : (
        <div className="px-4 pb-3">
          {plant.note ? (
            <button onClick={() => setEditingNote(true)}
              className="text-xs text-gray-500 italic hover:text-gray-700 text-left">
              📝 {plant.note}
            </button>
          ) : (
            <button onClick={() => setEditingNote(true)}
              className="text-xs text-gray-300 hover:text-gray-500">
              + бележка
            </button>
          )}
        </div>
      )}
    </div>
  )
}
