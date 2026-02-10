
## Add `language` and `tags` Columns to Healing Audio

Currently, the `healing_audio` table has neither a `language` nor a `tags` column. This plan adds both columns and populates them for all 20 existing items.

### Step 1: Database Migration -- Add Columns

Add two new columns to `healing_audio`:
- `language` (TEXT, default `'en'`) -- values: `"en"` or `"sv"`
- `tags` (TEXT[], i.e. a text array) -- e.g. `{"calm", "ground", "heart"}`

### Step 2: Populate Data for All 20 Items

Based on the existing titles and categories, here is how each item will be tagged:

**Swedish items** (language = `"sv"`):
| Title | Tags |
|-------|------|
| 432HZ REN FREKVENS (SWE) | calm, ground |
| Sacral Chakra Flow Swe | heart, comfort |
| Kron Aktivering | calm, ground |
| Lymfisk Lakning | calm, soften |

**English items** (language = `"en"`, all remaining 16):
| Title | Tags |
|-------|------|
| Root Chakra Grounding | calm, ground |
| Solar Plexus Power | breath, ground |
| Full Chakra Alignment | calm, ground |
| Crystal Bowl Sound Bath | calm, soften |
| Tibetan Singing Bowl Journey | calm, ground |
| Gong Bath Meditation | calm, ground |
| Cellular Regeneration | heart, soften |
| Immune System Boost | breath, calm |
| Pain Relief Meditation | calm, comfort |
| Emotional Trauma Release | heart, comfort, soften |
| 528Hz DNA Repair | calm, ground |
| 432Hz Pure Frequency | calm, ground |
| Sacral Chakra Flow | heart, comfort |
| 741Hz Detox Frequency | calm, ground |
| 963Hz Crown Activation | calm, ground |
| 432 HZ PURE FREQUENCY (ENG) | calm, ground |

### Step 3: Update TypeScript Code

- The `getItemLanguage` helper in `src/features/meditations/getItemLanguage.ts` already checks for `item.language` -- no change needed there once the column exists.
- The `groupAndFilter.ts` `textOf` function already reads `item.tags` -- it will automatically pick up array tags.
- Update queries in `src/pages/Healing.tsx` and admin pages to select the new columns (they use `select('*')` so this is automatic).

### Technical Details

**Migration SQL** (schema change):
```sql
ALTER TABLE public.healing_audio
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
```

**Data population** (via update tool, per-item UPDATE statements):
- 4 UPDATE statements setting `language = 'sv'` and appropriate tags for Swedish items
- 16 UPDATE statements setting tags for English items (language defaults to `'en'`)

No frontend code changes are strictly required since existing helpers already look for these fields.
