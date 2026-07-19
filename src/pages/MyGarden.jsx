import { useState, useEffect, useRef } from 'react'
import { Droplets, Sprout, Bug, X, NotebookPen, Plus, CalendarDays, Search, Map, List, ShoppingBasket } from 'lucide-react'
import { plants as catalog } from '../data/plants'
import { ACTIVITIES } from '../components/PlantTimeline'
import { toDateStr, todayStr } from '../lib/garden'
import { useAuth } from '../hooks/useAuth'
import { useGarden } from '../hooks/useGarden'
import { useZones } from '../hooks/useZones'
import { useLayout } from '../hooks/useLayout'
import { useFreemium } from '../hooks/useFreemium'
import { useHarvests } from '../hooks/useHarvests'
import { migratePocData } from '../lib/migratePoc'
import { uploadImage } from '../services/cloudinary'
import FreemiumGate from '../components/ui/FreemiumGate'
import GardenScene from '../components/garden/GardenScene'
import HarvestForm from '../components/garden/HarvestForm'
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

function ViewToggle({ mode, setMode }) {
  const opts = [
    { id: 'map', label: 'Схема', Icon: Map },
    { id: 'list', label: 'Списък', Icon: List },
  ]
  return (
    <div className="flex rounded-xl p-0.5" style={{ background: '#F0EBE3' }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => setMode(o.id)}
          className="px-3 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          style={mode === o.id
            ? { background: '#fff', color: '#1E3A2F', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
            : { color: '#9CA3AF' }}>
          <o.Icon size={13} /> {o.label}
        </button>
      ))}
    </div>
  )
}

function plantDoc(plant, extra = {}) {
  return {
    plantId: plant.id,
    name: plant.name,
    emoji: plant.emoji,
    category: plant.category,
    watering_frequency_days: plant.watering.frequency_days,
    watering_amount: plant.watering.amount,
    fertilizing_frequency_days: plant.fertilizing.frequency_days,
    fertilizer_type: plant.fertilizing.fertilizer_type,
    dose: plant.fertilizing.dose,
    ...extra,
  }
}

export default function MyGarden() {
  const { user } = useAuth()
  const uid = user?.uid
  const {
    plants: myPlants, loading,
    addPlant, markWatered, markFertilized, updateNote, removePlant,
    assignToBed, unassignFromBed, addPhoto, removePhoto,
  } = useGarden(uid)
  const { zones: beds, loading: zonesLoading, addZone, moveZone, removeZone } = useZones(uid)
  const { addHarvest } = useHarvests(uid)
  const layout = useLayout(uid)
  const { canAddPlant, role } = useFreemium()
  const canAddBed = role !== 'free' || beds.length < 1

  const [viewMode, setViewMode] = useState('map')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [lastWatered, setLastWatered] = useState(todayStr)
  const [lastFertilized, setLastFertilized] = useState(todayStr)
  const [photoView, setPhotoView] = useState(null)

  const today = todayStr()
  const matches = catalog.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  // One-time import of PoC localStorage data
  const migrated = useRef(false)
  useEffect(() => {
    if (migrated.current || loading || zonesLoading || !layout.loaded || !uid) return
    if (layout.pocMigrated || myPlants.length || beds.length) { migrated.current = true; return }
    migrated.current = true
    migratePocData(uid)
  }, [loading, zonesLoading, layout.loaded, layout.pocMigrated, myPlants.length, beds.length, uid])

  async function handleAdd() {
    if (!selectedId) return
    const plant = catalog.find(p => p.id === Number(selectedId))
    if (!plant) return
    await addPlant(plantDoc(plant, { lastWatered, lastFertilized }))
    setShowAdd(false)
    setSelectedId('')
    setQuery('')
  }

  // scene callbacks
  function plantNew(bedId, cell, plant) {
    return addPlant(plantDoc(plant, { bedId, cell, plantedAt: today }))
  }
  async function addBed(bed) { await addZone(bed) }
  function removeBed(id) {
    removeZone(id)
    myPlants.filter(p => p.bedId === id).forEach(p => unassignFromBed(p.id))
  }
  function waterById(id) {
    const p = myPlants.find(p => p.id === id)
    if (p) markWatered(id, p.watering_frequency_days)
  }
  async function photoUpload(id, file) {
    const url = await uploadImage(file)
    await addPhoto(id, url)
  }
  function harvestById(id, amount, unit) {
    const p = myPlants.find(p => p.id === id)
    if (p) addHarvest({ gardenEntryId: p.id, plantId: p.plantId, name: p.name, emoji: p.emoji, amount, unit })
  }

  const isDue = p => toDateStr(p.nextWatering) <= today || (p.nextFertilizing && toDateStr(p.nextFertilizing) <= today)
  const urgentCount = myPlants.filter(isDue).length

  const sorted = [...myPlants].sort((a, b) => {
    const aU = isDue(a)
    const bU = isDue(b)
    if (aU && !bU) return -1
    if (!aU && bU) return 1
    return new Date(toDateStr(a.nextWatering)) - new Date(toDateStr(b.nextWatering))
  })

  if (loading || zonesLoading || !layout.loaded) {
    return <div className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Зареждане...</div>
  }

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
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} setMode={setViewMode} />
          {viewMode === 'list' && (
            <button onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center gap-1"
              style={{ background: '#4A7C59', color: '#fff' }}>
              <Plus size={15} strokeWidth={2.5} /> Добави
            </button>
          )}
        </div>
      </div>

      {viewMode === 'map' && (
        <GardenScene
          plants={myPlants} beds={beds}
          yard={layout.yard} paths={layout.paths} decor={layout.decor}
          onYardChange={layout.setYard} onPathsChange={layout.setPaths} onDecorChange={layout.setDecor}
          canAddBed={canAddBed} canAddPlant={canAddPlant}
          onAddBed={addBed} onMoveBed={moveZone} onRemoveBed={removeBed}
          onPlantNew={plantNew} onAssign={assignToBed} onUnassign={unassignFromBed}
          onWater={waterById} onAddPhoto={photoUpload} onRemovePhoto={removePhoto} onHarvest={harvestById} />
      )}

      {viewMode === 'list' && (<>
      {showAdd && (
        <FreemiumGate show={!canAddPlant} type="plants">
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
          <h3 className="font-semibold mb-3" style={{ color: '#1C2B23' }}>Добави растение</h3>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#B3D9C4' }} />
            <input
              type="text"
              placeholder="Търси растение..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedId('') }}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
              style={{ border: `1px solid ${selectedId ? '#4A7C59' : '#B3D9C4'}`, background: '#F5F2EC', color: '#1C2B23' }}
            />
            {query && !selectedId && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 max-h-64 overflow-y-auto"
                style={{ background: '#fff', border: '1px solid #B3D9C4', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                {matches.map(p => {
                  const cat = catStyle[p.category] || catStyle['зеленчук']
                  return (
                    <button key={p.id} onClick={() => { setSelectedId(String(p.id)); setQuery(p.name) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:opacity-70"
                      style={{ color: '#1C2B23' }}>
                      <span>{p.emoji}</span>
                      <span className="flex-1">{p.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>{p.category}</span>
                    </button>
                  )
                })}
                {matches.length === 0 && (
                  <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>Няма намерени растения</div>
                )}
              </div>
            )}
          </div>
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
            <button onClick={handleAdd}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#4A7C59', color: '#fff' }}>Добави</button>
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{ border: '1px solid #B3D9C4', color: '#4A7C59', background: '#fff' }}>Откажи</button>
          </div>
        </div>
        </FreemiumGate>
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
          <PlantCard key={p.id} plant={p} today={today}
            onMarkWatered={() => markWatered(p.id, p.watering_frequency_days)}
            onMarkFertilized={() => markFertilized(p.id, p.fertilizing_frequency_days)}
            onRemove={() => removePlant(p.id)}
            onPhotoView={setPhotoView}
            onNote={note => updateNote(p.id, note)}
            onHarvest={(amount, unit) => harvestById(p.id, amount, unit)} />
        ))}
      </div>
      </>)}
    </div>
  )
}

function PlantCard({ plant, today, onMarkWatered, onMarkFertilized, onRemove, onPhotoView, onNote, onHarvest }) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteVal, setNoteVal] = useState(plant.note || '')
  const [harvesting, setHarvesting] = useState(false)
  const [harvestSaved, setHarvestSaved] = useState(false)
  const harvestable = plant.category === 'зеленчук' || plant.category === 'дърво' || plant.category === 'храст'

  const nextWatering = toDateStr(plant.nextWatering)
  const nextFertilizing = toDateStr(plant.nextFertilizing)
  const noFertilize = !nextFertilizing
  const waterDue = nextWatering <= today
  const fertilizeDue = !noFertilize && nextFertilizing <= today
  const waterDays = Math.ceil((new Date(nextWatering) - new Date()) / 86400000)
  const fertilizeDays = noFertilize ? null : Math.ceil((new Date(nextFertilizing) - new Date()) / 86400000)
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
        <button onClick={onRemove}
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
        <button onClick={onMarkWatered}
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
            {noFertilize ? 'по нужда' : plant.fertilizer_type.split(' ').slice(0, 3).join(' ')}
          </span>
        </div>
        {!noFertilize && (
          <button onClick={onMarkFertilized}
            className="text-xs px-3 py-1 rounded-lg font-semibold shrink-0 transition-transform active:scale-90"
            style={{ background: fertilizeDue ? '#C97D0E' : '#EDE8DF', color: fertilizeDue ? '#fff' : '#6A9E78' }}>
            Торено
          </button>
        )}
      </div>

      {/* Реколта */}
      {harvestable && (
        <div className="flex items-center gap-3 px-4 py-2.5">
          <ShoppingBasket size={16} className="shrink-0" style={{ color: '#B3D9C4' }} />
          {harvesting ? (
            <HarvestForm
              onSubmit={(amount, unit) => {
                onHarvest(amount, unit)
                setHarvesting(false)
                setHarvestSaved(true)
                setTimeout(() => setHarvestSaved(false), 2000)
              }}
              onCancel={() => setHarvesting(false)} />
          ) : (
            <>
              <span className="flex-1 text-sm font-medium" style={{ color: harvestSaved ? '#4A7C59' : '#1C2B23' }}>
                {harvestSaved ? 'Записано в дневника' : 'Реколта'}
              </span>
              <button onClick={() => setHarvesting(true)}
                className="text-xs px-3 py-1 rounded-lg font-semibold shrink-0 transition-transform active:scale-90"
                style={{ background: '#EDE8DF', color: '#6A9E78' }}>
                Запиши
              </button>
            </>
          )}
        </div>
      )}

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
              if (e.key === 'Enter') { onNote(noteVal); setEditingNote(false) }
              if (e.key === 'Escape') { setNoteVal(plant.note || ''); setEditingNote(false) }
            }}
            placeholder="Добави бележка..."
            className="flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            style={{ border: '1px solid #B3D9C4', background: '#F5F2EC', color: '#1C2B23' }} />
          <button onClick={() => { onNote(noteVal); setEditingNote(false) }}
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
