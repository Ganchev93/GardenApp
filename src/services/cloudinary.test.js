import { vi } from 'vitest'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(file => Promise.resolve(file)),
}))

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ secure_url: 'https://res.cloudinary.com/test/image/upload/v1/garden-app/test.jpg' }),
})

import { uploadImage } from './cloudinary'

test('uploadImage returns secure_url', async () => {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  const url = await uploadImage(file)
  expect(url).toBe('https://res.cloudinary.com/test/image/upload/v1/garden-app/test.jpg')
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('cloudinary.com'),
    expect.objectContaining({ method: 'POST' })
  )
})

test('uploadImage throws on failure', async () => {
  fetch.mockResolvedValueOnce({ ok: false })
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  await expect(uploadImage(file)).rejects.toThrow('Upload failed')
})
