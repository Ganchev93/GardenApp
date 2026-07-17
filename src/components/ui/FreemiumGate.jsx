const MESSAGES = {
  plants: {
    title: 'Достигнат лимит на растения',
    body: 'Безплатният план позволява до 3 растения в градината. Надгради за неограничен достъп.',
    icon: '🌱',
  },
  beds: {
    title: 'Достигнат лимит на лехи',
    body: 'Безплатният план позволява 1 леха в двора. Надгради, за да подредиш цялата си градина.',
    icon: '🪴',
  },
  analysis: {
    title: 'Достигнат месечен лимит',
    body: 'Изразходвал си всичките си AI анализи за този месец. Надгради до Premium за повече.',
    icon: '📷',
  },
}

export default function FreemiumGate({ show, type, children }) {
  if (!show) return children

  const msg = MESSAGES[type] || MESSAGES.analysis

  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.85)' }}>
        <div className="text-center p-6 max-w-xs">
          <div className="text-4xl mb-3">{msg.icon}</div>
          <h3 className="font-bold mb-2" style={{ color: '#1C2B23' }}>{msg.title}</h3>
          <p className="text-sm mb-4" style={{ color: '#6A9E78' }}>{msg.body}</p>
          <button className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: '#C97D0E', color: '#fff' }}>
            Надгради до Premium
          </button>
          <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Скоро достъпно</p>
        </div>
      </div>
    </div>
  )
}
