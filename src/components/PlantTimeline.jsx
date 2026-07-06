import { useState, Fragment } from 'react'

const MONTH_INITIALS = ['Я', 'Ф', 'М', 'А', 'М', 'Ю', 'Ю', 'А', 'С', 'О', 'Н', 'Д']

export const ACTIVITIES = [
  { key: 'sow',     label: 'Сеитба',    short: 'Засей',  color: '#4A7C59', now: 'време за сеитба' },
  { key: 'plant',   label: 'Засаждане', short: 'Засади', color: '#7BB88F', now: 'време за засаждане' },
  { key: 'prune',   label: 'Резитба',   short: 'Режи',   color: '#3B82F6', now: 'време за резитба' },
  { key: 'bloom',   label: 'Цъфтеж',    short: 'Цъфти',  color: '#C75B8E', now: 'цъфти' },
  { key: 'harvest', label: 'Беритба',   short: 'Бери',   color: '#C97D0E', now: 'време за беритба' },
]

export default function PlantTimeline({ calendar }) {
  const [showNote, setShowNote] = useState(false)
  const month = new Date().getMonth() + 1
  const rows = ACTIVITIES.filter(a => calendar[a.key]?.length > 0)
  const nowActs = rows.filter(a => calendar[a.key].includes(month)).map(a => a.now)

  return (
    <div>
      <div className="relative">
        {/* "today" marker across all rows */}
        <div
          className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
          style={{ left: `calc(58px + (100% - 58px) * ${(month - 0.5) / 12})`, background: '#1E3A2F', opacity: 0.4 }}
        />
        <div className="grid gap-y-1.5 items-center" style={{ gridTemplateColumns: '58px repeat(12, 1fr)' }}>
          <div />
          {MONTH_INITIALS.map((mi, i) => (
            <div key={i} className="text-center text-[10px] font-bold"
              style={{ color: i + 1 === month ? '#1E3A2F' : '#B3D9C4' }}>
              {mi}
            </div>
          ))}
          {rows.map(a => (
            <Fragment key={a.key}>
              <div className="text-[10px] font-semibold pr-1.5" style={{ color: '#6A9E78' }}>{a.label}</div>
              {MONTH_INITIALS.map((_, i) => {
                const on = calendar[a.key].includes(i + 1)
                return (
                  <div
                    key={i}
                    onClick={() => on && calendar.note && setShowNote(s => !s)}
                    className="h-3.5 mx-px rounded-sm"
                    style={{ background: on ? a.color : '#F0EBE3', cursor: on && calendar.note ? 'pointer' : 'default' }}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="text-xs mt-3 font-medium" style={{ color: nowActs.length ? '#1E3A2F' : '#9CA3AF' }}>
        {nowActs.length ? `Сега: ${nowActs.join(', ')}` : 'Няма задачи този месец'}
      </div>

      {showNote && calendar.note && (
        <div className="text-xs mt-2 rounded-xl p-3" style={{ background: '#fff', border: '1px solid #E8E3D9', color: '#1C2B23' }}>
          {calendar.note}
        </div>
      )}
    </div>
  )
}
