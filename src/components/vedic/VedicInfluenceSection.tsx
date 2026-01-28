import React from "react";
import { getDailyVedicInfluence, getPremiumDailyGuidance, getMasterDeepReading, type BirthDetails } from '@/lib/vedicCalculations';

type VedicData = {
  dateLabel: string;
  nakshatra: { name: string; theme?: string };
  planetaryInfluence?: string;
  quote?: { text: string; source?: string };
  whatToDo?: string[];
  whatToAvoid?: string[];
  relationshipHarmony?: string;
  healthRecommendations?: string;
};

interface VedicInfluenceSectionProps {
  data?: VedicData;
  birthDetails?: BirthDetails;
  tier?: 'basic' | 'premium' | 'master';
  onOpenReading?: () => void;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const Card = ({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md",
      "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
      "p-5",
      className
    )}
  >
    <div className="mb-3 flex items-center gap-2">
      {icon ? <div className="text-lg opacity-90">{icon}</div> : null}
      <h3 className="text-base font-semibold text-white/90">{title}</h3>
    </div>
    {children}
  </section>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/80">
    {children}
  </span>
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

const Clamp = ({ children, lines = 6 }: { children: React.ReactNode; lines?: 3 | 4 | 5 | 6 | 7 | 8 }) => {
  // Tailwind line-clamp requires plugin; this fallback still works nicely without it
  // If you DO have line-clamp plugin, replace with `line-clamp-${lines}`.
  return <div className="max-h-[10.5rem] overflow-hidden">{children}</div>;
};

function VedicInfluenceHorizontal({
  data,
  onOpenReading,
}: {
  data: VedicData;
  onOpenReading?: () => void;
}) {
  return (
    // KEY: these prevent parent containers from squeezing the section
    <div className="w-full min-w-0 max-w-none">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Today's Vedic Influence
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Quick, readable daily guidance—built to stay clean across layouts.
            </p>
          </div>
          <Pill>{data.dateLabel}</Pill>
        </div>

        {/* Nakshatra bar */}
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-white/75">Current Nakshatra:</span>
            <span className="text-sm font-semibold text-white">{data.nakshatra.name}</span>
            {data.nakshatra.theme ? (
              <span className="text-sm text-white/55">• {data.nakshatra.theme}</span>
            ) : null}
          </div>

          {/* Optional CTA button (stable + not chaotic) */}
          {onOpenReading ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onOpenReading}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2",
                  "rounded-full px-5 py-3 text-sm font-semibold",
                  "bg-cyan-400/90 text-black hover:bg-cyan-300",
                  "shadow-[0_10px_25px_rgba(34,211,238,0.25)]",
                  "whitespace-nowrap"
                )}
              >
                ✨ View Basic Vedic Reading
              </button>
            </div>
          ) : null}
        </div>

        {/* MOBILE: horizontal swipe row */}
        <div className="lg:hidden">
          <div className="-mx-4 px-4 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none]">
            <div className="flex gap-4 [&::-webkit-scrollbar]:hidden">
              <div className="min-w-[320px] max-w-[360px] w-[85%] shrink-0">
                <Card title="Planetary Influence" icon="🪐">
                  <Clamp>
                    <p className="text-sm leading-6 text-white/75">{data.planetaryInfluence ?? "—"}</p>
                    {data.quote?.text ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                        <p className="text-sm italic leading-6 text-white/80">"{data.quote.text}"</p>
                        {data.quote.source ? (
                          <p className="mt-2 text-xs text-white/50">— {data.quote.source}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </Clamp>
                </Card>
              </div>

              <div className="min-w-[320px] max-w-[360px] w-[85%] shrink-0">
                <Card title="What to Do" icon="✅" className="bg-emerald-500/5">
                  <BulletList items={data.whatToDo} />
                </Card>
              </div>

              <div className="min-w-[320px] max-w-[360px] w-[85%] shrink-0">
                <Card title="What to Avoid" icon="⛔" className="bg-rose-500/5">
                  <BulletList items={data.whatToAvoid} />
                </Card>
              </div>

              <div className="min-w-[320px] max-w-[360px] w-[85%] shrink-0">
                <Card title="Relationship Harmony" icon="💞">
                  <Clamp>
                    <p className="text-sm leading-6 text-white/75">{data.relationshipHarmony ?? "—"}</p>
                  </Clamp>
                </Card>
              </div>

              <div className="min-w-[320px] max-w-[360px] w-[85%] shrink-0">
                <Card title="Health Recommendations" icon="🌿">
                  <Clamp>
                    <p className="text-sm leading-6 text-white/75">{data.healthRecommendations ?? "—"}</p>
                  </Clamp>
                </Card>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-white/45">Swipe →</p>
        </div>

        {/* DESKTOP: wide grid */}
        <div className="hidden lg:grid grid-cols-12 gap-5 pb-8">
          <div className="col-span-7">
            <Card title="Planetary Influence" icon="🪐">
              <p className="text-sm leading-6 text-white/75">{data.planetaryInfluence ?? "—"}</p>
              {data.quote?.text ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm italic leading-6 text-white/80">"{data.quote.text}"</p>
                  {data.quote.source ? (
                    <p className="mt-2 text-xs text-white/50">— {data.quote.source}</p>
                  ) : null}
                </div>
              ) : null}
            </Card>
          </div>

          <div className="col-span-5 grid gap-5">
            <Card title="What to Do" icon="✅" className="bg-emerald-500/5">
              <BulletList items={data.whatToDo} />
            </Card>
            <Card title="What to Avoid" icon="⛔" className="bg-rose-500/5">
              <BulletList items={data.whatToAvoid} />
            </Card>
          </div>

          <div className="col-span-6">
            <Card title="Relationship Harmony" icon="💞">
              <p className="text-sm leading-6 text-white/75">{data.relationshipHarmony ?? "—"}</p>
            </Card>
          </div>

          <div className="col-span-6">
            <Card title="Health Recommendations" icon="🌿">
              <p className="text-sm leading-6 text-white/75">{data.healthRecommendations ?? "—"}</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VedicInfluenceSection({
  data,
  birthDetails,
  tier = 'basic',
  onOpenReading,
}: VedicInfluenceSectionProps) {
  // If data is provided, use it directly
  if (data) {
    return <VedicInfluenceHorizontal data={data} onOpenReading={onOpenReading} />;
  }

  // Otherwise, generate from birthDetails and tier
  const dailyInfluence = getDailyVedicInfluence(birthDetails, tier);
  const premiumGuidance = (tier === 'premium' || tier === 'master')
    ? getPremiumDailyGuidance(birthDetails)
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
  };

  return <VedicInfluenceHorizontal data={transformedData} onOpenReading={onOpenReading} />;
}
