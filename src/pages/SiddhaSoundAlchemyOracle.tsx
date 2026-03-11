import { ArrowLeft, Waves, Zap, Sparkles, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const SiddhaSoundAlchemyOracle = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  const handleBack = () => {
    navigate("/creative-soul/store");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col">
        <div className="max-w-4xl mx-auto px-6 py-10 w-full">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#D4AF37] mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Creative Soul Store
          </button>
          <div className="rounded-3xl border border-red-500/30 bg-red-500/5 px-6 py-8">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-red-300 mb-2">
              Admin Only Field
            </p>
            <p className="text-sm text-white/70">
              The Siddha Sound Alchemy Oracle is a protected creation space and can only be opened
              from an Administrator account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#3a1510] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-[#D4AF37] blur-[160px] opacity-40" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-10 lg:py-14">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#D4AF37] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Creative Soul Store
        </button>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-black/60 px-3 py-1 text-[10px] font-bold tracking-[0.26em] uppercase text-[#D4AF37]">
            <Zap className="w-3 h-3" />
            Siddha Quantum · Admin Tool
          </div>
          <h1 className="mt-5 text-3xl md:text-4xl lg:text-5xl font-light tracking-tight italic font-serif">
            Siddha Sound{" "}
            <span className="text-[#D4AF37] drop-shadow-[0_0_18px_rgba(212,175,55,0.65)]">
              Alchemy Oracle
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-white/70 leading-relaxed">
            A futuristic quantum audio analysis console that bridges{" "}
            <span className="text-[#D4AF37] font-semibold">ancient Siddha masters</span> with{" "}
            <span className="text-[#D4AF37] font-semibold">Gemini AI</span>, Supabase and
            FFmpeg-based sound alchemy.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/8 bg-black/60 backdrop-blur-2xl p-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                <Waves className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                  Quantum Audio Engine
                </p>
                <p className="text-sm font-semibold">Core Capabilities</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                <p>
                  <span className="font-semibold text-[#D4AF37]">Multidimensional Spectrography</span>
                  : Gemini scans uploaded audio (via <code className="text-xs">GEMINI_API_KEY</code>)
                  for emotional geometry, chakra resonance and harmonic gaps.
                </p>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                <p>
                  <span className="font-semibold text-[#D4AF37]">Energy Apothecary</span>: curated
                  library of masters (Bogar, Babaji, Saint Germain, Hildegard) with EQ signatures
                  mapped in the <code className="text-xs">ENERGY_APOTHECARY</code> constant.
                </p>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                <p>
                  <span className="font-semibold text-[#D4AF37]">Supabase + FFmpeg pipeline</span>:
                  Express API receives WAV/MP3, synthesizes healing and binaural layers with FFmpeg
                  and stores finished tracks in Supabase storage.
                </p>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                <p>
                  <span className="font-semibold text-[#D4AF37]">GitHub integration</span>: optional
                  <code className="text-xs ml-1">GITHUB_TOKEN</code> +{" "}
                  <code className="text-xs">GITHUB_REPO</code> trigger an &quot;Alchemy-Build&quot;
                  push for generated assets.
                </p>
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-white/8 bg-black/60 backdrop-blur-2xl p-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                  Admin Launch Protocol
                </p>
                <p className="text-sm font-semibold">How this page is wired</p>
              </div>
            </div>
            <ol className="space-y-3 text-sm text-white/80 list-decimal list-inside">
              <li>
                From <span className="font-semibold">Creative Soul Store</span>, only admins see the
                &quot;Open Siddha Sound Alchemy Oracle&quot; button.
              </li>
              <li>
                Clicking the button routes to{" "}
                <code className="text-xs text-[#D4AF37]">/creative-soul/siddha-oracle</code>, which
                is protected again by the admin role.
              </li>
              <li>
                This page documents the full stack you provided (Gemini, Supabase, Express, FFmpeg,
                Vite React) so the backend can be deployed as a separate microservice.
              </li>
              <li>
                Once that microservice is live, this view can be extended to embed the actual upload
                + analysis UI from your Siddha Sound Oracle React app.
              </li>
            </ol>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/75">
              <Info className="mt-0.5 w-4 h-4 text-[#D4AF37]" />
              <p>
                To activate the full engine, configure{" "}
                <code className="text-[10px]">GEMINI_API_KEY</code>,{" "}
                <code className="text-[10px]">SUPABASE_URL</code>,{" "}
                <code className="text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code>,{" "}
                <code className="text-[10px]">GITHUB_TOKEN</code> and{" "}
                <code className="text-[10px]">GITHUB_REPO</code> in your dedicated oracle service,
                then connect it to this admin page.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SiddhaSoundAlchemyOracle;

