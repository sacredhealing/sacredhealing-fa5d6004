#!/usr/bin/env node
/**
 * SQI Weekly Digest — Add New Content
 * Usage: node scripts/add-weekly-content.mjs "Shiva Mantra Series" "mantra" "A new 18-part series channelled from the Kailash Akasha field" "siddha"
 * Types: meditation | beat | song | course | mantra | feature | announcement | tool
 * Tiers: free | prana | siddha | akasha
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

const [title, type, description, tier] = process.argv.slice(2);

if (!title || !type) {
  console.log(`
Usage:
  node scripts/add-weekly-content.mjs <title> <type> [description] [tier]

Types:   meditation | beat | song | course | mantra | feature | announcement | tool
Tiers:   free | prana | siddha | akasha  (default: free)

Examples:
  node scripts/add-weekly-content.mjs "New Lakshmi Mantra" mantra "432Hz abundance activation" prana
  node scripts/add-weekly-content.mjs "Chakra Healing Beat" beat "Root to Crown sonic transmission" free
  node scripts/add-weekly-content.mjs "Palm Oracle v2 Launch" feature "AI-powered palm reading now live" free
`);
  process.exit(0);
}

const validTypes = ['meditation','beat','song','course','mantra','feature','announcement','tool'];
const validTiers = ['free','prana','siddha','akasha'];

if (!validTypes.includes(type)) {
  console.error(`❌ Invalid type "${type}". Valid: ${validTypes.join(', ')}`);
  process.exit(1);
}

const resolvedTier = validTiers.includes(tier) ? tier : 'free';

const res = await fetch(`${SUPABASE_URL}/rest/v1/content_changelog`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  },
  body: JSON.stringify({
    content_title: title,
    content_type: type,
    content_description: description || null,
    tier_required: resolvedTier,
    auto_announced: false,
    included_in_digest: false,
  }),
});

if (!res.ok) {
  const err = await res.text();
  console.error(`❌ Failed: ${res.status} ${err}`);
  process.exit(1);
}

const data = await res.json();
console.log(`✦ Content added to this week's Nexus digest:`);
console.log(`  Title: ${title}`);
console.log(`  Type:  ${type}`);
console.log(`  Tier:  ${resolvedTier}`);
console.log(`  ID:    ${data[0]?.id || 'created'}`);
console.log('');
console.log('It will appear in Monday's email automatically.');
