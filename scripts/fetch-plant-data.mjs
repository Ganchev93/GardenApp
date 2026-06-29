import { writeFileSync } from 'fs'

const KEY = 'sk-todN6a3d983ec6c5718419'
const BASE = 'https://perenual.com/api'

const plantNames = [
  { id: 1,  name: 'Домат',           query: 'tomato' },
  { id: 2,  name: 'Краставица',      query: 'cucumber' },
  { id: 3,  name: 'Морков',          query: 'carrot' },
  { id: 4,  name: 'Картоф',          query: 'potato' },
  { id: 5,  name: 'Чушка',           query: 'bell pepper' },
  { id: 6,  name: 'Лук',             query: 'onion' },
  { id: 7,  name: 'Патладжан',       query: 'eggplant' },
  { id: 8,  name: 'Тиквичка',        query: 'zucchini' },
  { id: 9,  name: 'Зеле',            query: 'cabbage' },
  { id: 10, name: 'Спанак',          query: 'spinach' },
  { id: 11, name: 'Маруля',          query: 'lettuce' },
  { id: 12, name: 'Ягода',           query: 'strawberry' },
  { id: 13, name: 'Ябълка',          query: 'apple tree' },
  { id: 14, name: 'Круша',           query: 'pear tree' },
  { id: 15, name: 'Череша',          query: 'cherry tree' },
  { id: 16, name: 'Слива',           query: 'plum tree' },
  { id: 17, name: 'Праскова',        query: 'peach tree' },
  { id: 18, name: 'Кайсия',          query: 'apricot tree' },
  { id: 19, name: 'Орех',            query: 'walnut tree' },
  { id: 20, name: 'Лимон (саксия)',  query: 'lemon tree' },
  { id: 21, name: 'Роза',            query: 'rose' },
  { id: 22, name: 'Хортензия',       query: 'hydrangea' },
  { id: 23, name: 'Лавандула',       query: 'lavender' },
  { id: 24, name: 'Боровинка',       query: 'blueberry' },
  { id: 25, name: 'Касис',           query: 'blackcurrant' },
  { id: 26, name: 'Малина',          query: 'raspberry' },
  { id: 27, name: 'Босилек',         query: 'basil' },
  { id: 28, name: 'Магданоз',        query: 'parsley' },
  { id: 29, name: 'Розмарин',        query: 'rosemary' },
  { id: 30, name: 'Мента',           query: 'mint' },
  { id: 31, name: 'Риган',           query: 'oregano' },
  { id: 32, name: 'Мащерка',         query: 'thyme' },
  { id: 33, name: 'Градински чай',   query: 'sage' },
  { id: 34, name: 'Слънчоглед',      query: 'sunflower' },
  { id: 35, name: 'Лале',            query: 'tulip' },
  { id: 36, name: 'Петуния',         query: 'petunia' },
  { id: 37, name: 'Бегония',         query: 'begonia' },
  { id: 38, name: 'Гладиола',        query: 'gladiolus' },
  { id: 39, name: 'Теменужка',       query: 'viola pansy' },
  { id: 40, name: 'Нарцис',          query: 'narcissus daffodil' },
]

async function fetchSpecies(query) {
  const res = await fetch(`${BASE}/species-list?key=${KEY}&q=${encodeURIComponent(query)}`)
  const data = await res.json()
  return data.data?.[0] || null
}

async function fetchCareGuide(speciesId) {
  const res = await fetch(`${BASE}/species-care-guide-list?key=${KEY}&species_id=${speciesId}`)
  const data = await res.json()
  return data.data?.[0]?.section || []
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const results = []

  for (const plant of plantNames) {
    process.stdout.write(`Fetching: ${plant.name} (${plant.query})... `)

    try {
      const species = await fetchSpecies(plant.query)
      if (!species) {
        console.log('NOT FOUND')
        results.push({ id: plant.id, name: plant.name, found: false })
        continue
      }

      await sleep(300)
      const careGuide = await fetchCareGuide(species.id)

      const watering = careGuide.find(s => s.type === 'watering')
      const fertilizing = careGuide.find(s => s.type === 'fertilization') || careGuide.find(s => s.type === 'feeding')
      const pruning = careGuide.find(s => s.type === 'pruning')

      results.push({
        id: plant.id,
        name: plant.name,
        found: true,
        perenual_id: species.id,
        scientific_name: species.scientific_name?.[0] || '',
        watering_general: species.watering,
        sunlight: species.sunlight?.join(', ') || '',
        cycle: species.cycle || '',
        care_watering: watering?.description || '',
        care_fertilizing: fertilizing?.description || '',
        care_pruning: pruning?.description || '',
      })

      console.log(`OK (id: ${species.id}, watering: ${species.watering})`)
    } catch (e) {
      console.log(`ERROR: ${e.message}`)
      results.push({ id: plant.id, name: plant.name, found: false, error: e.message })
    }

    await sleep(400)
  }

  writeFileSync('scripts/perenual-data.json', JSON.stringify(results, null, 2), 'utf8')
  console.log('\n✅ Записано в scripts/perenual-data.json')

  console.log('\n📊 Резюме:')
  console.log(`Намерени: ${results.filter(r => r.found).length}/40`)
  console.log(`Не намерени: ${results.filter(r => !r.found).length}/40`)
}

main()
