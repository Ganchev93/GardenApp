import sharp from 'sharp'

const src = 'public/icon.svg'
const targets = [
  { file: 'public/pwa-192.png', size: 192 },
  { file: 'public/pwa-512.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
]

for (const { file, size } of targets) {
  await sharp(src, { density: 300 }).resize(size, size).png().toFile(file)
  console.log(`${file} (${size}x${size})`)
}
