import { X } from 'lucide-react'
import PlantSprite from './PlantSprite'

export const CELL = 52
export const BED_PAD = 8

export function bedSize(bed) {
  return { w: bed.cols * CELL + BED_PAD * 2, h: bed.rows * CELL + BED_PAD * 2 }
}

export function cellCenter(bed, cell) {
  return {
    x: bed.x + BED_PAD + cell.col * CELL + CELL / 2,
    y: bed.y + BED_PAD + cell.row * CELL + CELL / 2,
  }
}

export default function Bed({
  bed, entries, catalogById, badPairs, today,
  editMode, invalid, justPlantedUid, wateringUid,
  onCellTap, onPlantTap, onBedPointerDown, onRemoveBed, onWarningTap,
}) {
  const { w, h } = bedSize(bed)
  const byCell = {}
  entries.forEach(e => { byCell[`${e.cell.row}-${e.cell.col}`] = e })

  const cells = []
  for (let r = 0; r < bed.rows; r++) {
    for (let c = 0; c < bed.cols; c++) cells.push({ row: r, col: c })
  }

  const labelW = bed.name.length * 7.2 + 18

  return (
    <g
      onPointerDown={editMode ? e => onBedPointerDown(e, bed) : undefined}
      style={editMode ? { cursor: 'grab' } : undefined}
    >
      {/* soil */}
      <rect x={bed.x} y={bed.y} width={w} height={h} rx={12}
        fill="#8A6644" stroke="#6E4F33" strokeWidth={3} filter="url(#bedShadow)" />
      <rect x={bed.x + 4} y={bed.y + 4} width={w - 8} height={h - 8} rx={9}
        fill="#7A5A3C" />
      {/* top-light edge for depth */}
      <rect x={bed.x + 4} y={bed.y + 4} width={w - 8} height={5} rx={2.5}
        fill="rgba(255,255,255,0.08)" />

      {/* cell grid */}
      {cells.map(cell => {
        const { x, y } = cellCenter(bed, cell)
        const occupied = byCell[`${cell.row}-${cell.col}`]
        return (
          <g key={`${cell.row}-${cell.col}`}>
            <rect
              x={x - CELL / 2 + 3} y={y - CELL / 2 + 3}
              width={CELL - 6} height={CELL - 6} rx={7}
              fill={occupied ? 'transparent' : 'rgba(0,0,0,0.13)'}
              stroke="rgba(0,0,0,0.10)" strokeWidth={1}
              style={!editMode && !occupied ? { cursor: 'pointer' } : undefined}
              onClick={!editMode && !occupied ? e => { e.stopPropagation(); onCellTap(bed, cell) } : undefined}
            />
            {!occupied && !editMode && (
              <g pointerEvents="none">
                <circle cx={x} cy={y} r={8} fill="none"
                  stroke="rgba(255,255,255,0.28)" strokeWidth={1.3} strokeDasharray="3 3" />
                <text x={x} y={y + 3.8} textAnchor="middle" fontSize="11"
                  fill="rgba(255,255,255,0.4)" style={{ userSelect: 'none' }}>+</text>
              </g>
            )}
          </g>
        )
      })}

      {/* plants */}
      {entries.map(e => {
        const { x, y } = cellCenter(bed, e.cell)
        const thirsty = e.nextWatering <= today
        return (
          <PlantSprite key={e.uid} entry={e} cat={catalogById[e.plantId]}
            cx={x} cy={y} thirsty={thirsty}
            justPlanted={e.uid === justPlantedUid}
            watering={e.uid === wateringUid}
            onTap={onPlantTap} />
        )
      })}

      {/* bad neighbor warnings */}
      {badPairs.map((p, i) => {
        const a = cellCenter(bed, p.a.cell)
        const b = cellCenter(bed, p.b.cell)
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        return (
          <g key={i}>
            <line className="bad-link" x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="#E74C3C" strokeWidth={2} strokeDasharray="7 7" opacity={0.8} pointerEvents="none" />
            <g onClick={e => { e.stopPropagation(); onWarningTap(p) }} style={{ cursor: 'pointer' }}>
              <circle cx={mx} cy={my} r={10} fill="#fff" stroke="#E74C3C" strokeWidth={1.5} />
              <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="10" pointerEvents="none">⚠</text>
            </g>
          </g>
        )
      })}

      {/* name chip */}
      <g pointerEvents="none">
        <rect x={bed.x} y={bed.y - 22} width={labelW} height={17} rx={8.5}
          fill="rgba(255,255,255,0.88)" />
        <text x={bed.x + 9} y={bed.y - 10} fontSize="10.5" fontWeight="600"
          fill="#4A3A28" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', userSelect: 'none' }}>
          {bed.name}
        </text>
      </g>

      {editMode && (
        <g onClick={e => { e.stopPropagation(); onRemoveBed(bed.id) }} style={{ cursor: 'pointer' }}
          onPointerDown={e => e.stopPropagation()}>
          <circle cx={bed.x + w} cy={bed.y} r={10} fill="#E74C3C" />
          <X size={12} x={bed.x + w - 6} y={bed.y - 6} color="#fff" strokeWidth={3} />
        </g>
      )}
      {editMode && (
        <rect x={bed.x - 4} y={bed.y - 4} width={w + 8} height={h + 8} rx={14}
          fill="none" stroke={invalid ? '#E74C3C' : '#4A7C59'} strokeWidth={2}
          strokeDasharray="6 5" pointerEvents="none" />
      )}
    </g>
  )
}
