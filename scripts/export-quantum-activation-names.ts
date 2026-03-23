/**
 * Writes supabase/functions/quantum-apothecary-chat/activation-names.txt
 * from ACTIVATIONS (must stay in sync with the app bundle).
 * Run via: npx tsx scripts/export-quantum-activation-names.ts
 * Hooked from npm prebuild.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIVATIONS } from '../src/features/quantum-apothecary/constants';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, '../supabase/functions/quantum-apothecary-chat/activation-names.txt');
const text = ACTIVATIONS.map((a) => a.name).join('\n');
writeFileSync(out, text, 'utf8');
console.log(`export-quantum-activation-names: wrote ${ACTIVATIONS.length} lines → ${out}`);
