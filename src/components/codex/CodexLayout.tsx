// ============================================================
// CodexLayout — Admin-gated shell for Akashic / Living Portrait
// SQI 2050 visual DNA: Akasha-Black, Siddha-Gold, glassmorphism
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "@/lib/codex/api";
import type { CodexType } from "@/lib/codex/types";

interface Props {
  codexType: CodexType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function CodexLayout({ codexType, title, subtitle, children }: Props) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    isAdmin().then((ok) => {
      setAllowed(ok);
      if (!ok) setTimeout(() => navigate("/"), 1800);
    });
  }, [navigate]);

  if (allowed === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#050505" }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.2)",
            boxShadow: "0 0 60px rgba(212,175,55,0.15)",
            animation: "codexPulse 2.4s ease-in-out infinite",
          }}
        />
        <style>{`
          @keyframes codexPulse {
            0%,100% { transform: scale(1); opacity: 0.6; }
            50%     { transform: scale(1.08); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: "#050505", color: "rgba(255,255,255,0.5)" }}
      >
        <div
          style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 800,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            fontSize: 8,
            color: "#D4AF37",
            marginBottom: 14,
          }}
        >
          Sealed Archive
        </div>
        <div style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>
          The Akashic Codex is sealed. Only sovereign administrators carry the key.
        </div>
      </div>
    );
  }

  // Admin-gated content
  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "#050505",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
      }}
    >
      {/* Sacred ambient background */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(900px circle at 20% 10%, rgba(212,175,55,0.06), transparent 55%)," +
            "radial-gradient(700px circle at 85% 90%, rgba(212,175,55,0.04), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(212,175,55,0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <header
        className="relative px-6 pt-10 pb-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div
            style={{
              fontWeight: 800,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              fontSize: 8,
              color: "#D4AF37",
              opacity: 0.85,
            }}
          >
            {codexType === "akasha"
              ? "Akashic-Neural Archive · 2050"
              : "Soul-Record · Sovereign"}
          </div>
          <h1
            style={{
              fontWeight: 900,
              letterSpacing: "-0.05em",
              fontSize: 42,
              lineHeight: 1.05,
              marginTop: 8,
              color: "#D4AF37",
              textShadow: "0 0 20px rgba(212,175,55,0.18)",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              fontStyle: "italic",
              maxWidth: 540,
            }}
          >
            {subtitle}
          </p>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
