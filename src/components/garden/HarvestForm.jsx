import { useState } from 'react'

const UNITS = ['кг', 'бр', 'връзки']

// Inline amount + unit form shared by PlantCard (list) and PlantSheet (map)
export default function HarvestForm({ onSubmit, onCancel }) {
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('кг')

  function submit() {
    const n = Number(amount)
    if (!n || n <= 0) return
    onSubmit(n, unit)
  }

  return (
    <div className="flex items-center gap-2">
      <input autoFocus type="number" min="0" step="0.1" value={amount}
        onChange={e => setAmount(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Колко?"
        className="w-20 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
        style={{ border: '1px solid #B3D9C4', background: '#F5F2EC', color: '#1C2B23' }} />
      <select value={unit} onChange={e => setUnit(e.target.value)}
        className="rounded-lg px-2 py-1.5 text-sm focus:outline-none"
        style={{ border: '1px solid #B3D9C4', background: '#F5F2EC', color: '#1C2B23' }}>
        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <button onClick={submit}
        className="text-xs px-3 py-1.5 rounded-lg font-semibold"
        style={{ background: '#4A7C59', color: '#fff' }}>OK</button>
      <button onClick={onCancel}
        className="text-xs px-2 py-1.5 rounded-lg"
        style={{ color: '#9CA3AF' }}>Откажи</button>
    </div>
  )
}
