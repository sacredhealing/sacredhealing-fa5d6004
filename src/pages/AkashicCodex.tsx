// ============================================================
// /akashic-codex — universal knowledge book
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { CodexLayout } from "@/components/codex/CodexLayout";
import { ChapterTree } from "@/components/codex/ChapterTree";
import { ChapterReader } from "@/components/codex/ChapterReader";
import { PasteTransmissionPanel } from "@/components/codex/PasteTransmissionPanel";
import { ExportButton } from "@/components/codex/ExportButton";
import { BookSettings, getBookMeta } from "@/components/codex/BookSettings";
import { PageCount } from "@/components/codex/PageCount";
import { listChapters, runBackfill, runClustering } from "@/lib/codex/api";
import type { CodexChapter } from "@/lib/codex/types";

export default function AkashicCodex() {
  const [chapters, setChapters] = useState<CodexChapter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState(false); // mobile only
  const [bookMeta, setBookMetaState] = useState(() => getBookMeta("akasha"));

  async function refresh() {
    const rows = await listChapters("akasha");
    setChapters(rows);
    if (!activeId && rows.length) setActiveId(rows[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(
    () => chapters.find((c) => c.id === activeId) ?? null,
    [chapters, activeId]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return chapters;
    const q = search.toLowerCase();
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.prose_woven ?? "").toLowerCase().includes(q) ||
        (c.opening_hook ?? "").toLowerCase().includes(q)
    );
  }, [chapters, search]);

  const activeNumber = useMemo(
    () => (active ? numberFor(chapters, active.id) : ""),
    [chapters, active]
  );

  const sidebar = (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
      <PasteTransmissionPanel codexType="akasha" onChanneled={refresh} />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search the Codex…"
        style={searchStyle}
      />

      <PageCount chapters={chapters} />

      <ChapterTree
        chapters={filtered}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setReadingMode(true);
        }}
      />

      <div className="flex flex-col gap-2 mt-2">
        <ExportButton codexType="akasha" meta={bookMeta} />
        <BookSettings codexType="akasha" onSaved={() => setBookMetaState(getBookMeta("akasha"))} />
        <button
          onClick={async () => {
            setBusy("cluster");
            try {
              await runClustering("akasha");
              await refresh();
            } finally {
              setBusy(null);
            }
          }}
          style={smallBtn}
        >
          {busy === "cluster" ? "Clustering…" : "Run Auto-Merge Now"}
        </button>
        <button
          onClick={async () => {
            if (
              !confirm(
                "Backfill all historical Apothecary transmissions into the Codex? This may take several minutes."
              )
            )
              return;
            setBusy("backfill");
            try {
              await runBackfill();
              await refresh();
            } finally {
              setBusy(null);
            }
          }}
          style={smallBtn}
        >
          {busy === "backfill" ? "Backfilling…" : "Backfill From Apothecary"}
        </button>
      </div>
    </aside>
  );

  const reader = active ? (
    <ChapterReader
      chapter={active}
      number={activeNumber}
      onJumpTo={(id) => setActiveId(id)}
      onDeleted={() => { setActiveId(null); refresh(); }}
    />
  ) : (
    <div
      style={{
        padding: 60,
        textAlign: "center",
        color: "rgba(255,255,255,0.4)",
        fontStyle: "italic",
      }}
    >
      {chapters.length
        ? "Select a chapter from the lineage."
        : "No chapters yet. Channel a transmission or run the backfill."}
    </div>
  );

  return (
    <CodexLayout
      codexType="akasha"
      title={bookMeta.title}
      subtitle={bookMeta.subtitle}
    >
      {/* DESKTOP: original two-column layout */}
      <div className="hidden lg:grid gap-6" style={{ gridTemplateColumns: "300px 1fr" }}>
        {sidebar}
        <div>{reader}</div>
      </div>

      {/* MOBILE: toggles between library (sidebar) and full-screen reader */}
      <div className="lg:hidden">
        {!readingMode ? (
          <>
            {sidebar}
            {active && (
              <button
                onClick={() => setReadingMode(true)}
                style={openBookBtn}
              >
                📖 Open Book
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setReadingMode(false)}
              style={backBtn}
            >
              ← Library
            </button>
            {reader}
          </>
        )}
      </div>
    </CodexLayout>
  );
}

const searchStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  borderRadius: 22,
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)",
  fontSize: 12,
  outline: "none",
};

const smallBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(212,175,55,0.18)",
  color: "rgba(255,255,255,0.7)",
  fontWeight: 800,
  fontSize: 9,
  letterSpacing: "0.4em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const openBookBtn: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 50,
  padding: "14px 24px",
  borderRadius: 999,
  background: "#D4AF37",
  color: "#050505",
  border: "none",
  fontWeight: 900,
  fontSize: 10,
  letterSpacing: "0.4em",
  textTransform: "uppercase",
  boxShadow: "0 0 30px rgba(212,175,55,0.5)",
  cursor: "pointer",
};

const backBtn: React.CSSProperties = {
  marginBottom: 16,
  padding: "10px 18px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(212,175,55,0.3)",
  color: "#D4AF37",
  fontWeight: 800,
  fontSize: 9,
  letterSpacing: "0.4em",
  textTransform: "uppercase",
  cursor: "pointer",
};

function numberFor(chapters: CodexChapter[], id: string): string {
  const byParent = new Map<string | null, CodexChapter[]>();
  for (const c of chapters) {
    const k = c.parent_id;
    const arr = byParent.get(k) ?? [];
    arr.push(c);
    byParent.set(k, arr);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.order_index - b.order_index);
  }
  function walk(parent: string | null, prefix: string): string | null {
    const arr = byParent.get(parent) ?? [];
    let i = 1;
    for (const c of arr) {
      const num = prefix ? `${prefix}.${i}` : String(i).padStart(2, "0");
      if (c.id === id) return num;
      const sub = walk(c.id, num);
      if (sub) return sub;
      i++;
    }
    return null;
  }
  return walk(null, "") ?? "";
}
