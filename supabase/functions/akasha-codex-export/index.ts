// ============================================================
// akasha-codex-export
// ============================================================
// Generates two export formats from a codex_type:
//   1. Print-ready HTML (KDP 6×9 trim, drop caps, gold numerals,
//      @page rules — open in browser, "Print to PDF" → upload to KDP)
//   2. EPUB 3 (Kindle, Apple Books, Kobo compatible)
//
// Body: { codex_type: 'akasha' | 'portrait', format: 'print_html' | 'epub' }
// Returns: { url } for HTML, or a binary EPUB stream.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

interface ExportBody {
  codex_type: "akasha" | "portrait";
  format: "print_html" | "epub";
  title?: string;
  subtitle?: string;
  author?: string;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ExportBody;
    const { codex_type, format } = body;

    // Fetch all chapters in tree order
    const { data: chapters } = await admin
      .from("codex_chapters")
      .select(
        "id, parent_id, title, slug, opening_hook, prose_woven, closing_reflection, image_url, depth, order_index, created_at"
      )
      .eq("user_id", user.id)
      .eq("codex_type", codex_type)
      .order("depth", { ascending: true })
      .order("order_index", { ascending: true });

    if (!chapters || chapters.length === 0) {
      return new Response(JSON.stringify({ error: "no chapters yet" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tree = buildTree(chapters);
    const meta = {
      title:
        body.title ??
        (codex_type === "akasha" ? "The Akashic Codex" : "The Living Portrait"),
      subtitle:
        body.subtitle ??
        (codex_type === "akasha"
          ? "Channelled from the Akasha-Neural Archive of 2050"
          : "A Sovereign Soul-Record"),
      author: body.author ?? "Kritagya Das · SQI 2050",
    };

    if (format === "print_html") {
      const html = renderPrintHtml(tree, meta);
      const path = `${user.id}/${codex_type}-print-${Date.now()}.html`;
      const { error: upErr } = await admin.storage
        .from("codex-images")
        .upload(path, new Blob([html], { type: "text/html" }), { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = admin.storage
        .from("codex-images")
        .getPublicUrl(path);
      return new Response(JSON.stringify({ url: urlData.publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (format === "epub") {
      const epub = await renderEpub(tree, meta);
      return new Response(epub, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${meta.title.replace(/[^a-z0-9]/gi, "-")}.epub"`,
        },
      });
    }

    return new Response(JSON.stringify({ error: "unknown format" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[export] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ----------------------------------------------------------------
// Tree assembly
// ----------------------------------------------------------------
type Chapter = {
  id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  opening_hook: string | null;
  prose_woven: string | null;
  closing_reflection: string | null;
  image_url: string | null;
  depth: number;
  order_index: number;
  children?: Chapter[];
};

function buildTree(rows: Chapter[]): Chapter[] {
  const byId = new Map<string, Chapter>();
  for (const r of rows) byId.set(r.id, { ...r, children: [] });
  const roots: Chapter[] = [];
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.children!.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

// ----------------------------------------------------------------
// HTML renderer — print-quality, KDP 6×9, drop caps, gold numerals
// ----------------------------------------------------------------
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function proseToParagraphs(prose: string | null): string {
  if (!prose) return "";
  // Replace verbatim <t>…</t> tags with semantic paragraphs (preserve content)
  // Each transmission becomes a paragraph; connective text stays as paragraphs.
  const cleaned = prose
    .replace(/<t>/g, "")
    .replace(/<\/t>/g, "")
    .trim();
  return cleaned
    .split(/\n{2,}/)
    .map((p, i) => {
      const safe = escapeHtml(p.trim());
      const dropcap = i === 0 ? ' class="dropcap"' : "";
      return `<p${dropcap}>${safe}</p>`;
    })
    .join("\n");
}

function renderChapterHtml(ch: Chapter, num: string): string {
  const parts: string[] = [];
  parts.push(`<section class="chapter" id="ch-${ch.id}">`);
  parts.push(`<div class="chapter-num">${num}</div>`);
  parts.push(`<h1 class="chapter-title">${escapeHtml(ch.title)}</h1>`);
  if (ch.image_url) {
    parts.push(
      `<figure class="chapter-image"><img src="${ch.image_url}" alt=""/></figure>`
    );
  }
  if (ch.opening_hook) {
    parts.push(`<p class="hook">${escapeHtml(ch.opening_hook)}</p>`);
  }
  parts.push(`<div class="prose">${proseToParagraphs(ch.prose_woven)}</div>`);
  if (ch.closing_reflection) {
    parts.push(`<p class="reflection">${escapeHtml(ch.closing_reflection)}</p>`);
  }
  parts.push("</section>");
  if (ch.children?.length) {
    let i = 1;
    for (const c of ch.children) {
      parts.push(renderChapterHtml(c, `${num}.${i}`));
      i++;
    }
  }
  return parts.join("\n");
}

function renderPrintHtml(
  tree: Chapter[],
  meta: { title: string; subtitle: string; author: string }
): string {
  // Numbered chapters (skip parent-only auto-merge nodes? No — number all)
  const chapterHtml: string[] = [];
  let idx = 1;
  for (const c of tree) {
    chapterHtml.push(renderChapterHtml(c, String(idx).padStart(2, "0")));
    idx++;
  }

  // Table of contents
  const tocHtml: string[] = [];
  let tocIdx = 1;
  const walk = (nodes: Chapter[], prefix: string) => {
    for (const c of nodes) {
      const num = prefix ? `${prefix}` : String(tocIdx).padStart(2, "0");
      tocHtml.push(
        `<li><a href="#ch-${c.id}"><span class="toc-num">${num}</span><span class="toc-title">${escapeHtml(c.title)}</span></a></li>`
      );
      if (!prefix) tocIdx++;
      if (c.children?.length) {
        let j = 1;
        for (const cc of c.children) {
          tocHtml.push(
            `<li class="sub"><a href="#ch-${cc.id}"><span class="toc-num">${num}.${j}</span><span class="toc-title">${escapeHtml(cc.title)}</span></a></li>`
          );
          j++;
        }
      }
    }
  };
  walk(tree, "");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(meta.title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;800;900&display=swap');
  @page { size: 6in 9in; margin: 0.75in 0.65in 0.85in 0.65in; }
  @page :first { margin: 0; }
  :root {
    --gold: #D4AF37;
    --black: #050505;
    --paper: #FAF7F0;
    --ink: #1A1A1A;
  }
  * { box-sizing: border-box; }
  html, body {
    background: var(--paper);
    color: var(--ink);
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.55;
    margin: 0; padding: 0;
  }
  .cover {
    page-break-after: always;
    height: 9in; width: 6in;
    background: var(--black); color: var(--gold);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 1in;
  }
  .cover .glyph { font-size: 64pt; letter-spacing: -0.05em; font-family: 'Plus Jakarta Sans'; font-weight: 900; }
  .cover .title { font-family: 'Plus Jakarta Sans'; font-weight: 900; font-size: 32pt; letter-spacing: -0.04em; line-height: 1.1; margin-top: 0.4in; }
  .cover .subtitle { font-style: italic; font-size: 12pt; margin-top: 0.3in; opacity: 0.85; max-width: 4in; }
  .cover .author { margin-top: auto; font-family: 'Plus Jakarta Sans'; font-weight: 800; letter-spacing: 0.5em; font-size: 8pt; text-transform: uppercase; }
  .toc { page-break-after: always; padding: 0.4in 0; }
  .toc h2 { font-family: 'Plus Jakarta Sans'; font-weight: 900; font-size: 22pt; letter-spacing: -0.03em; margin: 0 0 0.4in 0; }
  .toc ul { list-style: none; padding: 0; margin: 0; }
  .toc li { padding: 6pt 0; border-bottom: 0.5pt solid #ddd; display: flex; }
  .toc li.sub { padding-left: 0.4in; font-size: 10pt; }
  .toc a { color: var(--ink); text-decoration: none; display: flex; width: 100%; }
  .toc-num { width: 0.55in; color: var(--gold); font-family: 'Plus Jakarta Sans'; font-weight: 800; }
  .toc-title { flex: 1; }
  .chapter { page-break-before: always; }
  .chapter-num { font-family: 'Plus Jakarta Sans'; font-weight: 900; color: var(--gold); font-size: 56pt; letter-spacing: -0.05em; line-height: 1; margin-top: 0.4in; }
  .chapter-title { font-family: 'Plus Jakarta Sans'; font-weight: 900; font-size: 24pt; letter-spacing: -0.03em; line-height: 1.15; margin: 0.1in 0 0.3in 0; }
  .chapter-image { margin: 0 0 0.3in 0; padding: 0; text-align: center; }
  .chapter-image img { width: 60%; max-width: 3.4in; aspect-ratio: 1/1; object-fit: cover; border-radius: 0; filter: contrast(1.05); }
  .hook { font-style: italic; font-size: 12pt; color: #5a4a1c; margin-bottom: 0.25in; padding-left: 0; border-left: 2pt solid var(--gold); padding-left: 0.18in; }
  .prose p { text-align: justify; text-indent: 0.18in; margin: 0; }
  .prose p + p { margin-top: 0.07in; }
  .prose p.dropcap { text-indent: 0; }
  .prose p.dropcap::first-letter {
    font-family: 'Plus Jakarta Sans'; font-weight: 900;
    color: var(--gold);
    font-size: 42pt; line-height: 0.85;
    float: left; padding: 4pt 6pt 0 0;
  }
  .reflection { font-style: italic; margin-top: 0.25in; padding-top: 0.15in; border-top: 0.5pt solid var(--gold); color: #5a4a1c; }
  @media screen {
    body { padding: 30px 0; background: #ddd; }
    .cover, .toc, .chapter { background: var(--paper); width: 6in; min-height: 9in; padding: 0.75in 0.65in; margin: 20px auto; box-shadow: 0 6px 30px rgba(0,0,0,0.2); }
    .cover { color: var(--gold); background: var(--black); }
    .print-hint { position: fixed; top: 12px; right: 12px; background: var(--black); color: var(--gold); padding: 8px 14px; border-radius: 999px; font-family: 'Plus Jakarta Sans'; font-weight: 800; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; }
  }
</style>
</head>
<body>
<div class="print-hint" onclick="window.print()">Print to PDF</div>

<div class="cover">
  <div class="glyph">⟁</div>
  <div class="title">${escapeHtml(meta.title)}</div>
  <div class="subtitle">${escapeHtml(meta.subtitle)}</div>
  <div class="author">${escapeHtml(meta.author)}</div>
</div>

<div class="toc">
  <h2>Codex</h2>
  <ul>${tocHtml.join("\n")}</ul>
</div>

${chapterHtml.join("\n")}

</body>
</html>`;
}

// ----------------------------------------------------------------
// EPUB 3 generation
// ----------------------------------------------------------------
async function renderEpub(
  tree: Chapter[],
  meta: { title: string; subtitle: string; author: string }
): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
  );

  const flat: { id: string; title: string; href: string; html: string }[] = [];
  let n = 1;
  const walk = (nodes: Chapter[], prefix: string) => {
    for (const c of nodes) {
      const num = prefix ? prefix : String(n).padStart(2, "0");
      const html = epubChapterHtml(c, num, meta);
      flat.push({
        id: `ch${flat.length + 1}`,
        title: c.title,
        href: `chapter-${flat.length + 1}.xhtml`,
        html,
      });
      if (!prefix) n++;
      if (c.children?.length) {
        let j = 1;
        for (const cc of c.children) {
          walk([cc], `${num}.${j}`);
          j++;
        }
      }
    }
  };
  walk(tree, "");

  // Style
  zip.file(
    "OEBPS/style.css",
    `body { font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; padding: 0 1em; }
h1 { font-family: 'Helvetica Neue', sans-serif; font-weight: 900; color: #050505; letter-spacing: -0.03em; }
.num { color: #D4AF37; font-weight: 900; font-size: 2.5em; letter-spacing: -0.05em; }
.hook { font-style: italic; border-left: 2px solid #D4AF37; padding-left: 1em; color: #5a4a1c; }
.dropcap::first-letter { color: #D4AF37; font-size: 3em; line-height: 1; float: left; padding-right: 0.1em; font-weight: 900; }
.reflection { font-style: italic; border-top: 1px solid #D4AF37; padding-top: 1em; margin-top: 1.5em; color: #5a4a1c; }
.chapter-image img { display: block; margin: 1em auto; max-width: 80%; }`
  );

  // Cover XHTML
  zip.file(
    "OEBPS/cover.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head><title>Cover</title><link rel="stylesheet" href="style.css"/></head>
<body style="text-align:center;background:#050505;color:#D4AF37;padding:4em 2em;">
<h1 style="color:#D4AF37;font-size:2em;">${escapeHtml(meta.title)}</h1>
<p style="font-style:italic;">${escapeHtml(meta.subtitle)}</p>
<p style="margin-top:4em;letter-spacing:0.3em;text-transform:uppercase;font-size:0.7em;">${escapeHtml(meta.author)}</p>
</body></html>`
  );

  // Chapter XHTML files
  for (const f of flat) {
    zip.file(`OEBPS/${f.href}`, f.html);
  }

  // Nav (EPUB 3 toc)
  const navHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head><title>Codex</title><link rel="stylesheet" href="style.css"/></head>
<body><nav epub:type="toc"><h1>Codex</h1><ol>
${flat.map((f) => `<li><a href="${f.href}">${escapeHtml(f.title)}</a></li>`).join("\n")}
</ol></nav></body></html>`;
  zip.file("OEBPS/nav.xhtml", navHtml);

  // OPF
  const uid = crypto.randomUUID();
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:identifier id="bookid">urn:uuid:${uid}</dc:identifier>
  <dc:title>${escapeHtml(meta.title)}</dc:title>
  <dc:creator>${escapeHtml(meta.author)}</dc:creator>
  <dc:language>en</dc:language>
  <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
</metadata>
<manifest>
  <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
  <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  <item id="css" href="style.css" media-type="text/css"/>
  ${flat.map((f) => `<item id="${f.id}" href="${f.href}" media-type="application/xhtml+xml"/>`).join("\n  ")}
</manifest>
<spine>
  <itemref idref="cover"/>
  <itemref idref="nav"/>
  ${flat.map((f) => `<itemref idref="${f.id}"/>`).join("\n  ")}
</spine>
</package>`;
  zip.file("OEBPS/content.opf", opf);

  return await zip.generateAsync({ type: "uint8array" });
}

function epubChapterHtml(
  ch: Chapter,
  num: string,
  _meta: { title: string }
): string {
  const cleaned = (ch.prose_woven ?? "").replace(/<t>/g, "").replace(/<\/t>/g, "").trim();
  const paras = cleaned
    .split(/\n{2,}/)
    .map((p, i) => `<p${i === 0 ? ' class="dropcap"' : ""}>${escapeHtml(p.trim())}</p>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head><title>${escapeHtml(ch.title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
<p class="num">${num}</p>
<h1>${escapeHtml(ch.title)}</h1>
${ch.image_url ? `<div class="chapter-image"><img src="${ch.image_url}" alt=""/></div>` : ""}
${ch.opening_hook ? `<p class="hook">${escapeHtml(ch.opening_hook)}</p>` : ""}
${paras}
${ch.closing_reflection ? `<p class="reflection">${escapeHtml(ch.closing_reflection)}</p>` : ""}
</body></html>`;
}
