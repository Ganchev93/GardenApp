import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import WeatherWidget from '../components/WeatherWidget'

const STORAGE_KEY = 'my_garden_plants'

function loadGarden() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

export default function Home() {
  const myPlants = loadGarden()
  const today = new Date().toISOString().slice(0, 10)

  const dueTasks = useMemo(() => {
    const tasks = []
    myPlants.forEach(p => {
      if (p.nextWatering <= today) tasks.push({ ...p, type: 'water', label: 'Полей', color: 'blue' })
      if (p.nextFertilizing <= today) tasks.push({ ...p, type: 'fertilize', label: 'Тори', color: 'green' })
    })
    return tasks
  }, [myPlants, today])

  const upcoming = useMemo(() => {
    const in7 = new Date()
    in7.setDate(in7.getDate() + 7)
    const limit = in7.toISOString().slice(0, 10)
    const tasks = []
    myPlants.forEach(p => {
      if (p.nextWatering > today && p.nextWatering <= limit)
        tasks.push({ ...p, type: 'water', date: p.nextWatering })
      if (p.nextFertilizing > today && p.nextFertilizing <= limit)
        tasks.push({ ...p, type: 'fertilize', date: p.nextFertilizing })
    })
    return tasks.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
  }, [myPlants, today])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Добро утро'
    if (h < 18) return 'Добър ден'
    return 'Добър вечер'
  }

  return (
    <div>
      <WeatherWidget />

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-green-800">{greeting()} 🌿</h1>
        <p className="text-gray-400 text-sm">
          {myPlants.length === 0
            ? 'Добавете растения в "Моята градина"'
            : `${myPlants.length} растения · ${dueTasks.length} задачи днес`}
        </p>
      </div>

      {myPlants.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-semibold text-gray-700 mb-1">Градината е празна</p>
          <p className="text-sm text-gray-400 mb-4">Добавете растения за да следите графика</p>
          <Link
            to="/garden"
            className="inline-block bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700"
          >
            + Добави растение
          </Link>
        </div>
      )}

      {dueTasks.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-1">
            🔔 За днес ({dueTasks.length})
          </h2>
          <div className="grid gap-2">
            {dueTasks.map((t, i) => (
              <TaskCard key={i} task={t} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Предстоящо (7 дни)</h2>
          <div className="grid gap-2">
            {upcoming.map((t, i) => (
              <UpcomingCard key={i} task={t} />
            ))}
          </div>
        </section>
      )}

      {myPlants.length > 0 && dueTasks.length === 0 && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-semibold text-green-700">Всичко е наред!</p>
          <p className="text-sm text-green-500 mt-1">Няма задачи за днес</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link to="/plants" className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:bg-green-50 transition-colors">
          <div className="text-2xl mb-1">🌿</div>
          <div className="font-semibold text-gray-700 text-sm">База растения</div>
          <div className="text-xs text-gray-400">40 вида</div>
        </Link>
        <Link to="/analyze" className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:bg-green-50 transition-colors">
          <div className="text-2xl mb-1">📷</div>
          <div className="font-semibold text-gray-700 text-sm">AI Анализ</div>
          <div className="text-xs text-gray-400">Снимай растение</div>
        </Link>
      </div>
    </div>
  )
}

function TaskCard({ task }) {
  const isWater = task.type === 'water'
  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
      isWater ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'
    }`}>
      <span className="text-xl">{task.emoji}</span>
      <div className="flex-1">
        <div className="font-semibold text-gray-800 text-sm">{task.name}</div>
        <div className={`text-xs font-medium ${isWater ? 'text-blue-500' : 'text-red-500'}`}>
          {isWater ? '💧 Нужда от поливане' : '🌱 Нужда от торене'}
        </div>
      </div>
      <Link
        to="/garden"
        className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
          isWater ? 'bg-blue-500 text-white' : 'bg-green-600 text-white'
        }`}
      >
        Виж →
      </Link>
    </div>
  )
}

function UpcomingCard({ task }) {
  const isWater = task.type === 'water'
  const daysUntil = Math.ceil((new Date(task.date) - new Date()) / 86400000)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
      <span className="text-xl">{task.emoji}</span>
      <div className="flex-1">
        <div className="font-semibold text-gray-800 text-sm">{task.name}</div>
        <div className="text-xs text-gray-400">{isWater ? '💧 Поливане' : '🌱 Торене'}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold text-gray-600">след {daysUntil} дни</div>
        <div className="text-xs text-gray-400">{task.date}</div>
      </div>
    </div>
  )
}
