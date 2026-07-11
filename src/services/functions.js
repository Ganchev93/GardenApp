import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase'

const functions = getFunctions(app, 'europe-west1')

export async function callAnalyzeImage(imageBase64, mimeType) {
  const fn = httpsCallable(functions, 'analyzeImageFn')
  const result = await fn({ imageBase64, mimeType })
  return result.data
}

export async function callChat(messages) {
  const fn = httpsCallable(functions, 'chatFn')
  const result = await fn({ messages })
  return result.data
}
