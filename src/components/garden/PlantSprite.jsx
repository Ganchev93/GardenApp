import { growthStage, isHarvestMonth } from '../../lib/growth'

// One plant inside a bed cell. Pure SVG, animations via CSS classes.
export default function PlantSprite({ entry, cat, cx, cy, thirsty, justPlanted, watering, onTap }) {
  const stage = growthStage(entry.plantedAt, entry.category)
  const harvest = stage === 'mature' && isHarvestMonth(cat?.calendar)
  // Randomized but stable per-plant sway rhythm
  const swayDur = 2.8 + (entry.uid % 17) / 10
  const swayDelay = -((entry.uid % 31) / 10)

  return (
    <g onClick={e => { e.stopPropagation(); onTap(entry) }} style={{ cursor: 'pointer' }}>
      <ellipse cx={cx} cy={cy + 14} rx={12} ry={3.5} fill="rgba(0,0,0,0.10)" />

      {harvest && (
        <circle className="harvest-glow" cx={cx} cy={cy} r={17} fill="url(#harvestGrad)" />
      )}

      <g className={justPlanted ? 'sprout-pop' : undefined}>
        <g
          className="plant-sway"
          style={{ animationDuration: `${swayDur}s`, animationDelay: `${swayDelay}s` }}
        >
          {stage === 'seed' && (
            <>
              <ellipse cx={cx} cy={cy + 11} rx={7} ry={4} fill="#5C4330" />
              <text x={cx} y={cy + 6} textAnchor="middle" fontSize="9">🌱</text>
            </>
          )}
          {stage === 'sprout' && (
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="15">🌱</text>
          )}
          {stage === 'young' && (
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="15" opacity="0.88">{entry.emoji}</text>
          )}
          {stage === 'mature' && (
            <text x={cx} y={cy + 13} textAnchor="middle" fontSize="21"
              style={thirsty ? { filter: 'saturate(0.55)' } : undefined}>
              {entry.emoji}
            </text>
          )}
        </g>
      </g>

      {thirsty && (
        <text className="thirsty-bob" x={cx + 12} y={cy - 10} fontSize="10">💧</text>
      )}

      {watering && (
        <g>
          <circle className="drop-fall" cx={cx - 6} cy={cy - 6} r={1.8} fill="#3B82F6" />
          <circle className="drop-fall" cx={cx} cy={cy - 9} r={2.2} fill="#3B82F6" style={{ animationDelay: '0.15s' }} />
          <circle className="drop-fall" cx={cx + 6} cy={cy - 5} r={1.8} fill="#3B82F6" style={{ animationDelay: '0.3s' }} />
        </g>
      )}
    </g>
  )
}
