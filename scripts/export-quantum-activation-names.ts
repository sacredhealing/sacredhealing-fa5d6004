/**
 * Writes supabase/functions/quantum-apothecary-chat/activation-names.txt
 * from ALL_ACTIVATIONS (Cymbiotika + LimbicArc + bioenergetic library; must stay in sync with the app).
 * Run via: npx tsx scripts/export-quantum-activation-names.ts
 * Hooked from npm prebuild.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_ACTIVATIONS } from '../src/features/quantum-apothecary/constants';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, '../supabase/functions/quantum-apothecary-chat/activation-names.txt');
const text = ALL_ACTIVATIONS.map((a) => a.name).join('\n');
writeFileSync(out, text, 'utf8');
console.log(`export-quantum-activation-names: wrote ${ALL_ACTIVATIONS.length} lines → ${out}`);
