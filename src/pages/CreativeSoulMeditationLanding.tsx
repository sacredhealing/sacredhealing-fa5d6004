import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const plans = [
  {
    badge: "Main Offer",
    title: "Lifetime License",
    price: "€149",
    subtitle: "Unlimited professional meditation creation",
    accent: "from-indigo-100 via-purple-100 to-emerald-100",
    cta: "Get Lifetime Access",
    features: [
      "Meditations: Unlimited",
      "Length per meditation: up to 90 minutes",
      "Input sources: YouTube URLs, Any URL, Audio uploads",
      "Stem separation: Unlimited",
      "Noise removal: High quality",
      "BPM & key analysis: Included",
      "Frequency options: All 15 frequencies",
      "Binaural beats: Included",
      "Music matching: Real music + ambience",
      "Variants per meditation: up to 5",
      "Downloads: Final mix, Instrumental, Stems (vocals/music/instruments)",
      "Commercial use: Allowed",
      "Storage retention: 12 months (can regenerate anytime)",
    ],
    highlight: true,
  },
  {
    badge: "Best Value Monthly",
    title: "Monthly Creator Subscription",
    price: "€14.99 / month",
    subtitle: "Create meditations regularly without committing",
    accent: "from-sky-100 via-indigo-50 to-purple-100",
    cta: "Start Monthly",
    features: [
      "Meditations: 10 per month (no rollover)",
      "Length per meditation: up to 45 minutes",
      "Input sources: YouTube URLs, Audio uploads",
      "Stem separation: Included",
      "Noise removal: Medium–high quality",
      "BPM & key analysis: Included",
      "Frequency options: All 15 frequencies",
      "Variants per meditation: up to 3",
      "Downloads: Final mix, Instrumental",
      "Stems: Not included (optional add-on)",
      "Commercial use: Allowed",
      "Storage retention: 30 days",
    ],
    highlight: false,
  },
  {
    badge: "Impulse Buy",
    title: "One Meditation",
    price: "€9.99",
    subtitle: "Create one powerful meditation, no commitment",
    accent: "from-amber-100 via-rose-50 to-purple-50",
    cta: "Buy One Meditation",
    features: [
      "Meditations: 1",
      "Length: up to 30 minutes",
      "Input sources: Audio upload, YouTube URL",
      "Stem separation: Not included (voice-only cleanup)",
      "Noise removal: Included",
      "BPM analysis: Not included (auto default BPM)",
      "Frequency options: 5 core frequencies (432, 528, 396, 6 Hz, 8 Hz)",
      "Variants: 1",
      "Downloads: Final mixed meditation",
      "Instrumentals: Not included",
      "Stems: Not included",
      "Commercial use: Personal use only",
      "Storage retention: 7 days",
    ],
    highlight: false,
  },
];

const addons = [
  {
    title: "Stem Download Unlock",
    price: "€4.99 per meditation",
    desc: "Unlocks vocal + music stems for deeper remixing and rebuilding around the voice.",
  },
  {
    title: "Extended Length Pack",
    price: "€6.99",
    desc: "Extends one meditation to 90 minutes (ideal for sleep and long sessions).",
  },
  {
    title: "Credit Packs",
    price: "From €39",
    desc: "5 meditations → €39 • 10 meditations → €69",
  },
];

export default function CreativeSoulMeditationLanding() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Get affiliate ref from URL
  const ref = searchParams.get("ref");

  // Store affiliate attribution on mount (if logged in)
  useEffect(() => {
    const storeAffiliate = async () => {
      if (user && ref) {
        await supabase.from("affiliate_attribution").upsert(
          { user_id: user.id, ref_code: ref, last_seen_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        await supabase.from("affiliate_events").insert({
          ref_code: ref,
          user_id: user.id,
          tool_slug: "creative-soul",
          event_type: "visit",
        });
      }
    };
    storeAffiliate();
  }, [user, ref]);

  const startCheckout = async (plan: "lifetime" | "monthly" | "single") => {
    // Check if user is logged in
    if (!user || !session) {
      toast.info("Please sign in to purchase");
      navigate("/auth");
      return;
    }

    setLoadingPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke("creative-soul-create-checkout", {
        body: { plan, ref: ref ?? null },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error?.message || "Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-emerald-50 text-slate-800">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/70 via-purple-100/70 to-emerald-100/70" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-100 cursor-fancy">
              Creative Soul Meditation
            </p>

            <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
              Create calm, healing meditations with real music, frequency matching, and stem control.
            </h1>

            <p className="mt-5 text-lg md:text-xl text-slate-700 leading-relaxed">
              Upload audio or paste a YouTube link. Clean the voice, choose a healing frequency, match the right meditation style,
              and export a professional mix — with optional stems for advanced creation.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/creative-soul-meditation-tool?mode=demo"
                className="cursor-fancy inline-flex justify-center rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-900 shadow-sm hover:bg-amber-200 transition"
              >
                Try One Free Demo
              </a>
              <a
                href="#pricing"
                className="cursor-fancy inline-flex justify-center rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-600 transition"
              >
                See Pricing & Limits
              </a>
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Designed for meditations, affirmations, and healing audio — with compassionate sound palettes and clear export options.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING + LIMITS */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-14">
        <div className="rounded-2xl border border-white/70 bg-white/60 backdrop-blur p-8 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Pricing & exact limits (simple and transparent)
          </h2>
          <p className="mt-2 text-slate-700 leading-relaxed max-w-2xl">
            Start with one free demo. Choose a plan that matches your creation rhythm — from a single meditation to unlimited
            professional production.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.title}
                className={[
                  "rounded-2xl border p-6 shadow-sm bg-white/70",
                  p.highlight ? "border-indigo-200 ring-2 ring-indigo-200" : "border-white/80",
                ].join(" ")}
              >
                <div className={`rounded-xl p-4 bg-gradient-to-r ${p.accent} border border-white/60`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-indigo-700 bg-white/70 border border-indigo-100 rounded-full px-3 py-1">
                      {p.badge}
                    </span>
                    {p.highlight && (
                      <span className="text-xs font-semibold text-slate-700 bg-white/70 border border-white/80 rounded-full px-3 py-1">
                        No-compromise
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-xl font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{p.price}</p>
                  <p className="mt-2 text-slate-700 leading-relaxed">{p.subtitle}</p>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-slate-700 leading-relaxed">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-[2px] text-emerald-600">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (p.title === "Lifetime License") startCheckout("lifetime");
                      else if (p.title === "Monthly Creator Subscription") startCheckout("monthly");
                      else startCheckout("single");
                    }}
                    disabled={loadingPlan !== null}
                    className={[
                      "cursor-fancy inline-flex w-full justify-center rounded-xl px-5 py-3 font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed",
                      loadingPlan === (p.title === "Lifetime License" ? "lifetime" : p.title === "Monthly Creator Subscription" ? "monthly" : "single")
                        ? "bg-slate-400 text-white"
                        : p.highlight
                        ? "bg-indigo-700 text-white hover:bg-indigo-600"
                        : "bg-slate-900 text-white hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {loadingPlan === (p.title === "Lifetime License" ? "lifetime" : p.title === "Monthly Creator Subscription" ? "monthly" : "single")
                      ? "Loading..."
                      : p.cta}
                  </button>
                  <p className="mt-2 text-xs text-slate-600 text-center">
                    You can upgrade anytime. Demo available before purchase.
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ADD-ONS */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-slate-900">Optional add-ons</h3>
            <p className="mt-2 text-slate-700 leading-relaxed max-w-2xl">
              Add-ons are designed to keep the base plans simple while letting creators unlock extra power when needed.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {addons.map((a) => (
                <div key={a.title} className="rounded-xl bg-white/70 border border-white/80 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-indigo-700">{a.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{a.price}</p>
                  <p className="mt-2 text-slate-700 leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* NOTE: remove rent-to-buy wording */}
          <div className="mt-10 rounded-xl border border-white/70 bg-white/60 p-5">
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Note:</span> The monthly plan is a standard subscription (cancel anytime) —
              not rent-to-buy. Lifetime access is the best option if you plan to create regularly.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-white/70 bg-white/60 backdrop-blur p-8 shadow-sm text-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Start with one free demo
          </h3>
          <p className="mt-2 text-slate-700 leading-relaxed max-w-2xl mx-auto">
            Upload audio or paste a YouTube link. You'll see exactly how the frequency + style matching feels before you pay.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/creative-soul-meditation-tool?mode=demo"
              className="cursor-fancy inline-flex justify-center rounded-xl bg-amber-300 px-6 py-3 font-semibold text-slate-900 shadow-sm hover:bg-amber-200 transition"
            >
              Try One Free Demo
            </a>
            <a
              href="#pricing"
              className="cursor-fancy inline-flex justify-center rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-600 transition"
            >
              Compare Plans
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
