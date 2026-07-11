const { GoogleGenerativeAI } = require('@google/generative-ai')

const ANALYZE_PROMPT = `Ти си агроном и експерт по растения. Анализирай тази снимка подробно:

1. **Идентификация** — Какво е това растение? Вид и сорт ако е възможно.
2. **Здравен статус** — Здраво ли е? Болест, вредители, гъбички, хранителен дефицит?
3. **Нужди в момента** — Вода, тор, слънце, лечение?
4. **Напояване** — Честота и количество.
5. **Торене** — Вид тор, честота, сезон.
6. **Сезонни съвети** — Какво да правим сега.
7. **Чести проблеми** — Превенция.
8. **Следваща стъпка** — Едно действие днес.

Отговори на български. Структуриран формат с номерата.`

const CHAT_SYSTEM = `Ти си опитен агроном с 20 години опит. Помагаш на домашни градинари в България.
Отговаряй на български. Давай практични, конкретни съвети. Препоръчвай натурални методи преди химически.
Ако въпросът не е за градинарство, насочи разговора обратно към темата.`

async function analyzeImage(imageBase64, mimeType) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
    ANALYZE_PROMPT,
  ])
  return result.response.text()
}

async function chatWithAgronomist(messages) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: CHAT_SYSTEM }] },
      { role: 'model', parts: [{ text: 'Разбрано! Готов съм да помагам на градинари в България.' }] },
      ...messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ],
  })

  const lastMsg = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMsg.content)
  return result.response.text()
}

module.exports = { analyzeImage, chatWithAgronomist }
