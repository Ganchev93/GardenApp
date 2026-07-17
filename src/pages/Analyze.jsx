import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Camera, Image as ImageIcon, ScanSearch, Leaf, Sprout, AlertCircle, Check, Loader2 } from 'lucide-react'
import { plants } from '../data/plants'
import { useAuth } from '../hooks/useAuth'
import { useGarden } from '../hooks/useGarden'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

function guessPlant(text) {
  if (!text) return null
  const lower = text.toLowerCase()
  return plants.find(p => lower.includes(p.name.toLowerCase())) || null
}

export default function Analyze() {
  const { user } = useAuth()
  const { addPlant } = useGarden(user?.uid)
  const [image, setImage] = useState(null)
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
              image_url: { url: `data:image/jpeg;base64,${base64}` }
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

  async function addToGarden() {
    if (!selectedPlantId) return
    const plant = plants.find(p => p.id === Number(selectedPlantId))
    if (!plant) return
    // small thumbnail — Cloudinary replaces this in the AI migration task
    let photo = null
    if (image) {
      try { photo = `data:image/jpeg;base64,${await toBase64(image, 400)}` } catch {}
    }
    await addPlant({
      plantId: plant.id,
      name: plant.name,
      emoji: plant.emoji,
      category: plant.category,
      photo,
      watering_frequency_days: plant.watering.frequency_days,
      watering_amount: plant.watering.amount,
      fertilizing_frequency_days: plant.fertilizing.frequency_days,
      fertilizer_type: plant.fertilizing.fertilizer_type,
      dose: plant.fertilizing.dose,
    })
    setAdded(true)
    setShowAddForm(false)
  }

  return (
    <div>
      <h1 style={{ color: '#1E3A2F' }}>AI Анализ</h1>
      <p className="text-sm mt-0.5 mb-4" style={{ color: '#6A9E78' }}>Снимай растението и получи препоръки</p>

      <div className="rounded-2xl p-4 text-center mb-4"
        style={{ background: '#fff', border: '2px dashed #B3D9C4' }}>
        {preview ? (
          <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-xl object-contain mb-3" />
        ) : (
          <Leaf size={40} className="mx-auto mb-3" style={{ color: '#B3D9C4' }} />
        )}
        <div className="flex gap-2">
          <button onClick={() => cameraRef.current.click()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
            style={{ background: '#4A7C59', color: '#fff' }}>
            <Camera size={15} /> Снимай
          </button>
          <button onClick={() => galleryRef.current.click()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#fff', border: '1px solid #B3D9C4', color: '#4A7C59' }}>
            <ImageIcon size={15} /> Галерия
          </button>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      {preview && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
          style={{ background: '#1E3A2F', color: '#fff' }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Анализирам...</>
            : <><ScanSearch size={16} /> Анализирай растението</>}
        </button>
      )}

      {error && (
        <div className="rounded-2xl p-4 text-sm mb-4 flex items-start gap-2"
          style={{ background: '#FFF0F0', border: '1px solid #FECACA', color: '#7F1D1D' }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {result && (
        <>
          <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
            <h3 className="font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#1E3A2F' }}>
              <Leaf size={16} style={{ color: '#4A7C59' }} /> Резултат от анализа
            </h3>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-sm leading-relaxed mb-2" style={{ color: '#1C2B23' }}>{children}</p>,
                strong: ({ children }) => <strong className="font-semibold" style={{ color: '#1E3A2F' }}>{children}</strong>,
                ol: ({ children }) => <ol className="space-y-3">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-relaxed pl-3" style={{ color: '#1C2B23', borderLeft: '2px solid #D4EDE0' }}>{children}</li>,
              }}
            >
              {result}
            </ReactMarkdown>
          </div>

          {added ? (
            <div className="rounded-2xl p-4 text-center text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ background: '#D4EDE0', border: '1px solid #B3D9C4', color: '#1E3A2F' }}>
              <Check size={16} /> Добавено в моята градина!
            </div>
          ) : showAddForm ? (
            <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#1C2B23' }}>Кое растение е това?</p>
              <select
                value={selectedPlantId}
                onChange={e => setSelectedPlantId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none"
                style={{ border: '1px solid #B3D9C4', background: '#F5F2EC', color: '#1C2B23' }}
              >
                <option value="">-- Избери растение --</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={addToGarden} disabled={!selectedPlantId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#4A7C59', color: '#fff' }}>
                  Добави в градината
                </button>
                <button onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ border: '1px solid #B3D9C4', color: '#4A7C59', background: '#fff' }}>
                  Откажи
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ background: '#fff', border: '2px solid #4A7C59', color: '#4A7C59' }}>
              <Sprout size={15} /> Добави в моята градина
            </button>
          )}
        </>
      )}
    </div>
  )
}

function toBase64(file, MAX = 1200) {
  return new Promise((resolve, reject) => {
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
