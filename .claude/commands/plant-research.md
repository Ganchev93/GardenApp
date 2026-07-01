---
description: Deep research on plants for the GardenCare catalog — watering, fertilizing, pests, calendar data
argument-hint: <plant name(s)> | verify <plant name>
---

# Plant Research

Research plant care data and produce catalog-ready entries for `src/data/plants.js`. Input: `$ARGUMENTS` — one or more plant names (comma-separated), or `verify <name>` to fact-check an existing entry.

## Steps

### 1. Check the catalog first

Read `src/data/plants.js`. If the plant already exists and mode is not `verify`, say so and stop — offer verify instead. Note the highest `id` for new entries.

### 2. Research (per plant)

Use WebSearch. Minimum **3 independent sources** per plant, in priority order:

1. University agricultural extensions (extension.*.edu), RHS (rhs.org.uk), official agro institutes
2. Established gardening sites (gardenersworld, almanac.com)
3. Bulgarian agro sites (agro.bg, gradinata.bg, rasteniq.com) — for local varieties, timing, and Bulgarian pest names

Collect for each plant:

- **Watering**: frequency (days), amount per plant or m², critical periods, technique warnings (root vs leaves)
- **Fertilizing**: frequency (days), NPK type or organic alternative, dose (g/l or g/m²), active seasons, what to avoid
- **Pests & diseases**: top 3 most common, natural/organic remedies (recipes with proportions), prevention incl. crop rotation partners
- **Calendar**: sow / plant / harvest months **for Bulgaria** (continental climate; last frost ~15 April – 15 May, first frost ~mid October)

### 3. Cross-check

- Watering/fertilizing frequency differs across sources → take the range midpoint, mention the range in `notes`
- A pest or remedy appears in only one source → drop it
- Doses without units or units that don't convert to г/л or г/м² → find a better source
- Data for a different climate (tropical, UK-mild) → adjust for Bulgaria and say you did

### 4. Output

**All text in Bulgarian.** Match the exact schema and style of existing entries (short practical notes, concrete doses):

```js
{
  id: <next free id>, name: "<Име>", category: "зеленчук|плод|билка|цвете", emoji: "<емоджи>",
  watering: { frequency_days: <n>, amount: "<X л/растение или л/м²>", notes: "<1-2 изречения, практични>" },
  fertilizing: { frequency_days: <n>, seasons: ["пролет", ...], fertilizer_type: "<тип>", dose: "<X г/л вода>", notes: "<1-2 изречения>" },
  pest_control: { pests: ["<3 вредителя>"], natural: ["<3 рецепти с пропорции>"], prevention: "<сеитбооборот + 1 съвет>" }
},
```

After the object, add:

- **Календар**: кои месеци за засяване/засаждане/прибиране (за `Calendar.jsx` данните)
- **Източници**: списък с URL-и
- **Несигурности**: ако източниците спорят или данните са тънки — кажи го, не замазвай

### 5. Verify mode

`verify <name>`: research the same fields, compare against the existing entry field by field, and report a table: поле / в каталога / източниците казват / вердикт (ОК | коригирай). Propose the corrected object only for fields that are wrong.

## Rules

- Never invent doses, frequencies, or remedy recipes — everything traces to a source
- Bulgarian climate context always; if a plant can't survive Bulgarian winters outdoors, say so in `notes`
- Don't write to `plants.js` unless explicitly asked — output the object for review first
- Batch: for multiple plants, research all, then output all objects together in one block ready to paste
