import imageCompression from 'browser-image-compression'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadImage(file) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  })

  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'garden-app')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.secure_url
}
