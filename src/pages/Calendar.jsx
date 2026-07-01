import { useState } from 'react'
import { Sprout, Flower2, ShoppingBasket, ListChecks } from 'lucide-react'
import springImg from '../assets/spring.png'
import summerImg from '../assets/summer.png'
import autumnImg from '../assets/autumn.png'
import winterImg from '../assets/winter.png'

const seasonImg = (monthIndex) => {
  if ([2, 3, 4].includes(monthIndex)) return springImg
  if ([5, 6, 7].includes(monthIndex)) return summerImg
  if ([8, 9, 10].includes(monthIndex)) return autumnImg
  return winterImg
}

const months = [
  {
    name: 'Януари', short: 'Яну',
    sow: [],
    plant: [],
    harvest: ['Зимни зеленчуци от мазето'],
    tasks: [
      'Планирай градината за новата година',
      'Поръчай семена и луковици',
      'Режи овощните дървета в мраз (без сняг)',
      'Защити нежните растения с агрил',
      'Провери запасите от луковици в мазето',
    ]
  },
  {
    name: 'Февруари', short: 'Фев',
    sow: ['🍅 Домати (на закрито)', '🫑 Чушки (на закрито)', '🍆 Патладжан (на закрито)'],
    plant: [],
    harvest: [],
    tasks: [
      'Режи лозата преди соковете да потекат',
      'Режи розите при трайно потопляне',
      'Подготви разсадник или семеначета',
      'Провери и подготви почвата при размразяване',
    ]
  },
  {
    name: 'Март', short: 'Мар',
    sow: ['🧅 Лук (навън)', '🥬 Спанак (навън)', '🥗 Маруля (навън)', '🫛 Грах (навън)', '🍅 Домати (на закрито)', '🥒 Краставица (на закрито)'],
    plant: ['🧄 Чесън (клонки)', '🍓 Ягоди (корени)'],
    harvest: ['🥬 Зимен спанак', '🌿 Мащерка, Розмарин'],
    tasks: [
      'Тори градината с компост или оборски тор',
      'Разопакувай и провери луковиците за лале',
      'Пресади домати и чушки в по-голям съд',
      'Режи малините до 30-40см',
    ]
  },
  {
    name: 'Април', short: 'Апр',
    sow: ['🥕 Морков', '🫛 Боб (ранен)', '🌽 Царевица (на закрито)', '🎃 Тиква (на закрито)', '🥒 Краставица (на закрито)'],
    plant: ['🥔 Картофи', '🧅 Лук (разсад)', '🍓 Ягоди'],
    harvest: ['🥬 Спанак', '🥗 Маруля', '🌿 Магданоз', '🌿 Риган'],
    tasks: [
      'Засади картофите когато почвата достигне 8°C',
      'Пресади домати и чушки в оранжерия или тунел',
      'Тори ягодите с азотен тор',
      'Следи прогнозата — последни мразове до 15 април',
      'Торене на овощните дървета с NPK',
    ]
  },
  {
    name: 'Май', short: 'Май',
    sow: ['🫛 Боб', '🌽 Царевица', '🎃 Тиква', '🌻 Слънчоглед', '🥒 Краставица (навън)'],
    plant: ['🍅 Домати (навън след 15.05)', '🫑 Чушки (навън)', '🍆 Патладжан', '🥒 Краставица', '🎃 Тиквичка'],
    harvest: ['🍓 Ягоди', '🥗 Маруля', '🌿 Босилек (първи листа)', '🥬 Спанак'],
    tasks: [
      'Засади всичко навън след 15 май (последен мраз)',
      'Наторявай азотен тор за бурен старт',
      'Мулчирай за задържане на влагата',
      'Постави колчета за доматите',
      'Пръскай превантивно против болести',
    ]
  },
  {
    name: 'Юни', short: 'Юни',
    sow: ['🫛 Втори боб', '🥬 Втори спанак (засенчено)', '🫚 Праз (за есен)'],
    plant: [],
    harvest: ['🍓 Ягоди', '🍒 Череши', '🥒 Краставици (ранни)', '🥗 Маруля', '🌿 Всички билки'],
    tasks: [
      'Пасинкувай доматите редовно',
      'Поливай сутрин — горещините идват',
      'Следи за листни въшки и акари',
      'Тори доматите и чушките с калиев тор',
      'Коси тревата по-рядко в жегата',
    ]
  },
  {
    name: 'Юли', short: 'Юли',
    sow: ['🥕 Втори морков', '🫛 Втори боб', '🥬 Зимна маруля'],
    plant: [],
    harvest: ['🍅 Домати', '🥒 Краставици', '🫑 Чушки', '🍆 Патладжан', '🎃 Тиквички', '🍑 Праскови', '🍒 Кайсии'],
    tasks: [
      'Поливай всеки ден при жега над 30°C',
      'Бери редовно — остарелите плодове спират новото цъфтене',
      'Следи за доматена мана (фитофтора)',
      'Мулчирай силно за задържане на влага',
      'Пръскай с нийм масло против акари',
    ]
  },
  {
    name: 'Август', short: 'Авг',
    sow: ['🥬 Есенен спанак', '🥗 Есенна маруля', '🌿 Магданоз (за зимата)', '🫚 Чесън (в края на месеца)'],
    plant: ['🍓 Ягодови издънки'],
    harvest: ['🍅 Домати', '🥒 Краставици', '🫑 Чушки', '🍆 Патладжан', '🍑 Праскови', '🍐 Круши (ранни)', '🌽 Царевица'],
    tasks: [
      'Подготви леглата за есенни култури',
      'Спри азотния тор — растенията трябва да узреят',
      'Консервирай и замразявай реколтата',
      'Събери семена от добри плодове',
      'Ограничи поливането на чушките',
    ]
  },
  {
    name: 'Септември', short: 'Сеп',
    sow: ['🧄 Чесън (за пролетта)', '🥬 Зимен спанак', '🥗 Зимна маруля'],
    plant: ['🧄 Чесън', '🍓 Ягоди (нови лехи)'],
    harvest: ['🥔 Картофи', '🧅 Лук', '🎃 Тикви', '🍇 Грозде', '🍎 Ябълки', '🍐 Круши', '🍅 Последни домати'],
    tasks: [
      'Прибери картофите преди дъждовете',
      'Суши лука и чесъна добре преди складиране',
      'Тори лехите с компост за зимата',
      'Засади чесъна за пролетна реколта',
      'Режи издънките на ягодите',
    ]
  },
  {
    name: 'Октомври', short: 'Окт',
    sow: [],
    plant: ['🧄 Чесън', '🌷 Лале (луковици)', '🌼 Нарцис (луковици)', '🌸 Зюмбюл (луковици)'],
    harvest: ['🎃 Тикви', '🍎 Ябълки (зимни)', '🍇 Грозде (последно)', '🥬 Спанак', '🥗 Маруля'],
    tasks: [
      'Засади пролетни луковици преди замразяване',
      'Мулчирай нежните многогодишни растения',
      'Изкопай гладиоли и далии преди мраз',
      'Обрежи и почисти леглата',
      'Приготви компостна купчина от листата',
    ]
  },
  {
    name: 'Ноември', short: 'Ное',
    sow: [],
    plant: ['🌷 Луковици (до замразяване)'],
    harvest: ['🥬 Зимни зеленчуци', '🍎 Зимни ябълки'],
    tasks: [
      'Режи овощните дървета след опадване на листата',
      'Защити розите с мулч или агрил',
      'Прибери саксийните растения на закрито',
      'Почисти и наточи градинарските инструменти',
      'Провери и поправи подпорите и оградите',
    ]
  },
  {
    name: 'Декември', short: 'Дек',
    sow: [],
    plant: [],
    harvest: [],
    tasks: [
      'Планирай градината за следващата година',
      'Поръчай семена и инструменти онлайн',
      'Провери запасите в мазето',
      'Защити нежните растения от студ',
      'Прочети за нови техники и сортове',
    ]
  },
]

export default function Calendar() {
  const currentMonth = new Date().getMonth()
  const [selected, setSelected] = useState(currentMonth)
  const m = months[selected]

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <h1 style={{ color: '#1E3A2F' }}>Градински календар</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6A9E78' }}>Какво да правим всеки месец в България</p>
        </div>
        <img
          key={selected}
          src={seasonImg(selected)}
          alt="сезон"
          className="anim-season w-24 h-24 object-contain ml-auto shrink-0"
        />
      </div>

      {/* Месечни табове */}
      <div className="flex overflow-x-auto gap-1.5 pb-2 mb-4 scrollbar-hide">
        {months.map((mo, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: selected === i ? '#4A7C59' : i === currentMonth ? '#D4EDE0' : '#fff',
              color: selected === i ? '#fff' : i === currentMonth ? '#1E3A2F' : '#6A9E78',
              border: `1px solid ${selected === i ? '#4A7C59' : '#B3D9C4'}`,
            }}
          >
            {mo.short}
          </button>
        ))}
      </div>

      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start">
        {m.sow.length > 0 && (
          <Section title="Засей" Icon={Sprout} color="green" items={m.sow} />
        )}
        {m.plant.length > 0 && (
          <Section title="Засади" Icon={Flower2} color="emerald" items={m.plant} />
        )}
        {m.harvest.length > 0 && (
          <Section title="Прибери реколта" Icon={ShoppingBasket} color="orange" items={m.harvest} />
        )}
        <Section title="Задачи" Icon={ListChecks} color="blue" items={m.tasks} />

        {m.sow.length === 0 && m.plant.length === 0 && m.harvest.length === 0 && (
          <div className="rounded-2xl p-4 text-center text-sm"
            style={{ background: '#fff', border: '1px solid #D4EDE0', color: '#6A9E78' }}>
            Месецът е за почивка и планиране
          </div>
        )}
      </div>
    </div>
  )
}

const sectionTheme = {
  green:   { bg: '#D4EDE0', border: '#B3D9C4', text: '#1E3A2F', dot: '#4A7C59' },
  emerald: { bg: '#E8F5F0', border: '#A8D5BE', text: '#1E3A2F', dot: '#4A7C59' },
  orange:  { bg: '#FDF3DC', border: '#F5D78E', text: '#7A4A00', dot: '#C97D0E' },
  blue:    { bg: '#F0F7FF', border: '#BFDBFE', text: '#1C3A5E', dot: '#3B82F6' },
}

function Section({ title, Icon, color, items }) {
  const t = sectionTheme[color]
  return (
    <div className="rounded-2xl p-4" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
      <div className="font-semibold text-sm mb-2.5 flex items-center gap-1.5" style={{ color: t.text }}>
        <Icon size={15} /> {title}
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm" style={{ color: t.text }}>
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: t.dot }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
