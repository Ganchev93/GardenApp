import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { plants } from '../data/plants'

const STORAGE_KEY = 'my_garden_plants'
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function guessPlant(text) {
  if (!text) return null
  const lower = text.toLowerCase()
  return plants.find(p => lower.includes(p.name.toLowerCase())) || null
}

function loadGarden() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

export default function Analyze() {
  const [image, setImage] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPlantId, setSelectedPlantId] = useState('')
  const [added, setAdded] = useState(false)
  const cameraRef = useRef()
  const galleryRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImageBase64(null)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setShowAddForm(false)
    setAdded(false)
  }

  async function analyze() {
    if (!image) return
    setLoading(true)
    setError(null)
    setResult(null)
    setShowAddForm(false)
    setAdded(false)

    try {
      const base64 = await toBase64(image)
      setImageBase64(base64)

      const body = {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Ти си агроном и експерт по растения. Анализирай тази снимка на растение подробно и ми кажи:

1. **Идентификация** — Какво е това растение? Посочи вид и сорт ако е възможно.
2. **Здравен статус** — Здраво ли е? Има ли признаци на болест, вредители, гъбички или хранителен дефицит? Опиши конкретно какво виждаш.
3. **Нужди в момента** — От какво се нуждае сега (вода, тор, слънце, лечение, преместване)?
4. **Напояване** — Колко често и колко вода? Как да разберем кога е жадно?
5. **Торене** — Какъв тор, колко често, в какъв период?
6. **Сезонни съвети** — Какво да правим с него в текущия сезон?
7. **Чести проблеми** — Какво най-често се случва с този вид и как да го предотвратим?
8. **Конкретна следваща стъпка** — Едно действие, което да направя днес.

Отговори на български език, ясно и практично. Използвай структуриран формат с номерата.`
            },
            {
              type: 'image_url',
              image_url: { url: `data:${image.type};base64,${base64}` }
            }
          ]
        }],
        max_tokens: 2048
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 429) throw new Error('Дневният лимит на Groq е достигнат. Опитай утре или използвай друг API ключ.')
        if (res.status === 401) throw new Error('Невалиден API ключ.')
        throw new Error(err.error?.message || 'Грешка при анализа')
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || 'Няма отговор от AI'
      setResult(text)

      const guessed = guessPlant(text)
      setSelectedPlantId(guessed ? String(guessed.id) : '')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function addToGarden() {
    if (!selectedPlantId) return
    const plant = plants.find(p => p.id === Number(selectedPlantId))
    if (!plant) return
    const today = new Date().toISOString().slice(0, 10)
    const garden = loadGarden()
    garden.push({
      uid: Date.now(),
      plantId: plant.id,
      name: plant.name,
      emoji: plant.emoji,
      category: plant.category,
      photo: imageBase64 ? `data:${image.type};base64,${imageBase64}` : null,
      lastWatered: today,
      nextWatering: addDays(today, plant.watering.frequency_days),
      watering_frequency_days: plant.watering.frequency_days,
      watering_amount: plant.watering.amount,
      lastFertilized: today,
      nextFertilizing: addDays(today, plant.fertilizing.frequency_days),
      frequency_days: plant.fertilizing.frequency_days,
      fertilizer_type: plant.fertilizing.fertilizer_type,
      dose: plant.fertilizing.dose,
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(garden))
    setAdded(true)
    setShowAddForm(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-green-800 mb-1">AI Анализ на растение</h1>
      <p className="text-gray-500 mb-4 text-sm">Снимай растението и получи препоръки</p>

      <div className="border-2 border-dashed border-green-300 rounded-xl p-4 text-center mb-4">
        {preview ? (
          <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain mb-3" />
        ) : (
          <div className="text-4xl mb-3">🌿</div>
        )}
        <div className="flex gap-2">
          <button onClick={() => cameraRef.current.click()}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
            📷 Снимай
          </button>
          <button onClick={() => galleryRef.current.click()}
            className="flex-1 bg-white border border-green-300 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1">
            🖼 Галерия
          </button>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      {preview && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
        >
          {loading ? '🔄 Анализирам...' : '🔍 Анализирай растението'}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-4">
          ❌ {error}
        </div>
      )}

      {result && (
        <>
          <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm mb-3">
            <h3 className="font-semibold text-green-800 mb-3">🌿 Резултат от анализа</h3>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                ol: ({ children }) => <ol className="space-y-3">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-gray-700 leading-relaxed border-l-2 border-green-200 pl-3">{children}</li>,
              }}
            >
              {result}
            </ReactMarkdown>
          </div>

          {added ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 text-sm font-medium">
              ✅ Добавено в моята градина!
            </div>
          ) : showAddForm ? (
            <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-3">Кое растение е това?</p>
              <select
                value={selectedPlantId}
                onChange={e => setSelectedPlantId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">-- Избери растение --</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={addToGarden} disabled={!selectedPlantId}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  Добави в градината
                </button>
                <button onClick={() => setShowAddForm(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                  Откажи
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)}
              className="w-full bg-white border-2 border-green-400 text-green-700 py-3 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors">
              🌱 Добави в моята градина
            </button>
          )}
        </>
      )}
    </div>
  )
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const MAX = 1200
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}
