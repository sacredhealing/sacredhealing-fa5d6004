Index · TS
Copy

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.17'
 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
 
const R2_ACCOUNT_ID = '79dae6f785e6758a441aa69dd3f7b2af'
const R2_ACCESS_KEY = 'fe3243e15f429886b7f3c5d9e23c8262'
const R2_SECRET_KEY = '3e8dab0a93ba4eaa1f1b4c43682e15a961d6d1b269b8e0b40ed64fbd2e025e50'
const R2_BUCKET = 'siddhaquantumnexus'
const R2_PUBLIC_URL = 'https://pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev'
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
 
const URL_COLUMNS = [
  { table: 'frequencies', column: 'audio_url' },
  { table: 'frequencies', column: 'preview_url' },
  { table: 'frequencies', column: 'image_url' },
  { table: 'activations', column: 'audio_url' },
  { table: 'activations', column: 'image_url' },
  { table: 'activation_transmissions', column: 'audio_url' },
  { table: 'music_tracks', column: 'audio_url' },
  { table: 'music_tracks', column: 'cover_url' },
  { table: 'pranayama_sessions', column: 'audio_url' },
  { table: 'healing_audios', column: 'audio_url' },
  { table: 'transmission_recordings', column: 'audio_url' },
  { table: 'recordings', column: 'audio_url' },
  { table: 'recordings', column: 'url' },
  { table: 'profiles', column: 'avatar_url' },
  { table: 'courses', column: 'image_url' },
  { table: 'courses', column: 'audio_url' },
  { table: 'products', column: 'image_url' },
  { table: 'virtual_pilgrimages', column: 'audio_url' },
  { table: 'virtual_pilgrimages', column: 'image_url' },
  { table: 'sacred_sites', column: 'audio_url' },
  { table: 'sacred_sites', column: 'image_url' },
  { table: 'quantum_sessions', column: 'audio_url' },
  { table: 'nada_transmissions', column: 'audio_url' },
  { table: 'kosha_sessions', column: 'audio_url' },
]
 
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
 
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const r2 = new AwsClient({ accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY, service: 's3', region: 'auto' })
  const url = new URL(req.url)
  const mode = url.searchParams.get('mode') || 'status'
 
  if (mode === 'status') {
    const { data: buckets } = await supabase.storage.listBuckets()
    const summary: any[] = []
    if (buckets) {
      for (const bucket of buckets) {
        const files = await listAllFiles(supabase, bucket.name, '')
        summary.push({ bucket: bucket.name, files: files.length })
      }
    }
    return new Response(JSON.stringify({ status: 'ready', buckets: summary }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
 
  if (mode === 'migrate') {
    const targetBucket = url.searchParams.get('bucket')
    const results: any = { migrated: 0, failed: 0, skipped: 0, errors: [], url_updates: 0 }
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets) return new Response(JSON.stringify({ error: 'No buckets found' }), { headers: corsHeaders })
 
    const toMigrate = targetBucket ? buckets.filter(b => b.name === targetBucket) : buckets
 
    for (const bucket of toMigrate) {
      const files = await listAllFiles(supabase, bucket.name, '')
      for (const file of files) {
        try {
          const r2Key = `${bucket.name}/${file.name}`
          const check = await r2.fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${r2Key}`, { method: 'HEAD' })
          if (check.ok) { results.skipped++; continue }
 
          const { data: fileData, error: dlErr } = await supabase.storage.from(bucket.name).download(file.name)
          if (dlErr || !fileData) { results.failed++; results.errors.push(`DL fail: ${bucket.name}/${file.name}`); continue }
 
          const buf = await fileData.arrayBuffer()
          const up = await r2.fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${r2Key}`, {
            method: 'PUT', body: buf,
            headers: { 'Content-Type': getContentType(file.name) }
          })
          if (!up.ok) { results.failed++; results.errors.push(`UP fail: ${r2Key} ${up.status}`); continue }
          results.migrated++
        } catch (e: any) { results.failed++; results.errors.push(e.message) }
      }
 
      const oldBase = `${supabaseUrl}/storage/v1/object/public/${bucket.name}/`
      const newBase = `${R2_PUBLIC_URL}/${bucket.name}/`
      for (const { table, column } of URL_COLUMNS) {
        try {
          const { data: rows } = await supabase.from(table).select(`id, ${column}`).like(column, `${oldBase}%`)
          if (rows?.length) {
            for (const row of rows) {
              await supabase.from(table).update({ [column]: row[column].replace(oldBase, newBase) }).eq('id', row.id)
              results.url_updates++
            }
          }
        } catch { /* table doesn't exist, skip */ }
      }
    }
 
    return new Response(JSON.stringify({
      ...results,
      message: `✅ ${results.migrated} files migrated to R2. ${results.skipped} already there. ${results.url_updates} DB URLs updated. ${results.failed} failed.`
    }, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
 
  return new Response(JSON.stringify({
    usage: { check: '?mode=status', migrate_all: '?mode=migrate', migrate_one: '?mode=migrate&bucket=audio' }
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
 
async function listAllFiles(supabase: any, bucket: string, folder: string): Promise<any[]> {
  const { data: items } = await supabase.storage.from(bucket).list(folder, { limit: 1000 })
  if (!items) return []
  let files: any[] = []
  for (const item of items) {
    if (item.id === null) {
      files = files.concat(await listAllFiles(supabase, bucket, folder ? `${folder}/${item.name}` : item.name))
    } else {
      files.push({ ...item, name: folder ? `${folder}/${item.name}` : item.name })
    }
  }
  return files
}
 
function getContentType(f: string): string {
  const e = f.split('.').pop()?.toLowerCase()
  return ({ mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',flac:'audio/flac',m4a:'audio/mp4',
    aac:'audio/aac',webm:'audio/webm',mp4:'video/mp4',jpg:'image/jpeg',jpeg:'image/jpeg',
    png:'image/png',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',pdf:'application/pdf' } as any)[e||''] || 'application/octet-stream'
}
 
