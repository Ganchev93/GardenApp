import { useState, useEffect } from 'react'

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
    advice.push({ icon: '🌧️', text: 'Вали в момента — не поливай днес', type: 'info' })
  } else if (rainSoon && rainAmount > 5) {
    advice.push({ icon: '🌦️', text: `Очаква се дъжд (${rainAmount.toFixed(0)}мм) — пропусни поливането`, type: 'info' })
  } else if (temp > 30 && humidity < 40) {
    advice.push({ icon: '🌡️', text: 'Горещо и сухо — удвой поливането, поливай вечерта след 19:00', type: 'warning' })
  } else if (temp > 25) {
    advice.push({ icon: '☀️', text: 'Топло — поливай преди 9:00 сутринта или след залез слънце', type: 'info' })
  } else if (temp >= 10) {
    advice.push({ icon: '💧', text: 'Умерено — поливай по нормален график, сутрин е най-добре', type: 'success' })
  } else {
    advice.push({ icon: '🌡️', text: 'Хладно — намали поливането, почвата изсъхва бавно', type: 'info' })
  }

  // Слана
  if (frostComing && frostTemp !== null) {
    advice.push({ icon: '🥶', text: `Слана се очаква (${frostTemp.toFixed(0)}°C) — прибери чувствителните растения`, type: 'danger' })
  }

  // Влажност / болести
  if (humidity > 80 && temp > 18) {
    advice.push({ icon: '🍄', text: 'Висока влажност — провери доматите и лозата за мана и гниене', type: 'warning' })
  } else if (humidity < 35 && temp > 20) {
    advice.push({ icon: '🏜️', text: 'Много сухо — пръскай листата рано сутринта, мулчирай почвата', type: 'warning' })
  }

  // Вятър
  if (windSpeed >= 8) {
    advice.push({ icon: '💨', text: `Силен вятър (${windSpeed.toFixed(0)} м/с) — не пръскай, подпри високите растения`, type: 'warning' })
  } else if (windSpeed < 3 && !isRainingNow && !rainSoon && temp >= 10 && temp <= 28) {
    advice.push({ icon: '🌿', text: 'Тихо и подходящо — идеални условия за пръскане с натурални препарати', type: 'success' })
  }

  // UV / обедна жега
  if (temp > 35) {
    advice.push({ icon: '🔥', text: 'Екстремна жега — не сади и не режи днес, растенията са под стрес', type: 'danger' })
  }

  return advice
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

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
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="h-8 bg-gray-100 rounded w-1/3" />
    </div>
  )

  if (error) return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-4 text-sm text-gray-400 flex items-center gap-2">
      🌤️ {error}
    </div>
  )

  if (!weather || !forecast) return null

  const advice = getGardenAdvice(weather, forecast)
  const sunrise = formatTime(weather.sys.sunrise)
  const sunset = formatTime(weather.sys.sunset)

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
      icon: hasRain ? '🌧️' : hasCloud ? '☁️' : '☀️'
    }
  }).filter(Boolean)

  const typeColors = {
    info: 'bg-blue-50 border-blue-100 text-blue-700',
    warning: 'bg-orange-50 border-orange-100 text-orange-700',
    danger: 'bg-red-50 border-red-100 text-red-700',
    success: 'bg-green-50 border-green-100 text-green-700',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-400 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80">{weather.name}</div>
            <div className="text-3xl font-bold">{weather.main.temp.toFixed(0)}°C</div>
            <div className="text-sm opacity-90 capitalize">{weather.weather[0].description}</div>
          </div>
          <div className="text-right text-xs opacity-80 space-y-1">
            <div>💧 Влажност {weather.main.humidity}%</div>
            <div>💨 Вятър {weather.wind.speed.toFixed(0)} м/с</div>
            <div>🌡️ Усеща се {weather.main.feels_like.toFixed(0)}°C</div>
            <div>🌅 {sunrise} / 🌇 {sunset}</div>
          </div>
        </div>

        {next3days.length > 0 && (
          <div className="flex gap-2 mt-3">
            {next3days.map((d, i) => (
              <div key={i} className="flex-1 bg-white/20 rounded-xl p-2 text-center text-xs">
                <div className="font-medium capitalize">{d.label}</div>
                <div className="text-lg my-0.5">{d.icon}</div>
                <div>{d.min}° / {d.max}°</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Градински съвети</div>
        {advice.map((a, i) => (
          <div key={i} className={`rounded-xl border px-3 py-2 text-xs flex items-start gap-2 ${typeColors[a.type]}`}>
            <span className="shrink-0">{a.icon}</span>
            <span>{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
