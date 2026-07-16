import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Pencil, Check, Fence } from 'lucide-react'
import { plants as catalog } from '../../data/plants'
import { badPairsInBeds } from '../../lib/companions'
import { dayPhase } from '../../lib/growth'
import { loadYard, saveYard, TILE, YARD_COLS, YARD_ROWS } from '../../lib/beds'
import Bed, { bedSize, cellCenter } from './Bed'
import Critters, { bloomSpotsFrom } from './Critters'
import PlantPicker from './PlantPicker'
import PlantSheet from './PlantSheet'

const WORLD = { w: YARD_COLS * TILE, h: YARD_ROWS * TILE }
const catalogById = Object.fromEntries(catalog.map(p => [p.id, p]))

const PHASE_STYLE = {
  dawn:  { overlay: 'rgba(255, 196, 120, 0.12)' },
  day:   { overlay: null },
  dusk:  { overlay: 'rgba(235, 130, 60, 0.15)' },
  night: { overlay: 'rgba(18, 32, 74, 0.42)' },
}

const GRASS_TONES = ['#CBE0AE', '#C3D9A4', '#D2E5B8']
const grassTone = (r, c) => GRASS_TONES[(r * 7 + c * 13) % 3]

const STARS = [
  [120, 60], [340, 100], [560, 45], [760, 90], [980, 55], [1100, 120],
  [230, 140], [660, 150], [880, 40], [440, 70],
]

export default function GardenScene({
  plants, beds,
  onAddBed, onMoveBed, onRemoveBed,
  onPlantNew, onAssign, onUnassign, onWater,
}) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const [aspect, setAspect] = useState(0.62)
  const [view, setView] = useState({ x: 120, y: 100, w: 900 })
  const [mode, setMode] = useState('view')          // 'view' | 'beds' | 'yard'
  const [yard, setYard] = useState(loadYard)
  const [picker, setPicker] = useState(null)        // { bed, cell }
  const [sheet, setSheet] = useState(null)          // entry
  const [showBedForm, setShowBedForm] = useState(false)
  const [bedName, setBedName] = useState('')
  const [bedRows, setBedRows] = useState(2)
  const [bedCols, setBedCols] = useState(4)
  const [justPlantedUid, setJustPlantedUid] = useState(null)
  const [wateringUid, setWateringUid] = useState(null)
  const [phase, setPhase] = useState(dayPhase)
  const [invalidBedId, setInvalidBedId] = useState(null)
  const [toast, setToast] = useState(null)

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const viewRef = useRef(view)
  viewRef.current = view
  const aspectRef = useRef(aspect)
  aspectRef.current = aspect
  const pointers = useRef(new Map())
  const gesture = useRef({ type: null, moved: false, paintValue: null, bed: null, pinch: null })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setAspect(el.clientHeight / el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setPhase(dayPhase()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { saveYard(yard) }, [yard])

  // Non-passive wheel listener (React root wheel handlers are passive → preventDefault would fail)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    function onWheel(e) {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1.12 : 0.89
      const pt = toWorldRef(e.clientX, e.clientY)
      setView(v => {
        const w = Math.min(Math.max(v.w * factor, 320), 1500)
        const scale = w / v.w
        return clampView({ w, x: pt.x - (pt.x - v.x) * scale, y: pt.y - (pt.y - v.y) * scale })
      })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const planted = plants.filter(p => p.bedId && p.cell)
  const unassigned = plants.filter(p => !p.bedId)
  const badPairs = useMemo(() => badPairsInBeds(planted, catalogById), [plants])

  const positions = {}
  planted.forEach(e => {
    const bed = beds.find(b => b.id === e.bedId)
    if (bed) positions[e.uid] = cellCenter(bed, e.cell)
  })
  const bloomSpots = bloomSpotsFrom(planted, catalogById, positions)

  // ── coordinates ───────────────────────────────────────
  function toWorldRef(clientX, clientY) {
    const r = svgRef.current.getBoundingClientRect()
    const v = viewRef.current
    return {
      x: v.x + ((clientX - r.left) / r.width) * v.w,
      y: v.y + ((clientY - r.top) / r.height) * (v.w * aspectRef.current),
    }
  }

  function clampView(v) {
    const vh = v.w * aspectRef.current
    return {
      w: Math.min(Math.max(v.w, 320), 1500),
      x: Math.min(Math.max(v.x, -200), WORLD.w + 200 - v.w),
      y: Math.min(Math.max(v.y, -150), WORLD.h + 150 - vh),
    }
  }

  function tileAt(clientX, clientY) {
    const pt = toWorldRef(clientX, clientY)
    const col = Math.floor(pt.x / TILE)
    const row = Math.floor(pt.y / TILE)
    if (col < 0 || col >= YARD_COLS || row < 0 || row >= YARD_ROWS) return null
    return `${row}-${col}`
  }

  function isOnGrass(x, y, w, h) {
    const r0 = Math.floor(y / TILE), r1 = Math.floor((y + h - 1) / TILE)
    const c0 = Math.floor(x / TILE), c1 = Math.floor((x + w - 1) / TILE)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!yard.has(`${r}-${c}`)) return false
      }
    }
    return true
  }

  // ── gestures ──────────────────────────────────────────
  function paintTile(clientX, clientY) {
    const tile = tileAt(clientX, clientY)
    if (!tile) return
    const add = gesture.current.paintValue
    setYard(prev => {
      if (add === prev.has(tile)) return prev
      const next = new Set(prev)
      if (add) next.add(tile)
      else next.delete(tile)
      return next
    })
  }

  function onPointerDown(e) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { type: 'pinch', moved: true, pinch: { dist: Math.hypot(a.x - b.x, a.y - b.y), w: viewRef.current.w } }
      return
    }

    if (mode === 'yard') {
      const tile = tileAt(e.clientX, e.clientY)
      gesture.current = { type: 'paint', moved: false, paintValue: tile ? !yard.has(tile) : true }
      paintTile(e.clientX, e.clientY)
      return
    }

    // bed drag starts via onBedPointerDown (stopPropagation) — this is pan
    gesture.current = { type: 'pan', moved: false }
  }

  function onBedPointerDown(e, bed) {
    e.stopPropagation()
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current = { type: 'bed', moved: false, bed: { id: bed.id, x: bed.x, y: bed.y, origX: bed.x, origY: bed.y } }
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return
    const prev = pointers.current.get(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current

    if (g.type === 'pinch' && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      setView(v => clampView({ ...v, w: g.pinch.w * (g.pinch.dist / dist) }))
      return
    }

    if (g.type === 'paint') {
      paintTile(e.clientX, e.clientY)
      return
    }

    const r = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - prev.x) / r.width) * viewRef.current.w
    const dy = ((e.clientY - prev.y) / r.height) * (viewRef.current.w * aspectRef.current)

    if (g.type === 'bed') {
      if (!g.moved) { g.moved = true; try { svgRef.current.setPointerCapture(e.pointerId) } catch {} }
      g.bed.x += dx
      g.bed.y += dy
      const bx = Math.round(g.bed.x / 10) * 10
      const by = Math.round(g.bed.y / 10) * 10
      onMoveBed(g.bed.id, bx, by)
      const src = beds.find(b => b.id === g.bed.id)
      if (src) {
        const { w, h } = bedSize(src)
        setInvalidBedId(isOnGrass(bx, by, w, h) ? null : g.bed.id)
      }
      return
    }

    if (g.type === 'pan') {
      if (!g.moved) {
        const total = Math.hypot(e.clientX - prev.x, e.clientY - prev.y)
        if (total < 3 && pointers.current.size === 1) {
          // ignore micro-jitter before committing to a pan
        }
        g.moved = true
        try { svgRef.current.setPointerCapture(e.pointerId) } catch {}
      }
      setView(v => clampView({ ...v, x: v.x - dx, y: v.y - dy }))
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId)
    try { svgRef.current.releasePointerCapture(e.pointerId) } catch {}
    const g = gesture.current

    // dropping a bed on dirt → snap back to where the drag started
    if (g.type === 'bed' && g.moved && g.bed) {
      const src = beds.find(b => b.id === g.bed.id)
      if (src) {
        const { w, h } = bedSize(src)
        if (!isOnGrass(src.x, src.y, w, h)) {
          onMoveBed(g.bed.id, g.bed.origX, g.bed.origY)
          flash('Лехите се поставят само върху трева')
        }
      }
      setInvalidBedId(null)
    }

    if (pointers.current.size === 0) {
      // keep `moved` until the click event (fires right after pointerup) checks it
      setTimeout(() => { gesture.current = { type: null, moved: false } }, 0)
    }
  }

  function tapGuard(fn) {
    return (...args) => {
      if (gesture.current.moved) return
      fn(...args)
    }
  }

  // ── actions ───────────────────────────────────────────
  function addBed() {
    const name = bedName.trim() || `Леха ${beds.length + 1}`
    const rows = Math.min(Math.max(bedRows, 1), 6)
    const cols = Math.min(Math.max(bedCols, 1), 8)
    const { w, h } = bedSize({ rows, cols })
    const v = viewRef.current
    const vh = v.w * aspectRef.current
    const cx = v.x + v.w / 2 - w / 2
    const cy = v.y + vh / 2 - h / 2

    // prefer view center; otherwise nearest grass spot that fits
    let x = Math.round(cx / 10) * 10
    let y = Math.round(cy / 10) * 10
    if (!isOnGrass(x, y, w, h)) {
      let best = null
      yard.forEach(key => {
        const [r, c] = key.split('-').map(Number)
        const tx = c * TILE + 4
        const ty = r * TILE + 4
        if (!isOnGrass(tx, ty, w, h)) return
        const d = (tx - cx) ** 2 + (ty - cy) ** 2
        if (!best || d < best.d) best = { x: tx, y: ty, d }
      })
      if (!best) {
        flash('Няма достатъчно трева за тази леха — разшири двора или намали размера')
        return
      }
      x = best.x
      y = best.y
    }

    onAddBed({ id: Date.now(), name, rows, cols, x, y })
    setShowBedForm(false)
    setBedName('')
    setMode('beds')
  }

  function handlePick(choice) {
    const { bed, cell } = picker
    if (choice.type === 'new') {
      const uid = onPlantNew(bed.id, cell, choice.plant)
      setJustPlantedUid(uid)
    } else {
      onAssign(choice.entry.uid, bed.id, cell)
      setJustPlantedUid(choice.entry.uid)
    }
    setPicker(null)
    setTimeout(() => setJustPlantedUid(null), 700)
  }

  function handleWater(uid) {
    onWater(uid)
    setWateringUid(uid)
    setSheet(null)
    setTimeout(() => setWateringUid(null), 1100)
  }

  const style = PHASE_STYLE[phase]
  const vh = view.w * aspect
  const yardTiles = [...yard]

  const hint = mode === 'yard'
    ? 'Влачи по земята — добавяш трева; влачи по тревата — триеш'
    : mode === 'beds'
      ? 'Влачи лехите, за да ги подредиш — после натисни ✓'
      : beds.length > 0 && planted.length === 0
        ? 'Тапни ➕ клетка в лехата, за да засадиш'
        : null

  return (
    <div ref={wrapRef} className="relative rounded-3xl overflow-hidden anim-fade select-none"
      onContextMenu={e => e.preventDefault()}
      style={{ border: '1px solid #D4EDE0', height: 'min(68vh, 640px)', minHeight: 380, touchAction: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      <svg ref={svgRef} width="100%" height="100%"
        viewBox={`${view.x} ${view.y} ${view.w} ${vh}`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <defs>
          <radialGradient id="harvestGrad">
            <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFD54F" stopOpacity="0" />
          </radialGradient>
          <pattern id="grassDots" width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M8 12 q2 -6 4 0" stroke="rgba(74,124,89,0.3)" strokeWidth="1.2" fill="none" />
            <path d="M30 34 q2 -6 4 0" stroke="rgba(74,124,89,0.24)" strokeWidth="1.2" fill="none" />
            <path d="M20 25 q2 -5 3.5 0" stroke="rgba(74,124,89,0.18)" strokeWidth="1" fill="none" />
          </pattern>
          <pattern id="dirtDots" width="38" height="38" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="12" r="1.2" fill="rgba(150,125,90,0.28)" />
            <circle cx="27" cy="29" r="1.5" fill="rgba(150,125,90,0.2)" />
            <circle cx="19" cy="22" r="0.9" fill="rgba(150,125,90,0.16)" />
          </pattern>
          <filter id="bedShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3A3020" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* outside the yard: bare ground */}
        <rect x={-400} y={-400} width={WORLD.w + 800} height={WORLD.h + 800} fill="#E7DFCB" />
        <rect x={-400} y={-400} width={WORLD.w + 800} height={WORLD.h + 800} fill="url(#dirtDots)" />

        {/* yard grass tiles (tone variation like patches of lawn) */}
        <g>
          {yardTiles.map(key => {
            const [r, c] = key.split('-').map(Number)
            return (
              <g key={key}>
                <rect x={c * TILE} y={r * TILE} width={TILE + 0.5} height={TILE + 0.5} fill={grassTone(r, c)} />
                <rect x={c * TILE} y={r * TILE} width={TILE} height={TILE} fill="url(#grassDots)" />
              </g>
            )
          })}
        </g>

        {/* yard edge: outline + soft southern lip for depth */}
        <g pointerEvents="none">
          {yardTiles.map(key => {
            const [r, c] = key.split('-').map(Number)
            const x = c * TILE, y = r * TILE
            const edges = []
            if (!yard.has(`${r - 1}-${c}`)) edges.push(<line key="n" x1={x} y1={y} x2={x + TILE} y2={y} stroke="#9DB97C" strokeWidth={3} />)
            if (!yard.has(`${r + 1}-${c}`)) edges.push(
              <g key="s">
                <rect x={x} y={y + TILE - 5} width={TILE} height={5} fill="rgba(90,115,60,0.30)" />
                <line x1={x} y1={y + TILE} x2={x + TILE} y2={y + TILE} stroke="#8CA96C" strokeWidth={3} />
              </g>
            )
            if (!yard.has(`${r}-${c - 1}`)) edges.push(<line key="w" x1={x} y1={y} x2={x} y2={y + TILE} stroke="#9DB97C" strokeWidth={3} />)
            if (!yard.has(`${r}-${c + 1}`)) edges.push(<line key="e" x1={x + TILE} y1={y} x2={x + TILE} y2={y + TILE} stroke="#9DB97C" strokeWidth={3} />)
            return edges.length ? <g key={key}>{edges}</g> : null
          })}
        </g>

        {/* yard edit grid */}
        {mode === 'yard' && (
          <g pointerEvents="none">
            {Array.from({ length: YARD_ROWS + 1 }, (_, r) => (
              <line key={`h${r}`} x1={0} y1={r * TILE} x2={WORLD.w} y2={r * TILE}
                stroke="rgba(74,124,89,0.25)" strokeWidth={1} />
            ))}
            {Array.from({ length: YARD_COLS + 1 }, (_, c) => (
              <line key={`v${c}`} x1={c * TILE} y1={0} x2={c * TILE} y2={WORLD.h}
                stroke="rgba(74,124,89,0.25)" strokeWidth={1} />
            ))}
            <rect x={0} y={0} width={WORLD.w} height={WORLD.h} fill="none"
              stroke="#4A7C59" strokeWidth={2} strokeDasharray="8 6" />
          </g>
        )}

        {mode !== 'yard' && beds.map(bed => (
          <Bed key={bed.id} bed={bed} today={today}
            entries={planted.filter(p => p.bedId === bed.id)}
            catalogById={catalogById}
            badPairs={badPairs.filter(p => Number(p.bedId) === bed.id)}
            editMode={mode === 'beds'}
            invalid={invalidBedId === bed.id}
            justPlantedUid={justPlantedUid} wateringUid={wateringUid}
            onCellTap={tapGuard((b, cell) => setPicker({ bed: b, cell }))}
            onPlantTap={tapGuard(entry => setSheet(entry))}
            onBedPointerDown={onBedPointerDown}
            onRemoveBed={onRemoveBed} />
        ))}

        {mode !== 'yard' && <Critters phase={phase} bloomSpots={bloomSpots} />}

        {/* day/night tint */}
        {style.overlay && (
          <rect x={-400} y={-400} width={WORLD.w + 800} height={WORLD.h + 800}
            fill={style.overlay} pointerEvents="none" />
        )}
        {phase === 'night' && (
          <g pointerEvents="none">
            {STARS.map(([sx, sy], i) => (
              <circle key={i} className="firefly" cx={sx} cy={sy} r={1.1} fill="#fff"
                style={{ animationDelay: `${i * 0.9}s`, animationDuration: '9s' }} />
            ))}
            <circle cx={WORLD.w - 130} cy={70} r={34} fill="#F6F1DC" opacity="0.12" />
            <circle cx={WORLD.w - 130} cy={70} r={21} fill="#F6F1DC" opacity="0.85" />
            <circle cx={WORLD.w - 138} cy={64} r={5} fill="rgba(200,195,170,0.5)" />
            <circle cx={WORLD.w - 124} cy={76} r={3.5} fill="rgba(200,195,170,0.4)" />
          </g>
        )}
      </svg>

      {/* controls */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button onClick={() => setMode(m => m === 'yard' ? 'view' : 'yard')}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: mode === 'yard' ? '#4A7C59' : '#fff', color: mode === 'yard' ? '#fff' : '#4A7C59', border: '1px solid #D4EDE0' }}
          aria-label={mode === 'yard' ? 'Готово с двора' : 'Оформи двора'}>
          {mode === 'yard' ? <Check size={18} /> : <Fence size={16} />}
        </button>
        <button onClick={() => setMode(m => m === 'beds' ? 'view' : 'beds')}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: mode === 'beds' ? '#4A7C59' : '#fff', color: mode === 'beds' ? '#fff' : '#4A7C59', border: '1px solid #D4EDE0' }}
          aria-label={mode === 'beds' ? 'Готово' : 'Подреди лехите'}>
          {mode === 'beds' ? <Check size={18} /> : <Pencil size={16} />}
        </button>
        <button onClick={() => setShowBedForm(true)}
          className="h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-sm font-semibold"
          style={{ background: '#4A7C59', color: '#fff' }}>
          <Plus size={15} strokeWidth={2.5} /> Леха
        </button>
      </div>

      {(toast || hint) && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
          style={toast
            ? { background: '#FDF3DC', color: '#7A4A00', border: '1px solid #EAD9B0' }
            : { background: 'rgba(255,255,255,0.9)', color: '#4A7C59' }}>
          {toast || hint}
        </p>
      )}

      {beds.length === 0 && !showBedForm && mode === 'view' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm px-4 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.85)', color: '#6A9E78' }}>
            Дворът е празен — добави първата си леха
          </p>
        </div>
      )}

      {showBedForm && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(20,30,25,0.35)' }} onClick={() => setShowBedForm(false)}>
          <div className="rounded-2xl p-5 w-full max-w-xs" style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="mb-3" style={{ color: '#1E3A2F' }}>Нова леха</h2>
            <input type="text" placeholder={`Леха ${beds.length + 1}`} value={bedName}
              onChange={e => setBedName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none"
              style={{ border: '1px solid #D4EDE0', background: '#F5F2EC', color: '#1C2B23' }} />
            <div className="flex gap-3 mb-4">
              <label className="flex-1 text-xs" style={{ color: '#6A9E78' }}>
                Редове
                <input type="number" min={1} max={6} value={bedRows}
                  onChange={e => setBedRows(Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none"
                  style={{ border: '1px solid #D4EDE0', background: '#F5F2EC', color: '#1C2B23' }} />
              </label>
              <label className="flex-1 text-xs" style={{ color: '#6A9E78' }}>
                Колони
                <input type="number" min={1} max={8} value={bedCols}
                  onChange={e => setBedCols(Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none"
                  style={{ border: '1px solid #D4EDE0', background: '#F5F2EC', color: '#1C2B23' }} />
              </label>
            </div>
            <button onClick={addBed}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#4A7C59', color: '#fff' }}>
              Добави лехата
            </button>
          </div>
        </div>
      )}

      {picker && (
        <PlantPicker bed={picker.bed}
          bedEntries={planted.filter(p => p.bedId === picker.bed.id)}
          unassigned={unassigned}
          onPick={handlePick} onClose={() => setPicker(null)} />
      )}

      {sheet && (
        <PlantSheet entry={plants.find(p => p.uid === sheet.uid) || sheet}
          bedName={beds.find(b => b.id === sheet.bedId)?.name || ''}
          today={today}
          onWater={handleWater}
          onUnassign={uid => { onUnassign(uid); setSheet(null) }}
          onClose={() => setSheet(null)} />
      )}
    </div>
  )
}
