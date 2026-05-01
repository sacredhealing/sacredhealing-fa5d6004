import { useEffect, useState } from "react";

export interface BookMeta {
  title: string;
  subtitle: string;
  author: string;
}

const KEY = (codexType: string) => `codex.book.${codexType}`;

const DEFAULTS: Record<"akasha" | "portrait", BookMeta> = {
  akasha: {
    title: "The Akashic Codex",
    subtitle: "Channelled from the Akasha-Neural Archive of 2050",
    author: "Kritagya Das",
  },
  portrait: {
    title: "The Living Portrait",
    subtitle: "Sovereign Soul-Record · SQI 2050",
    author: "Kritagya Das",
  },
};

export function getBookMeta(codexType: "akasha" | "portrait"): BookMeta {
  try {
    const raw = localStorage.getItem(KEY(codexType));
    if (raw) return { ...DEFAULTS[codexType], ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS[codexType];
}

export function setBookMeta(codexType: "akasha" | "portrait", meta: BookMeta) {
  localStorage.setItem(KEY(codexType), JSON.stringify(meta));
}

export function BookSettings({
  codexType,
  onSaved,
}: {
  codexType: "akasha" | "portrait";
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<BookMeta>(() => getBookMeta(codexType));
  useEffect(() => {
    setMeta(getBookMeta(codexType));
  }, [codexType]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
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
        }}
      >
        Name the Book
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    marginBottom: 8,
    borderRadius: 18,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 22,
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(212,175,55,0.18)",
      }}
    >
      <input
        value={meta.title}
        onChange={(e) => setMeta({ ...meta, title: e.target.value })}
        placeholder="Book title"
        style={inputStyle}
      />
      <input
        value={meta.subtitle}
        onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })}
        placeholder="Subtitle"
        style={inputStyle}
      />
      <input
        value={meta.author}
        onChange={(e) => setMeta({ ...meta, author: e.target.value })}
        placeholder="Author byline"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            setBookMeta(codexType, meta);
            setOpen(false);
            onSaved?.();
          }}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 999,
            background: "#D4AF37",
            color: "#050505",
            border: "none",
            fontWeight: 900,
            fontSize: 9,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Save
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 800,
            fontSize: 9,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
