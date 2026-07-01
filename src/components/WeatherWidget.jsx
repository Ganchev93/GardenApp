import { useState, useEffect } from 'react'
import {
  Droplets, Wind, Sunrise, Sunset, ChevronDown, ChevronUp,
  Info, AlertTriangle, AlertCircle, CheckCircle2, CloudRain, Cloud, Sun,
} from 'lucide-react'

const OWM_KEY = import.meta.env.VITE_OWM_KEY

function formatTime(unixTs) {
  return new Date(unixTs * 1000).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
}

function getGardenAdvice(current, forecast) {
  const advice = []
  const temp = current.main.temp
  const humidity = current.main.humidity
  const windSpeed = current.wind.speed
  const isRainingNow = current.weather[0].main === 'Rain' || current.weather[0].main === 'Drizzle'

  const next24h = forecast.list.slice(0, 8)
  const rainSoon = next24h.some(f => f.weather[0].main === 'Rain' || f.weather[0].main === 'Drizzle')
  const rainAmount = next24h.reduce((sum, f) => sum + (f.rain?.['3h'] || 0), 0)

  const next48h = forecast.list.slice(0, 16)
  const frostComing = next48h.some(f => f.main.temp_min <= 2)
  const frostTemp = frostComing ? Math.min(...next48h.map(f => f.main.temp_min)) : null

  // Поливане
  if (isRainingNow) {
    advice.push({ text: 'Вали в момента — не поливай днес', type: 'info' })
  } else if (rainSoon && rainAmount > 5) {
    advice.push({ text: `Очаква се дъжд (${rainAmount.toFixed(0)}мм) — пропусни поливането`, type: 'info' })
  } else if (temp > 30 && humidity < 40) {
    advice.push({ text: 'Горещо и сухо — удвой поливането, поливай вечерта след 19:00', type: 'warning' })
  } else if (temp > 25) {
    advice.push({ text: 'Топло — поливай преди 9:00 сутринта или след залез слънце', type: 'info' })
  } else if (temp >= 10) {
    advice.push({ text: 'Умерено — поливай по нормален график, сутрин е най-добре', type: 'success' })
  } else {
    advice.push({ text: 'Хладно — намали поливането, почвата изсъхва бавно', type: 'info' })
  }

  // Слана
  if (frostComing && frostTemp !== null) {
    advice.push({ text: `Слана се очаква (${frostTemp.toFixed(0)}°C) — прибери чувствителните растения`, type: 'danger' })
  }

  // Влажност / болести
  if (humidity > 80 && temp > 18) {
    advice.push({ text: 'Висока влажност — провери доматите и лозата за мана и гниене', type: 'warning' })
  } else if (humidity < 35 && temp > 20) {
    advice.push({ text: 'Много сухо — пръскай листата рано сутринта, мулчирай почвата', type: 'warning' })
  }

  // Вятър
  if (windSpeed >= 8) {
    advice.push({ text: `Силен вятър (${windSpeed.toFixed(0)} м/с) — не пръскай, подпри високите растения`, type: 'warning' })
  } else if (windSpeed < 3 && !isRainingNow && !rainSoon && temp >= 10 && temp <= 28) {
    advice.push({ text: 'Тихо и подходящо — идеални условия за пръскане с натурални препарати', type: 'success' })
  }

  // Екстремна жега
  if (temp > 35) {
    advice.push({ text: 'Екстремна жега — не сади и не режи днес, растенията са под стрес', type: 'danger' })
  }

  const priority = { danger: 0, warning: 1, info: 2, success: 3 }
  return advice.sort((a, b) => priority[a.type] - priority[b.type])
}

const adviceStyle = {
  info:    { background: '#EFF8FF', color: '#1C3A5E', Icon: Info },
  warning: { background: '#FDF3DC', color: '#7A4A00', Icon: AlertTriangle },
  danger:  { background: '#FFF0F0', color: '#7F1D1D', Icon: AlertCircle },
  success: { background: '#E8F5F0', color: '#1E3A2F', Icon: CheckCircle2 },
}

function AdviceLine({ advice }) {
  const s = adviceStyle[advice.type]
  return (
    <div className="rounded-xl px-3 py-2 text-xs flex items-start gap-2"
      style={{ background: s.background, color: s.color }}>
      <s.Icon size={14} className="shrink-0 mt-0.5" />
      <span>{advice.text}</span>
    </div>
  )
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!OWM_KEY) { setError('Няма OWM ключ'); setLoading(false); return }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude: lat, longitude: lon } = coords
          const [wRes, fRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&lang=bg`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&lang=bg`)
          ])
          const [w, f] = await Promise.all([wRes.json(), fRes.json()])
          setWeather(w)
          setForecast(f)
        } catch {
          setError('Грешка при зареждане на времето')
        } finally {
          setLoading(false)
        }
      },
      () => { setError('Разреши достъп до локация за прогноза'); setLoading(false) }
    )
  }, [])

  if (loading) return (
    <div className="rounded-2xl p-4 mb-5 animate-pulse" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
      <div className="h-4 rounded w-1/2 mb-2" style={{ background: '#F0EBE3' }} />
      <div className="h-7 rounded w-1/3" style={{ background: '#F0EBE3' }} />
    </div>
  )

  if (error) return (
    <div className="rounded-2xl p-4 mb-5 text-sm flex items-center gap-2"
      style={{ background: '#fff', border: '1px solid #D4EDE0', color: '#9CA3AF' }}>
      <Cloud size={16} /> {error}
    </div>
  )

  if (!weather || !forecast) return null

  const advice = getGardenAdvice(weather, forecast)
  const [topAdvice, ...restAdvice] = advice

  const next3days = [1, 2, 3].map(dayOffset => {
    const target = new Date()
    target.setDate(target.getDate() + dayOffset)
    const dayStr = target.toISOString().slice(0, 10)
    const entries = forecast.list.filter(f => f.dt_txt.startsWith(dayStr))
    if (!entries.length) return null
    const temps = entries.map(e => e.main.temp)
    const hasRain = entries.some(e => e.weather[0].main === 'Rain')
    const hasCloud = entries.some(e => e.weather[0].main === 'Clouds')
    return {
      label: target.toLocaleDateString('bg-BG', { weekday: 'short' }),
      min: Math.min(...temps).toFixed(0),
      max: Math.max(...temps).toFixed(0),
      Icon: hasRain ? CloudRain : hasCloud ? Cloud : Sun,
    }
  }).filter(Boolean)

  return (
    <div className="rounded-2xl mb-5 overflow-hidden" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold leading-none" style={{ color: '#1C2B23' }}>
            {weather.main.temp.toFixed(0)}°
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium capitalize truncate" style={{ color: '#1C2B23' }}>
              {weather.weather[0].description}
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>{weather.name}</div>
          </div>
          <div className="flex items-center gap-3 text-xs shrink-0" style={{ color: '#6A9E78' }}>
            <span className="flex items-center gap-1"><Droplets size={13} />{weather.main.humidity}%</span>
            <span className="flex items-center gap-1"><Wind size={13} />{weather.wind.speed.toFixed(0)}</span>
            {expanded ? <ChevronUp size={16} style={{ color: '#B3D9C4' }} /> : <ChevronDown size={16} style={{ color: '#B3D9C4' }} />}
          </div>
        </div>
      </button>

      <div className="px-4 pb-3">
        <AdviceLine advice={topAdvice} />
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 anim-fade">
          {restAdvice.map((a, i) => <AdviceLine key={i} advice={a} />)}

          {next3days.length > 0 && (
            <div className="flex gap-2 pt-1">
              {next3days.map((d, i) => (
                <div key={i} className="flex-1 rounded-xl p-2 text-center text-xs"
                  style={{ background: '#F5F2EC', color: '#1C2B23' }}>
                  <div className="font-medium capitalize">{d.label}</div>
                  <d.Icon size={18} className="mx-auto my-1" style={{ color: '#4A7C59' }} />
                  <div>{d.min}° / {d.max}°</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-xs pt-1" style={{ color: '#9CA3AF' }}>
            <span className="flex items-center gap-1"><Sunrise size={13} /> {formatTime(weather.sys.sunrise)}</span>
            <span className="flex items-center gap-1"><Sunset size={13} /> {formatTime(weather.sys.sunset)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
