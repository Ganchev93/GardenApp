import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

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
            ...history.map(m => ({ role: m.role, content: m.content }))
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
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-green-800">AI Агроном</h1>
        <p className="text-gray-500 text-sm">Питай за растения, болести, торене и грижи</p>
      </div>

      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Популярни въпроси</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="bg-white border border-green-200 text-green-700 text-xs px-3 py-1.5 rounded-full hover:bg-green-50 transition-colors"
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
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm max-w-[85%]">
                ❌ {m.content}
              </div>
            ) : m.role === 'user' ? (
              <div className="bg-green-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%]">
                {m.content}
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm text-sm max-w-[85%]">
                <div className="text-xs text-green-600 font-medium mb-1.5">🌿 Агроном</div>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-1.5 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                    ul: ({ children }) => <ul className="space-y-1 my-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-1 my-1.5">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700 pl-2 border-l-2 border-green-200">{children}</li>,
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
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Питай за растения..."
            rows={1}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="bg-green-600 text-white px-4 rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↑
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-gray-400 mt-2 hover:text-gray-600 transition-colors"
          >
            Изчисти чата
          </button>
        )}
      </div>
    </div>
  )
}
