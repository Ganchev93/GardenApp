# Plant Timeline + Garden Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive 12-month care timeline per plant (Plants page tab + aggregated "Този месец" section in MyGarden) and a search combobox for adding plants to MyGarden.

**Architecture:** New optional `calendar` field on plant objects in `src/data/plants.js` (months 1-12 per activity). New presentational component `PlantTimeline` renders it as a CSS-grid strip. Plants.jsx gains a 4th tab; MyGarden.jsx gains a "Този месец" aggregation and replaces its `<select>` picker with a filter-as-you-type combobox. No routing, storage, or schema migrations.

**Tech Stack:** React 19, Vite, Tailwind utility classes + inline styles (project convention), lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-07-06-plant-timeline-design.md`

## Global Constraints

- All UI text in Bulgarian; all code identifiers/comments in English.
- No test runner in this project (PoC convention) — verification is `npm run build` + visual check in `npm run dev`.
- Project root: `C:\Users\Алекс\ClaudeProjects\garden-app`. Run all commands there.
- Styling convention: Tailwind utility classes for layout, inline `style` for colors. Palette: dark green `#1E3A2F`, brand green `#4A7C59`, muted green `#6A9E78`, pale green `#B3D9C4`, card border `#D4EDE0`, divider `#F0EBE3`, beige `#F5F2EC`, muted gray `#9CA3AF`, text `#1C2B23`.
- Commit after each task; do NOT push (push happens once at the end, after user review).
- Do not modify plants ids 1–91 and do not touch `Calendar.jsx`.

---

### Task 1: Calendar data for the 30 round-3 plants

**Files:**
- Modify: `src/data/plants.js` (plants with ids 92–121 only)

**Interfaces:**
- Produces: optional `calendar` field on plant objects: `{ sow?: number[], plant?: number[], prune?: number[], bloom?: number[], harvest?: number[], note?: string }` — months are ascending integers 1-12. Consumed by Tasks 2–4 via `plant.calendar`.

- [ ] **Step 1: Add the `calendar` line to each plant object**

In `src/data/plants.js`, each plant object has one key per line (`id/name/...`, `watering: {...}`, `fertilizing: {...}`, `pest_control: {...}`). For each of the 30 plants below (find by `id: N,`), add a new line **after the `pest_control: { ... }` line** (add a trailing comma to the `pest_control` line if it lacks one), indented the same as the other keys:

```js
// id 92 Аспержи
calendar: { plant: [3, 4], harvest: [4, 5, 6], note: "Не се бере първите 2 години след засаждане — от 3-тата година копията се берат 6-8 седмици" },
// id 93 Ряпа
calendar: { sow: [3, 4, 7, 8], harvest: [5, 6, 9, 10], note: "Бери корените до 7-8 см диаметър — по-големите загрубяват" },
// id 94 Пащърнак
calendar: { sow: [3, 4], harvest: [10, 11], note: "Леката слана прави корените по-сладки; може да презимува в почвата под мулч" },
// id 95 Кольраби
calendar: { sow: [4, 7, 8], harvest: [6, 9, 10], note: "Бери стъблото при 5-8 см диаметър — по-голямото става твърдо и влакнесто" },
// id 96 Рукола
calendar: { sow: [3, 4, 8, 9], harvest: [4, 5, 6, 9, 10], note: "Повторни сеитби на 2-3 седмици; лятната жега ускорява изкласяването" },
// id 97 Бакла
calendar: { sow: [2, 3], harvest: [5, 6], note: "Отчупи връхчетата при завръз на долните шушулки — срещу черната въшка" },
// id 98 Кимион
calendar: { sow: [3, 4], plant: [5], harvest: [8, 9], note: "Разсад на закрито; изисква 100-150 топли дни — реколтата у нас е несигурна" },
// id 99 Ким
calendar: { sow: [4, 5, 9, 10], harvest: [7, 8], note: "Двугодишен — семената зреят през лятото на втората година" },
// id 100 Исоп
calendar: { sow: [2, 3], plant: [4, 5], harvest: [6, 7, 8], note: "Бери листата преди цъфтеж, рано сутрин; многогодишен, презимува навън" },
// id 101 Стевия
calendar: { sow: [3], plant: [5], harvest: [8, 9, 10], note: "В саксия; внеси на закрито преди първата слана (средата на октомври)" },
// id 102 Дафинов лист
calendar: { plant: [4, 5], note: "Листата се берат целогодишно; внеси на закрито преди трайни студове (октомври)" },
// id 103 Лимонена трева
calendar: { plant: [5], harvest: [7, 8, 9], note: "В саксия; внеси на закрито в началото на октомври — крайно чувствителна на слана" },
// id 104 Маргаритка
calendar: { plant: [4, 5], bloom: [6, 7, 8], note: "Премахвай прецъфтелите цветове за по-дълъг цъфтеж; дели туфата на 2-3 години" },
// id 105 Астра
calendar: { sow: [3, 4], plant: [4, 5], bloom: [7, 8, 9, 10], note: "Не сади на същото място всяка година (фузарий)" },
// id 106 Фрезия
calendar: { plant: [4, 5], bloom: [7, 8, 9], note: "Извади клубнелуковиците наесен преди слана и съхранявай на сухо и хладно" },
// id 107 Кокиче
calendar: { plant: [9, 10], bloom: [2, 3], note: "Остави листата да изсъхнат естествено след цъфтеж; дели туфите веднага след цъфтеж" },
// id 108 Мак
calendar: { sow: [3, 10], bloom: [5, 6, 7], note: "Самосейка; ориенталският мак изпада в летен покой след цъфтеж" },
// id 109 Гербер
calendar: { plant: [5], bloom: [6, 7, 8, 9, 10], note: "Не презимува навън — внеси саксията на светло и хладно (10-15°C)" },
// id 110 Нектарина
calendar: { plant: [3, 10, 11], prune: [2, 3, 8], harvest: [7, 8], note: "Пръскай срещу къдравост след листопада и в края на зимата, преди набъбване на пъпките" },
// id 111 Джанка
calendar: { plant: [3, 10, 11], prune: [6, 7, 8, 9], harvest: [7, 8], note: "Само лека резитба, през лятото в сухо време — раните заздравяват бързо" },
// id 112 Кестен
calendar: { plant: [3, 10, 11], prune: [1, 2, 12], harvest: [9, 10], note: "Нужни са поне 2 дървета — самонесъвместим, изисква кръстосано опрашване" },
// id 113 Азимина
calendar: { plant: [4, 5], prune: [3], harvest: [9, 10], note: "Нужни са 2+ дървета; засенчвай младите фиданки първите 1-2 години" },
// id 114 Маслина
calendar: { plant: [4, 5], prune: [3, 4], harvest: [10, 11], note: "Гранична култура — в Северна България само в саксия със зимна защита" },
// id 115 Хинап
calendar: { plant: [4, 5], prune: [2, 3], harvest: [9, 10], note: "Късният цъфтеж (средата на лятото) избягва пролетните слани; избягвай тежка резитба" },
// id 116 Черен бъз
calendar: { plant: [3, 4, 10, 11], prune: [1, 2, 12], bloom: [5, 6], harvest: [8, 9], note: "Берат се и цветовете (май-юни), и плодовете; при резитба махай стъбла над 3 години" },
// id 117 Фейхоа
calendar: { plant: [4, 5], prune: [3], harvest: [10, 11], note: "Не презимува на открито в континентална България — отглеждай в саксия" },
// id 118 Дрян
calendar: { plant: [3, 4, 10, 11], prune: [3], bloom: [3, 4], harvest: [8, 9, 10], note: "Цъфти преди разлистване — ранен източник на нектар; плодовете зреят постепенно" },
// id 119 Люляк
calendar: { plant: [3, 10, 11], prune: [5, 6], bloom: [4, 5], note: "Режи веднага след прецъфтяване — цъфти на стара дървесина" },
// id 120 Хибискус градински
calendar: { plant: [4, 5, 9], prune: [2, 3], bloom: [6, 7, 8, 9], note: "Цъфти по новия прираст — пролетната резитба дава по-едри цветове" },
// id 121 Йошта
calendar: { plant: [3, 10, 11], prune: [1, 2, 12], harvest: [6, 7], note: "При зимната резитба остави 6-9 силни издънки (по 3 на възраст 1, 2 и 3 г.)" },
```

Do NOT include the `// id N ...` comment lines in plants.js — they only map entries to plants here.

- [ ] **Step 2: Verify all 30 entries landed and file parses**

Run (Git Bash): `grep -c "calendar: {" src/data/plants.js`
Expected: `30`

Run: `npm run build`
Expected: `✓ built` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/plants.js
git commit -m "feat: add calendar data (sow/plant/prune/bloom/harvest) to round-3 plants"
```

---

### Task 2: PlantTimeline component

**Files:**
- Create: `src/components/PlantTimeline.jsx`

**Interfaces:**
- Consumes: `calendar` object from Task 1.
- Produces: default export `PlantTimeline({ calendar })` — renders the 12-month strip (used by Task 3); named export `ACTIVITIES` — shared activity keys/labels/colors (used by Task 4).

- [ ] **Step 1: Create the component**

Create `src/components/PlantTimeline.jsx` with exactly:

```jsx
import { useState, Fragment } from 'react'

const MONTH_INITIALS = ['Я', 'Ф', 'М', 'А', 'М', 'Ю', 'Ю', 'А', 'С', 'О', 'Н', 'Д']

export const ACTIVITIES = [
  { key: 'sow',     label: 'Сеитба',    short: 'Засей',  color: '#4A7C59', now: 'време за сеитба' },
  { key: 'plant',   label: 'Засаждане', short: 'Засади', color: '#7BB88F', now: 'време за засаждане' },
  { key: 'prune',   label: 'Резитба',   short: 'Режи',   color: '#3B82F6', now: 'време за резитба' },
  { key: 'bloom',   label: 'Цъфтеж',    short: 'Цъфти',  color: '#C75B8E', now: 'цъфти' },
  { key: 'harvest', label: 'Беритба',   short: 'Бери',   color: '#C97D0E', now: 'време за беритба' },
]

export default function PlantTimeline({ calendar }) {
  const [showNote, setShowNote] = useState(false)
  const month = new Date().getMonth() + 1
  const rows = ACTIVITIES.filter(a => calendar[a.key]?.length > 0)
  const nowActs = rows.filter(a => calendar[a.key].includes(month)).map(a => a.now)

  return (
    <div>
      <div className="relative">
        {/* "today" marker across all rows */}
        <div
          className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
          style={{ left: `calc(58px + (100% - 58px) * ${(month - 0.5) / 12})`, background: '#1E3A2F', opacity: 0.4 }}
        />
        <div className="grid gap-y-1.5 items-center" style={{ gridTemplateColumns: '58px repeat(12, 1fr)' }}>
          <div />
          {MONTH_INITIALS.map((mi, i) => (
            <div key={i} className="text-center text-[10px] font-bold"
              style={{ color: i + 1 === month ? '#1E3A2F' : '#B3D9C4' }}>
              {mi}
            </div>
          ))}
          {rows.map(a => (
            <Fragment key={a.key}>
              <div className="text-[10px] font-semibold pr-1.5" style={{ color: '#6A9E78' }}>{a.label}</div>
              {MONTH_INITIALS.map((_, i) => {
                const on = calendar[a.key].includes(i + 1)
                return (
                  <div
                    key={i}
                    onClick={() => on && calendar.note && setShowNote(s => !s)}
                    className="h-3.5 mx-px rounded-sm"
                    style={{ background: on ? a.color : '#F0EBE3', cursor: on && calendar.note ? 'pointer' : 'default' }}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="text-xs mt-3 font-medium" style={{ color: nowActs.length ? '#1E3A2F' : '#9CA3AF' }}>
        {nowActs.length ? `Сега: ${nowActs.join(', ')}` : 'Няма задачи този месец'}
      </div>

      {showNote && calendar.note && (
        <div className="text-xs mt-2 rounded-xl p-3" style={{ background: '#fff', border: '1px solid #E8E3D9', color: '#1C2B23' }}>
          {calendar.note}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ built` (the component is not imported anywhere yet — build just confirms it parses).

- [ ] **Step 3: Commit**

```bash
git add src/components/PlantTimeline.jsx
git commit -m "feat: add PlantTimeline 12-month strip component"
```

---

### Task 3: "Календар" tab in Plants.jsx

**Files:**
- Modify: `src/pages/Plants.jsx`

**Interfaces:**
- Consumes: `PlantTimeline` default export (Task 2), `plant.calendar` (Task 1).

- [ ] **Step 1: Add imports**

In `src/pages/Plants.jsx`, add `CalendarDays` to the lucide-react import (line 2) and import the component:

```jsx
import { Search, Droplets, Sprout, Bug, ChevronDown, ChevronUp, Lightbulb, Shield, Check, CalendarDays } from 'lucide-react'
import PlantTimeline from '../components/PlantTimeline'
```

- [ ] **Step 2: Add the tab definition**

In the module-level `tabDefs` array, add a 4th entry after `pest`:

```jsx
const tabDefs = [
  { id: 'water', label: 'Поливане', Icon: Droplets, active: { background: '#EFF8FF', color: '#2563EB' } },
  { id: 'fertilize', label: 'Торене', Icon: Sprout, active: { background: '#E8F5F0', color: '#1E5C3A' } },
  { id: 'pest', label: 'Защита', Icon: Bug, active: { background: '#FDF3DC', color: '#7A4A00' } },
  { id: 'calendar', label: 'Календар', Icon: CalendarDays, active: { background: '#EDE4F5', color: '#4A2A6B' } },
]
```

- [ ] **Step 3: Filter tabs per plant and render the tab content**

Inside `PlantCard`, right after `const { fertilizing: f, watering: w } = plant`, add:

```jsx
const visibleTabs = plant.calendar ? tabDefs : tabDefs.filter(t => t.id !== 'calendar')
```

In the tab-bar JSX, change `{tabDefs.map(t => (` to `{visibleTabs.map(t => (`.

After the `{tab === 'pest' && (...)}` block, add:

```jsx
{tab === 'calendar' && plant.calendar && (
  <div className="p-4" style={{ background: '#FBF9FD' }}>
    <PlantTimeline calendar={plant.calendar} />
  </div>
)}
```

- [ ] **Step 4: Verify build + visual check**

Run: `npm run build` → expected `✓ built`.
Run `npm run dev`, open the Растения page:
- Люляк: expand card → 4 tabs; Календар shows rows Засаждане/Резитба/Цъфтеж, today-marker on July, status "Няма задачи този месец", clicking a filled segment toggles the note about pruning after bloom.
- Ряпа: Календар tab shows Сеитба (Мар-Апр, Юли-Авг) and Беритба; July is a sow month → "Сега: време за сеитба".
- Домат (id 1, no calendar): only 3 tabs.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Plants.jsx
git commit -m "feat: add Календар tab with PlantTimeline to plant cards"
```

---

### Task 4: "Този месец" section in MyGarden.jsx

**Files:**
- Modify: `src/pages/MyGarden.jsx`

**Interfaces:**
- Consumes: `ACTIVITIES` named export (Task 2), `catalog` (already imported), garden entries' `plantId`.

- [ ] **Step 1: Add imports**

In `src/pages/MyGarden.jsx`, add `CalendarDays` to the lucide-react import (line 2) and:

```jsx
import { ACTIVITIES } from '../components/PlantTimeline'
```

- [ ] **Step 2: Add the ThisMonth component**

At the bottom of the file (after the `PlantCard` function), add:

```jsx
const MONTH_NAMES = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември']

function ThisMonth({ myPlants }) {
  const month = new Date().getMonth() + 1
  const seen = new Set()
  const unique = myPlants.filter(p => !seen.has(p.plantId) && seen.add(p.plantId))
  const groups = ACTIVITIES
    .map(a => ({
      ...a,
      items: unique.filter(p => catalog.find(c => c.id === p.plantId)?.calendar?.[a.key]?.includes(month)),
    }))
    .filter(g => g.items.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
      <div className="font-semibold text-sm mb-2.5 flex items-center gap-1.5" style={{ color: '#1E3A2F' }}>
        <CalendarDays size={15} /> Този месец ({MONTH_NAMES[month - 1]})
      </div>
      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.key} className="flex items-start gap-2">
            <span className="text-xs font-semibold w-14 shrink-0 mt-1" style={{ color: g.color }}>{g.short}</span>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map(p => (
                <span key={p.plantId} className="text-xs px-2 py-1 rounded-full" style={{ background: '#F5F2EC', color: '#1C2B23' }}>
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Note: `Set.prototype.add` returns the Set (truthy), so the `unique` filter is correct.

- [ ] **Step 3: Render it**

In the `MyGarden` return, right after the closing of the `{showAdd && (...)}` block and before `{myPlants.length === 0 && (...)}`, add:

```jsx
<ThisMonth myPlants={myPlants} />
```

- [ ] **Step 4: Verify build + visual check**

Run: `npm run build` → expected `✓ built`.
In `npm run dev`, Моята градина: add Джанка (id 111) → section "Този месец (юли)" appears with "Режи 🟡 Джанка" and "Бери 🟡 Джанка". With only calendar-less plants (e.g. Домат), the section stays hidden.

- [ ] **Step 5: Commit**

```bash
git add src/pages/MyGarden.jsx
git commit -m "feat: add Този месец monthly-care section to MyGarden"
```

---

### Task 5: Search combobox in MyGarden add form

**Files:**
- Modify: `src/pages/MyGarden.jsx`

**Interfaces:**
- Consumes: existing `selectedId` state and `addPlant()`; existing `catStyle` map; `Search` icon from lucide-react.

- [ ] **Step 1: Add Search icon import**

Add `Search` to the lucide-react import in `src/pages/MyGarden.jsx`.

- [ ] **Step 2: Add query state and matches**

In the `MyGarden` component, next to the `selectedId` state, add:

```jsx
const [query, setQuery] = useState('')
```

Below the state declarations, add:

```jsx
const matches = catalog.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
```

In `addPlant()`, next to `setSelectedId('')`, add `setQuery('')`.

- [ ] **Step 3: Replace the select with the combobox**

Replace the whole `<select ...>...</select>` block (currently lines 109–114) with:

```jsx
<div className="relative mb-3">
  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#B3D9C4' }} />
  <input
    type="text"
    placeholder="Търси растение..."
    value={query}
    onChange={e => { setQuery(e.target.value); setSelectedId('') }}
    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
    style={{ border: `1px solid ${selectedId ? '#4A7C59' : '#B3D9C4'}`, background: '#F5F2EC', color: '#1C2B23' }}
  />
  {query && !selectedId && (
    <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 max-h-64 overflow-y-auto"
      style={{ background: '#fff', border: '1px solid #B3D9C4', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
      {matches.map(p => {
        const cat = catStyle[p.category] || catStyle['зеленчук']
        return (
          <button key={p.id} onClick={() => { setSelectedId(String(p.id)); setQuery(p.name) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:opacity-70"
            style={{ color: '#1C2B23' }}>
            <span>{p.emoji}</span>
            <span className="flex-1">{p.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>{p.category}</span>
          </button>
        )
      })}
      {matches.length === 0 && (
        <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>Няма намерени растения</div>
      )}
    </div>
  )}
</div>
```

Note the `mb-3` moved onto the wrapper div (the select had it via its own class).

- [ ] **Step 4: Verify build + visual check**

Run: `npm run build` → expected `✓ built`.
In `npm run dev`, Моята градина → Добави:
- Typing "рук" shows Рукола with category chip; clicking fills the input and greens the border.
- "Добави" adds the plant and clears the input; typing again after a selection clears the selection (border back to pale).
- Typing "xyz" shows "Няма намерени растения".

- [ ] **Step 5: Commit**

```bash
git add src/pages/MyGarden.jsx
git commit -m "feat: replace MyGarden plant select with search combobox"
```

---

## Final verification

- [ ] `npm run build` passes.
- [ ] `grep -c "calendar: {" src/data/plants.js` → 30.
- [ ] Visual pass over: Растения (4-tab card for id ≥ 92, 3-tab for id ≤ 91), Моята градина ("Този месец" + combobox), Календар page unchanged.
- [ ] Ask the user before pushing to GitHub.
