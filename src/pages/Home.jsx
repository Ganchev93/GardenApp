import { Link } from 'react-router-dom'
import { Check, Droplets, Sprout, BookOpen, Camera, ChevronRight } from 'lucide-react'
import WeatherWidget from '../components/WeatherWidget'
import { todayStr, toDateStr } from '../lib/garden'
import { useAuth } from '../hooks/useAuth'
import { useGarden } from '../hooks/useGarden'
import { plants as catalog } from '../data/plants'
import gardenImg from '../assets/garden.png'

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Добро утро'
  if (h >= 12 && h < 18) return 'Добър ден'
  if (h >= 18 && h < 23) return 'Добър вечер'
  return 'Лека нощ'
}

function daysLabel(n) {
  return n === 1 ? 'след 1 ден' : `след ${n} дни`
}

function addDaysStr(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Home() {
  const { user } = useAuth()
  const firstName = (user?.displayName || '').split(' ')[0]
  const { plants: myPlants, markWatered: water, markFertilized: fertilize } = useGarden(user?.uid)
  const today = todayStr()

  function markWatered(id) {
    const p = myPlants.find(p => p.id === id)
    if (p) water(id, p.watering_frequency_days)
  }
  function markFertilized(id) {
    const p = myPlants.find(p => p.id === id)
    if (p) fertilize(id, p.fertilizing_frequency_days)
  }

  const dueTasks = []
  let doneToday = 0
  myPlants.forEach(p => {
    const nextW = toDateStr(p.nextWatering)
    const nextF = toDateStr(p.nextFertilizing)
    if (nextW <= today) dueTasks.push({ ...p, type: 'water' })
    else if (toDateStr(p.lastWatered) === today) doneToday++
    if (nextF && nextF <= today) dueTasks.push({ ...p, type: 'fertilize' })
    else if (nextF && toDateStr(p.lastFertilized) === today) doneToday++
  })
  const totalToday = dueTasks.length + doneToday

  const limit = addDaysStr(today, 7)
  const upcoming = []
  myPlants.forEach(p => {
    const nextW = toDateStr(p.nextWatering)
    const nextF = toDateStr(p.nextFertilizing)
    if (nextW > today && nextW <= limit)
      upcoming.push({ ...p, type: 'water', date: nextW })
    if (nextF && nextF > today && nextF <= limit)
      upcoming.push({ ...p, type: 'fertilize', date: nextF })
  })
  upcoming.sort((a, b) => a.date.localeCompare(b.date))

  const dateLine = new Date().toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      <div className="anim-fade mb-5">
        <h1 style={{ color: '#1E3A2F' }}>{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-sm mt-1 capitalize" style={{ color: '#6A9E78' }}>{dateLine}</p>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
      <div>
      {myPlants.length === 0 ? (
        <div className="anim-fade rounded-3xl pt-4 pb-6 px-6 text-center mb-5" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
          <img src={gardenImg} alt="Градина" className="w-56 h-56 mx-auto object-contain" />
          <p className="font-semibold mb-1" style={{ color: '#1C2B23' }}>Градината е празна</p>
          <p className="text-sm mb-4" style={{ color: '#6A9E78' }}>Добавете растения за да следите графика</p>
          <Link
            to="/garden"
            className="inline-block px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#4A7C59', color: '#fff' }}
          >
            + Добави растение
          </Link>
        </div>
      ) : (
        <TodayCard
          dueTasks={dueTasks}
          doneToday={doneToday}
          totalToday={totalToday}
          onWater={markWatered}
          onFertilize={markFertilized}
        />
      )}

      <WeatherWidget />
      </div>

      <div>
      {upcoming.length > 0 && (
        <section className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6A9E78' }}>
            Предстоящо
          </p>
          <div>
            {upcoming.slice(0, 5).map((t, i) => (
              <UpcomingRow key={`${t.id}-${t.type}`} task={t} today={today} last={i === Math.min(upcoming.length, 5) - 1} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/plants" className="rounded-2xl p-4 transition-opacity hover:opacity-90"
          style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
          <BookOpen size={20} style={{ color: '#4A7C59' }} className="mb-2" />
          <div className="font-semibold text-sm" style={{ color: '#1C2B23' }}>База растения</div>
          <div className="text-xs mt-0.5" style={{ color: '#6A9E78' }}>{catalog.length} вида</div>
        </Link>
        <Link to="/analyze" className="rounded-2xl p-4 transition-opacity hover:opacity-90"
          style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
          <Camera size={20} style={{ color: '#4A7C59' }} className="mb-2" />
          <div className="font-semibold text-sm" style={{ color: '#1C2B23' }}>AI Анализ</div>
          <div className="text-xs mt-0.5" style={{ color: '#6A9E78' }}>Снимай растение</div>
        </Link>
      </div>
      </div>
      </div>
    </div>
  )
}

function ProgressRing({ done, total }) {
  const r = 24
  const c = 2 * Math.PI * r
  const ratio = total > 0 ? done / total : 1
  return (
    <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
        {done}/{total}
      </div>
    </div>
  )
}

function TodayCard({ dueTasks, doneToday, totalToday, onWater, onFertilize }) {
  const allDone = dueTasks.length === 0
  return (
    <div className="anim-fade rounded-3xl p-5 mb-5 text-white"
      style={{ background: 'linear-gradient(135deg, #4A7C59 0%, #2D5540 100%)' }}>
      <div className="flex items-center gap-4 mb-1">
        <ProgressRing done={doneToday} total={Math.max(totalToday, 1)} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ opacity: 0.7 }}>Днес</div>
          <div className="font-semibold text-lg leading-tight" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            {allDone
              ? (totalToday > 0 ? 'Всичко е готово' : 'Няма задачи днес')
              : `${dueTasks.length} ${dueTasks.length === 1 ? 'задача чака' : 'задачи чакат'}`}
          </div>
        </div>
      </div>

      {dueTasks.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {dueTasks.map(t => {
            const isWater = t.type === 'water'
            return (
              <div key={`${t.id}-${t.type}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.13)' }}>
                <span className="text-lg leading-none shrink-0">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{t.name}</div>
                  <div className="flex items-center gap-1 text-xs" style={{ opacity: 0.75 }}>
                    {isWater ? <Droplets size={12} /> : <Sprout size={12} />}
                    {isWater ? 'Поливане' : 'Торене'}
                  </div>
                </div>
                <button
                  onClick={() => isWater ? onWater(t.id) : onFertilize(t.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
                  style={{ background: '#fff', color: '#2D5540' }}
                  aria-label="Готово"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function UpcomingRow({ task, today, last }) {
  const isWater = task.type === 'water'
  const daysUntil = Math.max(1, Math.ceil((new Date(task.date) - new Date(today)) / 86400000))
  return (
    <div className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: last ? 'none' : '1px solid #E3DED4' }}>
      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: isWater ? '#EFF8FF' : '#E8F5F0', color: isWater ? '#3B82F6' : '#4A7C59' }}>
        {isWater ? <Droplets size={14} /> : <Sprout size={14} />}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium" style={{ color: '#1C2B23' }}>{task.name}</span>
        <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{isWater ? 'поливане' : 'торене'}</span>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: '#6A9E78' }}>
        {daysLabel(daysUntil)}
        <ChevronRight size={13} style={{ color: '#B3D9C4' }} />
      </div>
    </div>
  )
}
