import { useState } from 'react'
import { Droplets, LogOut, X, Camera, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateStr } from '../../lib/garden'

const MONTHS_SHORT = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек']

function photoLabel(iso) {
  const d = new Date(iso)
  return `${MONTHS_SHORT[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
}

function waterLabel(entry, today) {
  const next = toDateStr(entry.nextWatering)
  if (next <= today) return { text: 'Чака поливане!', color: '#C97D0E' }
  const days = Math.round((new Date(next) - new Date(today)) / 86400000)
  return { text: days === 1 ? 'Поливане утре' : `Поливане след ${days} дни`, color: '#6A9E78' }
}

// Bottom sheet: actions + photo journal for a planted entry.
export default function PlantSheet({ entry, bedName, today, onWater, onUnassign, onAddPhoto, onClose }) {
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState(null)
  const [viewerIdx, setViewerIdx] = useState(null)

  const status = waterLabel(entry, today)
  const photos = [...(entry.photos || [])].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
  const cloudinaryReady = !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

  async function handleFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!cloudinaryReady) {
      setPhotoError('Качването още не е настроено (Cloudinary)')
      return
    }
    setUploading(true)
    setPhotoError(null)
    try {
      await onAddPhoto(entry.id, file)
    } catch {
      setPhotoError('Качването не успя — опитай пак')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center"
      style={{ background: 'rgba(20,30,25,0.45)' }} onClick={onClose}>

      {viewerIdx !== null && photos[viewerIdx] && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-center p-4"
          style={{ background: 'rgba(10,16,12,0.93)' }}
          onClick={e => { e.stopPropagation(); setViewerIdx(null) }}>
          <img src={photos[viewerIdx].url} alt={entry.name}
            className="max-w-full max-h-[78vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()} />
          <p className="text-sm mt-3 font-medium" style={{ color: '#D4EDE0' }}>
            {entry.emoji} {entry.name} · {photoLabel(photos[viewerIdx].uploadedAt)}
          </p>
          {photos.length > 1 && (
            <div className="flex items-center gap-6 mt-3" onClick={e => e.stopPropagation()}>
              <button onClick={() => setViewerIdx((viewerIdx + 1) % photos.length)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} aria-label="По-стара">
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{viewerIdx + 1} / {photos.length}</span>
              <button onClick={() => setViewerIdx((viewerIdx - 1 + photos.length) % photos.length)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} aria-label="По-нова">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="sheet-up w-full lg:max-w-sm rounded-t-3xl lg:rounded-3xl p-5"
        style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{entry.emoji}</span>
          <div className="flex-1">
            <h2 style={{ color: '#1E3A2F' }}>{entry.name}</h2>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>в „{bedName}“</p>
          </div>
          <button onClick={onClose} aria-label="Затвори"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F5F2EC', color: '#6A9E78' }}>
            <X size={16} />
          </button>
        </div>
        <p className="text-sm mb-3 font-medium" style={{ color: status.color }}>{status.text}</p>

        {/* photo journal */}
        <p className="text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>ДНЕВНИК</p>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-1">
          <label className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shrink-0"
            style={{ border: '1.5px dashed #B3D9C4', color: '#6A9E78' }}>
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            <span className="text-[9px] font-medium">{uploading ? '...' : 'Снимай'}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={handleFile} disabled={uploading} />
          </label>
          {photos.map((ph, i) => (
            <button key={ph.uploadedAt + i} onClick={() => setViewerIdx(i)} className="shrink-0 text-center">
              <img src={ph.url} alt="" width="64" height="64"
                className="w-16 h-16 rounded-xl object-cover" />
              <span className="block text-[9px] mt-0.5" style={{ color: '#9CA3AF' }}>
                {photoLabel(ph.uploadedAt)}
              </span>
            </button>
          ))}
          {photos.length === 0 && !uploading && (
            <div className="flex items-center text-xs px-2" style={{ color: '#B3D9C4' }}>
              Снимай растението си и следи как расте през сезоните
            </div>
          )}
        </div>
        {photoError && <p className="text-xs mb-2" style={{ color: '#C0392B' }}>{photoError}</p>}

        <div className="flex gap-2 mt-3">
          <button onClick={() => onWater(entry.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#3B82F6', color: '#fff' }}>
            <Droplets size={15} /> Полей
          </button>
          <button onClick={() => onUnassign(entry.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#F5F2EC', color: '#1C2B23' }}>
            <LogOut size={15} /> Извади от лехата
          </button>
        </div>
      </div>
    </div>
  )
}
