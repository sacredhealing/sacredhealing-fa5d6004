import React from "react";
import { getDailyVedicInfluence, getPremiumDailyGuidance, getMasterDeepReading, type BirthDetails } from '@/lib/vedicCalculations';

/**
 * VedicInfluenceSection
 * - Responsive layout
 * - Consistent card UI
 * - Prevents narrow "tube" rendering + overflow
 *
 * Tailwind required.
 */

type VedicData = {
  dateLabel: string; // e.g. "Wednesday, January 28"
  nakshatra: { name: string; theme?: string };
  planetaryInfluence?: string;
  quote?: { text: string; source?: string };
  whatToDo?: string[];
  whatToAvoid?: string[];
  relationshipHarmony?: string;
  healthRecommendations?: string;
  soulPurposeAnalysis?: { title?: string; body: string; name?: string };
};

interface VedicInfluenceSectionProps {
  data?: VedicData;
  birthDetails?: BirthDetails;
  tier?: 'basic' | 'premium' | 'master';
}

const Card = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <section
      className={[
        "w-full rounded-2xl border border-white/10 bg-white/5",
        "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        "backdrop-blur-md",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2 px-5 pt-5">
        {icon ? <div className="text-lg opacity-90">{icon}</div> : null}
        <h3 className="text-base font-semibold text-white/90">{title}</h3>
      </div>
      <div className="px-5 pb-5 pt-3">{children}</div>
    </section>
  );
};

const Pill = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/80">
    {children}
  </div>
);

const BulletList = ({ items }: { items?: string[] }) => {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-sm leading-6 text-white/75">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
          <span className="min-w-0 break-words">{t}</span>
        </li>
      ))}
    </ul>
  );
};

export default function VedicInfluenceSection({
  data,
  birthDetails,
  tier = 'basic',
}: VedicInfluenceSectionProps) {
  // If data is provided, use it directly
  if (data) {
    return <VedicInfluenceSectionContent data={data} />;
  }

  // Otherwise, generate from birthDetails and tier
  const dailyInfluence = getDailyVedicInfluence(birthDetails, tier);
  const premiumGuidance = (tier === 'premium' || tier === 'master')
    ? getPremiumDailyGuidance(birthDetails)
    : null;
  const masterReading = tier === 'master'
    ? getMasterDeepReading(birthDetails)
    : null;

  const transformedData: VedicData = {
    dateLabel: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    nakshatra: {
      name: dailyInfluence.nakshatra,
      theme: dailyInfluence.theme,
    },
    planetaryInfluence: dailyInfluence.planetaryInfluence,
    quote: {
      text: dailyInfluence.wisdomQuote,
      source: dailyInfluence.teacher,
    },
    whatToDo: dailyInfluence.do,
    whatToAvoid: dailyInfluence.avoid,
    relationshipHarmony: premiumGuidance?.relationships,
    healthRecommendations: premiumGuidance?.health,
    soulPurposeAnalysis: masterReading ? {
      title: "Soul Purpose Analysis",
      name: birthDetails?.birth_name || undefined,
      body: masterReading.soulPurpose,
    } : undefined,
  };

  return <VedicInfluenceSectionContent data={transformedData} />;
}

function VedicInfluenceSectionContent({ data }: { data: VedicData }) {
  // Fallback demo data so the layout is always stable
  const d: VedicData = data ?? {
    dateLabel: "Wednesday, January 28",
    nakshatra: { name: "Bharani", theme: "Transformation & Release" },
    planetaryInfluence:
      "Mercury is prominent today, influencing your transformation & release. The planetary energies support releasing old patterns. Based on your birth chart, this is an auspicious time for transformation & release.",
    quote: {
      text: "Mercury governs learning and communication. Use this power to teach, not to deceive.",
      source: "Classical Jyotish",
    },
    whatToDo: [
      "Release old patterns",
      "Practice forgiveness",
      "Transform negative energy",
      "Focus on renewal",
    ],
    whatToAvoid: ["Holding grudges", "Resisting change", "Being overly critical"],
    relationshipHarmony:
      "In relationships, focus on forgiveness. The planetary alignment encourages open communication and deep connection. Avoid holding grudges.",
    healthRecommendations:
      "For health, release old patterns. Follow Ayurvedic principles aligned with today's planetary influence. Practice grounding activities and mindful routines.",
    soulPurposeAnalysis: {
      title: "Soul Purpose Analysis",
      name: "Adam Gil Lazaro",
      body:
        "Your birth chart reveals a dharmic path centered on service, wisdom, and spiritual evolution. This is a season for shedding what no longer serves and stepping into clearer communication and aligned action.",
    },
  };

  return (
    <div className="w-full">
      {/* Outer container: fixes the skinny "tube" look */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-5 mt-2 flex flex-col gap-3 sm:mb-7 sm:mt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Today's Vedic Influence
              </h2>
              <p className="mt-1 text-sm text-white/65">
                A quick, readable daily snapshot—no clutter.
              </p>
            </div>
            <Pill>{d.dateLabel}</Pill>
          </div>

          {/* Nakshatra highlight */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-white/80">
                Current Nakshatra:
              </span>
              <span className="text-sm font-semibold text-white">{d.nakshatra.name}</span>
              {d.nakshatra.theme ? (
                <span className="text-sm text-white/60">• {d.nakshatra.theme}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Main grid: 1 col mobile, 2 col desktop */}
        <div className="grid grid-cols-1 gap-4 pb-8 sm:gap-5 lg:grid-cols-2">
          <Card title="Planetary Influence" icon="🪐">
            <p className="text-sm leading-6 text-white/75">
              {d.planetaryInfluence ?? "—"}
            </p>

            {d.quote?.text ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm italic leading-6 text-white/80">
                  "{d.quote.text}"
                </p>
                {d.quote.source ? (
                  <p className="mt-2 text-xs text-white/50">— {d.quote.source}</p>
                ) : null}
              </div>
            ) : null}
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            <Card
              title="What to Do"
              icon="✅"
              className="bg-emerald-500/5"
            >
              <BulletList items={d.whatToDo} />
            </Card>

            <Card
              title="What to Avoid"
              icon="⛔"
              className="bg-rose-500/5"
            >
              <BulletList items={d.whatToAvoid} />
            </Card>
          </div>

          <Card title="Relationship Harmony" icon="💞" className="lg:col-span-1">
            <p className="text-sm leading-6 text-white/75">
              {d.relationshipHarmony ?? "—"}
            </p>
          </Card>

          <Card title="Health Recommendations" icon="🌿" className="lg:col-span-1">
            <p className="text-sm leading-6 text-white/75">
              {d.healthRecommendations ?? "—"}
            </p>
          </Card>

          <Card title={d.soulPurposeAnalysis?.title ?? "Soul Purpose"} icon="🔮" className="lg:col-span-2">
            {d.soulPurposeAnalysis?.name ? (
              <p className="mb-2 text-sm font-medium text-white/80">
                {d.soulPurposeAnalysis.name}
              </p>
            ) : null}
            <p className="text-sm leading-6 text-white/75">
              {d.soulPurposeAnalysis?.body ?? "—"}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
