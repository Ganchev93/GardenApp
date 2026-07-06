import { useState, useEffect } from 'react'
import { Droplets, Sprout, Bug, X, NotebookPen, Plus, CalendarDays } from 'lucide-react'
import { plants as catalog } from '../data/plants'
import { ACTIVITIES } from '../components/PlantTimeline'
import { loadGarden, saveGarden, addDays } from '../lib/garden'
import emptyBedImg from '../assets/empty-bed.png'

function dayLabel(days, due) {
  if (due) {
    if (days === 0) return 'Днес!'
    return Math.abs(days) === 1 ? 'Просрочено 1 ден' : `Просрочено ${Math.abs(days)} дни`
  }
  return days === 1 ? 'Утре' : `След ${days} дни`
}

const catStyle = {
  'зеленчук': { bg: '#D4EDE0', color: '#1E3A2F' },
  'дърво':    { bg: '#FDF3DC', color: '#7A4A00' },
  'храст':    { bg: '#EDE4F5', color: '#4A2A6B' },
  'билка':    { bg: '#E8F5F0', color: '#1E5C3A' },
  'цвете':    { bg: '#FDE8F0', color: '#7A1D45' },
}

export default function MyGarden() {
  const [myPlants, setMyPlants] = useState(loadGarden)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [lastWatered, setLastWatered] = useState(new Date().toISOString().slice(0, 10))
  const [lastFertilized, setLastFertilized] = useState(new Date().toISOString().slice(0, 10))
  const [photoView, setPhotoView] = useState(null)

  useEffect(() => { saveGarden(myPlants) }, [myPlants])

  const today = new Date().toISOString().slice(0, 10)

  function addPlant() {
    if (!selectedId) return
    const plant = catalog.find(p => p.id === Number(selectedId))
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
      nextFertilizing: plant.fertilizing.frequency_days === 0 ? null : addDays(lastFertilized, plant.fertilizing.frequency_days),
      frequency_days: plant.fertilizing.frequency_days,
      fertilizer_type: plant.fertilizing.fertilizer_type,
      dose: plant.fertilizing.dose,
    }])
    setShowAdd(false)
    setSelectedId('')
  }

  function markWatered(uid) {
    setMyPlants(prev => prev.map(p => p.uid !== uid ? p : {
      ...p, lastWatered: today, nextWatering: addDays(today, p.watering_frequency_days),
    }))
  }
  function markFertilized(uid) {
    setMyPlants(prev => prev.map(p => p.uid !== uid ? p : {
      ...p, lastFertilized: today, nextFertilizing: p.frequency_days === 0 ? null : addDays(today, p.frequency_days),
    }))
  }
  function removePlant(uid) { setMyPlants(prev => prev.filter(p => p.uid !== uid)) }
  function updateNote(uid, note) { setMyPlants(prev => prev.map(p => p.uid !== uid ? p : { ...p, note })) }

  const urgentCount = myPlants.filter(p => p.nextWatering <= today || (p.nextFertilizing && p.nextFertilizing <= today)).length

  const sorted = [...myPlants].sort((a, b) => {
    const aU = a.nextWatering <= today || (a.nextFertilizing && a.nextFertilizing <= today)
    const bU = b.nextWatering <= today || (b.nextFertilizing && b.nextFertilizing <= today)
    if (aU && !bU) return -1
    if (!aU && bU) return 1
    return new Date(a.nextWatering) - new Date(b.nextWatering)
  })

  return (
    <div>
      {photoView && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPhotoView(null)}>
          <img src={photoView} alt="plant" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ color: '#1E3A2F' }}>Моята градина</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6A9E78' }}>
            {myPlants.length} растения
            {urgentCount > 0 && <span style={{ color: '#C97D0E' }}> · {urgentCount} чакат грижа</span>}
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center gap-1"
          style={{ background: '#4A7C59', color: '#fff' }}>
          <Plus size={15} strokeWidth={2.5} /> Добави
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
          <h3 className="font-semibold mb-3" style={{ color: '#1C2B23' }}>Добави растение</h3>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{ border: '1px solid #B3D9C4', color: '#1C2B23', background: '#F5F2EC' }}>
            <option value="">-- Избери растение --</option>
            {catalog.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#6A9E78' }}>Последно поливане</label>
              <input type="date" value={lastWatered} onChange={e => setLastWatered(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ border: '1px solid #B3D9C4', background: '#F5F2EC', color: '#1C2B23' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#6A9E78' }}>Последно торене</label>
              <input type="date" value={lastFertilized} onChange={e => setLastFertilized(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ border: '1px solid #B3D9C4', background: '#F5F2EC', color: '#1C2B23' }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addPlant}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#4A7C59', color: '#fff' }}>Добави</button>
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{ border: '1px solid #B3D9C4', color: '#4A7C59', background: '#fff' }}>Откажи</button>
          </div>
        </div>
      )}

      <ThisMonth myPlants={myPlants} />

      {myPlants.length === 0 && (
        <div className="text-center py-6" style={{ color: '#6A9E78' }}>
          <img src={emptyBedImg} alt="Празна градина" className="w-52 h-52 mx-auto object-contain" />
          <p className="font-semibold" style={{ color: '#1C2B23' }}>Нямате добавени растения</p>
          <p className="text-sm mt-1">Натиснете "+ Добави" за начало</p>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
        {sorted.map(p => (
          <PlantCard key={p.uid} plant={p} today={today}
            onMarkWatered={markWatered}
            onMarkFertilized={markFertilized}
            onRemove={removePlant}
            onPhotoView={setPhotoView}
            onNote={updateNote} />
        ))}
      </div>
    </div>
  )
}

function PlantCard({ plant, today, onMarkWatered, onMarkFertilized, onRemove, onPhotoView, onNote }) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteVal, setNoteVal] = useState(plant.note || '')

  const noFertilize = !plant.nextFertilizing
  const waterDue = plant.nextWatering <= today
  const fertilizeDue = !noFertilize && plant.nextFertilizing <= today
  const waterDays = Math.ceil((new Date(plant.nextWatering) - new Date()) / 86400000)
  const fertilizeDays = noFertilize ? null : Math.ceil((new Date(plant.nextFertilizing) - new Date()) / 86400000)
  const isUrgent = waterDue || fertilizeDue

  const catalogPlant = catalog.find(p => p.id === plant.plantId)
  const pests = catalogPlant?.pest_control?.pests?.slice(0, 3) || []

  const healthColor = (waterDue && fertilizeDue) ? '#EF4444' : isUrgent ? '#C97D0E' : '#4A7C59'
  const healthLabel = (waterDue && fertilizeDue) ? 'Нужда от грижа' : waterDue ? 'Нужда от поливане' : fertilizeDue ? 'Нужда от торене' : 'В добро здраве'
  const cat = catStyle[plant.category] || catStyle['зеленчук']

  return (
    <div className={`anim-fade rounded-2xl overflow-hidden ${isUrgent ? 'anim-urgent' : ''}`}
      style={{ background: '#fff', border: `1px solid ${isUrgent ? '#FED7AA' : '#D4EDE0'}` }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {plant.photo
          ? <button onClick={() => onPhotoView(plant.photo)} className="shrink-0">
              <img src={plant.photo} alt={plant.name} className="w-12 h-12 rounded-xl object-cover" />
            </button>
          : <span className="text-3xl shrink-0 leading-none">{plant.emoji}</span>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: '#1C2B23' }}>{plant.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cat.bg, color: cat.color }}>
              {plant.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: healthColor }} />
            <span className="text-xs" style={{ color: healthColor }}>{healthLabel}</span>
          </div>
        </div>
        <button onClick={() => onRemove(plant.uid)}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
          <X size={13} />
        </button>
      </div>

      <div style={{ height: '1px', background: '#F0EBE3' }} />

      {/* Поливане */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Droplets size={16} className="shrink-0" style={{ color: waterDue ? '#2563EB' : '#B3D9C4' }} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: waterDue ? '#2563EB' : '#1C2B23' }}>
            {dayLabel(waterDays, waterDue)}
          </span>
          <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{plant.watering_amount}</span>
        </div>
        <button onClick={() => onMarkWatered(plant.uid)}
          className="text-xs px-3 py-1 rounded-lg font-semibold shrink-0 transition-transform active:scale-90"
          style={{ background: waterDue ? '#2563EB' : '#EDE8DF', color: waterDue ? '#fff' : '#6A9E78' }}>
          Полято
        </button>
      </div>

      {/* Торене */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Sprout size={16} className="shrink-0" style={{ color: fertilizeDue ? '#C97D0E' : '#B3D9C4' }} />
        <div className="flex-1 min-w-0 overflow-hidden">
          <span className="text-sm font-medium" style={{ color: fertilizeDue ? '#C97D0E' : '#1C2B23' }}>
            {noFertilize ? 'Не се тори' : dayLabel(fertilizeDays, fertilizeDue)}
          </span>
          <span className="text-xs ml-2 truncate" style={{ color: '#9CA3AF' }}>
            {noFertilize ? 'по нужда' : plant.fertilizer_type.split(' ').slice(0,3).join(' ')}
          </span>
        </div>
        {!noFertilize && (
          <button onClick={() => onMarkFertilized(plant.uid)}
            className="text-xs px-3 py-1 rounded-lg font-semibold shrink-0 transition-transform active:scale-90"
            style={{ background: fertilizeDue ? '#C97D0E' : '#EDE8DF', color: fertilizeDue ? '#fff' : '#6A9E78' }}>
            Торено
          </button>
        )}
      </div>

      {/* Вредители */}
      {pests.length > 0 && (
        <>
          <div style={{ height: '1px', background: '#F0EBE3' }} />
          <div className="px-4 py-2 flex items-start gap-2">
            <Bug size={14} className="shrink-0 mt-0.5" style={{ color: '#B3D9C4' }} />
            <span className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
              {pests.join(' · ')}
            </span>
          </div>
        </>
      )}

      {/* Бележка */}
      <div style={{ height: '1px', background: '#F0EBE3' }} />
      {editingNote ? (
        <div className="px-4 py-2 flex gap-2">
          <input autoFocus value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onNote(plant.uid, noteVal); setEditingNote(false) }
              if (e.key === 'Escape') { setNoteVal(plant.note || ''); setEditingNote(false) }
            }}
            placeholder="Добави бележка..."
            className="flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            style={{ border: '1px solid #B3D9C4', background: '#F5F2EC', color: '#1C2B23' }} />
          <button onClick={() => { onNote(plant.uid, noteVal); setEditingNote(false) }}
            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
            style={{ background: '#4A7C59', color: '#fff' }}>OK</button>
        </div>
      ) : (
        <div className="px-4 py-2">
          {plant.note
            ? <button onClick={() => setEditingNote(true)} className="text-xs italic text-left flex items-center gap-1.5" style={{ color: '#6A9E78' }}>
                <NotebookPen size={12} className="shrink-0" /> {plant.note}
              </button>
            : <button onClick={() => setEditingNote(true)} className="text-xs" style={{ color: '#B3D9C4' }}>+ бележка</button>
          }
        </div>
      )}
    </div>
  )
}

const MONTH_NAMES = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември']

function ThisMonth({ myPlants }) {
  const month = new Date().getMonth() + 1
  const seen = new Set()
  const unique = myPlants.filter(p => !seen.has(p.plantId) && seen.add(p.plantId))
  const groups = ACTIVITIES
    .map(a => ({
      ...a,
      items: unique.filter(p => catalog.find(c => c.id === p.plantId)?.calendar?.[a.key]?.includes(month)),
    }))
    .filter(g => g.items.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
      <div className="font-semibold text-sm mb-2.5 flex items-center gap-1.5" style={{ color: '#1E3A2F' }}>
        <CalendarDays size={15} /> Този месец ({MONTH_NAMES[month - 1]})
      </div>
      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.key} className="flex items-start gap-2">
            <span className="text-xs font-semibold w-14 shrink-0 mt-1" style={{ color: g.color }}>{g.short}</span>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map(p => (
                <span key={p.plantId} className="text-xs px-2 py-1 rounded-full" style={{ background: '#F5F2EC', color: '#1C2B23' }}>
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
