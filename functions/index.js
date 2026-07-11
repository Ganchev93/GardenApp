const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { checkAndIncrement } = require('./rateLimiter')
const { analyzeImage, chatWithAgronomist } = require('./ai')

initializeApp()

exports.analyzeImageFn = onCall(
  { region: 'europe-west1', secrets: ['GEMINI_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

    const { imageBase64, mimeType } = request.data
    if (!imageBase64) throw new HttpsError('invalid-argument', 'No image')

    try {
      await checkAndIncrement(request.auth.uid)
    } catch (e) {
      if (e.message.startsWith('LIMIT_REACHED')) {
        const limit = e.message.split(':')[1]
        throw new HttpsError('resource-exhausted', `Достигнат месечен лимит от ${limit} анализа`)
      }
      throw e
    }

    const text = await analyzeImage(imageBase64, mimeType)
    return { text }
  }
)

exports.chatFn = onCall(
  { region: 'europe-west1', secrets: ['GEMINI_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

    const { messages } = request.data
    if (!messages?.length) throw new HttpsError('invalid-argument', 'No messages')

    const text = await chatWithAgronomist(messages)
    return { text }
  }
)
