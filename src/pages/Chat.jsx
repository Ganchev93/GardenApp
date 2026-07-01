import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Leaf, AlertCircle, SendHorizontal } from 'lucide-react'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const SYSTEM_PROMPT = `Ти си опитен агроном и градинар с 20 години опит. Помагаш на домашни градинари в България.
Отговаряй винаги на български език. Давай практични, конкретни съвети. Бъди кратък и ясен.
Когато е подходящо, препоръчвай натурални методи преди химически.
Ако въпросът не е свързан с градинарство или растения, учтиво насочи разговора обратно към темата.`

const SUGGESTIONS = [
  'Кога да засея домати?',
  'Как да се справя с листни въшки?',
  'Какъв тор е добър за краставици?',
  'Защо пожълтяват листата на лимона ми?',
  'Как да правя компост у дома?',
]

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const question = text || input.trim()
    if (!question || loading) return
    setInput('')

    const userMsg = { role: 'user', content: question }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.filter(m => m.role !== 'error').map(m => ({ role: m.role, content: m.content }))
          ],
          max_tokens: 1024,
        })
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 429) throw new Error('Дневният лимит е достигнат. Опитай утре.')
        throw new Error(err.error?.message || 'Грешка')
      }

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || 'Няма отговор.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'error', content: e.message }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] lg:max-w-2xl">
      <div className="mb-3">
        <h1 style={{ color: '#1E3A2F' }}>AI Агроном</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6A9E78' }}>Питай за растения, болести, торене и грижи</p>
      </div>

      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs mb-2 uppercase tracking-wide font-semibold" style={{ color: '#6A9E78' }}>Популярни въпроси</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                style={{ background: '#fff', border: '1px solid #B3D9C4', color: '#4A7C59' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'error' ? (
              <div className="rounded-2xl px-4 py-3 text-sm max-w-[85%] flex items-start gap-2"
                style={{ background: '#FFF0F0', border: '1px solid #FECACA', color: '#7F1D1D' }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" /> {m.content}
              </div>
            ) : m.role === 'user' ? (
              <div className="rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%]"
                style={{ background: '#4A7C59', color: '#fff' }}>
                {m.content}
              </div>
            ) : (
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[85%]"
                style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
                <div className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#4A7C59' }}>
                  <Leaf size={12} /> Агроном
                </div>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="leading-relaxed mb-1.5 last:mb-0" style={{ color: '#1C2B23' }}>{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold" style={{ color: '#1E3A2F' }}>{children}</strong>,
                    ul: ({ children }) => <ul className="space-y-1 my-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-1 my-1.5">{children}</ol>,
                    li: ({ children }) => <li className="pl-2" style={{ color: '#1C2B23', borderLeft: '2px solid #D4EDE0' }}>{children}</li>,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#6A9E78', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#6A9E78', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#6A9E78', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3" style={{ borderTop: '1px solid #E3DED4' }}>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Питай за растения..."
            rows={1}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
            style={{ border: '1px solid #B3D9C4', background: '#fff', color: '#1C2B23' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="px-4 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#4A7C59', color: '#fff' }}
            aria-label="Изпрати"
          >
            <SendHorizontal size={16} />
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs mt-2 transition-colors"
            style={{ color: '#9CA3AF' }}
          >
            Изчисти чата
          </button>
        )}
      </div>
    </div>
  )
}
