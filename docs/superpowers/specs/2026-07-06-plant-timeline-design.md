# Plant Timeline + Garden Search — Design

**Date:** 2026-07-06
**Status:** Approved

## Goal

Two additions to the GardenCare PoC:

1. **Interactive yearly timeline** per plant — a 12-month strip showing sow / plant / prune / harvest periods with a "today" marker, plus an aggregated "This month" view in MyGarden.
2. **Searchable plant picker** in MyGarden — replace the plain `<select>` (121 options) with a search combobox.

## Data model

New **optional** field `calendar` on plant objects in `src/data/plants.js`:

```js
calendar: {
  sow: [3, 4],        // months 1-12, сеитба (direct or indoor)
  plant: [5],         // засаждане / разсад / луковици
  prune: [2, 3],      // резитба
  harvest: [7, 8, 9], // беритба; for flowers this is bloom (цъфтеж)
  note: "Засаждане навън след 15 май (последен мраз)" // optional, one short BG string
}
```

- Empty activities are omitted (no empty arrays).
- Months may wrap the year boundary (e.g. prune: [11, 12, 1, 2]) — stored as plain month numbers, no special encoding.
- **Scope now:** fill `calendar` for the round-2/round-3 plants (the ones covered by scratchpad research reports, roughly ids 61–121) by extracting from those reports.
- **Deferred:** the original pre-round-2 plants get no `calendar` field for now; a later light research round will fill them. UI must handle the field being absent.

## Component: `PlantTimeline`

New file `src/components/PlantTimeline.jsx`.

**Props:** `calendar` (the plant's calendar object), `category` (plant category string, used for the harvest-row label).

**Rendering (CSS grid, no SVG):**
- Header row: 12 month initials (Я Ф М А М Ю Ю А С О Н Д), current month highlighted.
- One row per present activity (max 4), each row a 12-column grid; active months are filled segments in the activity color, inactive are faint track cells.
- Activity colors reuse the Calendar.jsx section theme: sow `#4A7C59` (green), plant `#A8D5BE`-family (emerald), harvest `#C97D0E` (orange), prune `#3B82F6` (blue).
- Vertical "today" marker line spanning all rows at the current month position.
- Below the strip: a status line — "Сега: време за беритба" (joins all activities active in the current month) or "Няма задачи този месец".
- Tapping/clicking a segment shows the `note` (if any) under the status line; tapping again hides it. One shared note per plant, not per activity.
- Row labels: Сеитба / Засаждане / Резитба / Беритба (Цъфтеж for category "цвете").

## Integration

### Plants.jsx — fourth tab "Календар"

- Add `{ id: 'calendar', label: 'Календар', Icon: CalendarDays }` to `tabDefs`, styled consistently with the existing three tabs.
- Tab content renders `<PlantTimeline calendar={plant.calendar} />`.
- If `plant.calendar` is absent, the tab is **not rendered** at all (tabDefs filtered per plant).

### MyGarden.jsx — "Този месец" section

- New section above the garden list, shown only when the garden is non-empty and at least one garden plant has calendar data with activity in the current month.
- Groups the user's plants by activity for the current month: "Засей: …", "Засади: …", "Режи: …", "Бери: …" — each a row of emoji+name chips.
- Garden entries store only a plant reference; calendar is looked up from the catalog by plant id at render time (no localStorage migration needed). Existing garden entries keep working.

### MyGarden.jsx — search combobox

- Replace the `<select>` in the add-plant form with a combobox:
  - Text input; typing filters the catalog by name (case-insensitive substring, same as Plants.jsx).
  - Dropdown list under the input: emoji + name + category chip; max ~8 visible, scrollable.
  - Click/tap selects, fills the input with the name, stores the id in existing `selectedId` state.
  - Clearing the input clears the selection; plants already in the garden are excluded from results (current behavior of the select, if present, preserved — otherwise no exclusion added).
- No keyboard-navigation (arrow keys) requirements — tap/click select is enough for the PoC.

## Error handling

- Absent `calendar` → no Календар tab, plant simply not counted in "Този месец".
- All-empty calendar object won't occur (we only add the field with at least one activity).

## Testing

Manual, per PoC convention (no test runner in the project):
- `npm run build` passes.
- Visual check: timeline renders for a round-3 plant (e.g. Люляк — prune after bloom note), tab absent for an old plant (e.g. Домат), "Този месец" aggregates correctly for July, combobox filters and selects.

## Out of scope

- Calendar data for the original 61 plants (separate later round).
- Calendar.jsx changes — the monthly page stays as is.
- Per-activity notes, animations beyond simple mount transition, keyboard navigation in the combobox.
