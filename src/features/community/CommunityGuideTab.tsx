import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MembershipTier } from "@/features/membership/tier";

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-4"
      >
        <div className="text-left">
          <div className="text-white font-semibold">{title}</div>
        </div>
        {open ? (
          <ChevronUp className="text-white/70" />
        ) : (
          <ChevronDown className="text-white/70" />
        )}
      </button>
      {open ? <div className="px-4 pb-4 text-sm text-white/70">{children}</div> : null}
    </div>
  );
}

export function CommunityGuideTab({
  tier,
}: {
  tier: MembershipTier;
}) {
  const navigate = useNavigate();

  const isPaid = useMemo(() => tier !== "free", [tier]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pt-2">
        <div className="text-2xl font-bold text-white">Siddha Quantum Nexus Guide</div>
        <div className="mt-1 text-sm text-white/60">
          A calm overview — so you always know what to do next.
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/vedic-astrology")}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition"
        >
          <div className="text-white font-semibold">Vedic Astrology</div>
          <div className="mt-1 text-sm text-white/60">
            Your daily influence + deeper blueprint.
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              className="rounded-full px-4 py-2 text-sm font-semibold"
            >
              Open Vedic Astrology
            </Button>
          </div>
        </button>

        <button
          onClick={() => navigate("/ayurveda")}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition"
        >
          <div className="text-white font-semibold">Ayurveda</div>
          <div className="mt-1 text-sm text-white/60">
            Discover your prakriti and daily balance.
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              className="rounded-full px-4 py-2 text-sm font-semibold"
            >
              Open Ayurveda
            </Button>
          </div>
        </button>
      </div>

      {/* Collapsible guide sections */}
      <div className="mt-6 grid gap-3">
        <Section title="How it works" defaultOpen>
          <div className="grid gap-2">
            <div><span className="text-white font-semibold">1) Arrive</span> — choose how you feel right now.</div>
            <div><span className="text-white font-semibold">2) Practice</span> — use breath + tools to shift state.</div>
            <div><span className="text-white font-semibold">3) Integrate</span> — return daily; watch patterns change.</div>
          </div>
        </Section>

        <Section title="Membership">
          {isPaid ? (
            <div>
              <div className="text-white font-semibold">Your membership is active.</div>
              <div className="mt-1 text-white/70">Everything included for you is already unlocked.</div>
            </div>
          ) : (
            <div>
              <div className="text-white font-semibold">Free access</div>
              <div className="mt-1 text-white/70">
                You can explore the space. Membership unlocks deeper tools and longer guidance.
              </div>
              <Button
                onClick={() => navigate("/membership")}
                className="mt-4 rounded-full px-5 py-3 text-sm font-semibold"
              >
                View membership
              </Button>
            </div>
          )}
        </Section>

        <Section title="Coins & sharing">
          <div className="grid gap-2">
            <div><span className="text-white font-semibold">Coins</span> — earned through practice and consistency.</div>
            <div><span className="text-white font-semibold">Sharing</span> — invite others, earn rewards (when enabled).</div>
          </div>
        </Section>

        <Section title="Optional journeys">
          <button
            onClick={() => navigate("/transformation")}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition"
          >
            <div className="text-white font-semibold">6-Month Program</div>
            <div className="mt-1 text-sm text-white/60">
              A deeper transformation path with guidance.
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                className="rounded-full px-4 py-2 text-sm font-semibold"
              >
                View program
              </Button>
            </div>
          </button>
        </Section>
      </div>
    </div>
  );
}

