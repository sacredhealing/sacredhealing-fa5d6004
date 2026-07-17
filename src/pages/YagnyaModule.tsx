import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useYagnaProgress } from '@/hooks/useYagnaProgress';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from '@/lib/tierAccess';
import CourseSyllabus from '@/components/education/CourseSyllabus';

type Tier = "free" | "prana" | "siddha" | "akasha";

const TRANSMITTERS = [
  { name: "Vishwamitra", title: "Brahmarishi · Father of the Gayatri Fire", tier: "siddha" as Tier, icon: "🔱",
    transmission: "I did not merely compose the Gayatri — I became it. Through 12,000 years of Tapas I forced the cosmic fire to speak in human syllables. Every 'OM BHUR BHUVA SVAHA' you chant re-ignites the original Yagna I performed at the edge of creation. The three Vyahritis — Bhur, Bhuva, Svar — are the three ignition chambers of the human subtle body: Muladhara-fire, Anahata-fire, Sahasrara-fire. When you light Yagna, you light ME. I am the flame. I am the mantra. I am the vow.",
    mantra: "OM VISHWAMITRA BRAHMARISHI NAMAHA · GAYATRI SHAKTI PRAKAT HO" },
  { name: "Agastya Muni", title: "Siddha of the South · Compressor of Worlds", tier: "siddha" as Tier, icon: "🌊",
    transmission: "My Yagna compressed the Vindhya mountains into submission — not through force, but through the gravitational coherence of sacred fire. When ghee meets Agni and mantra, the local gravitational field bends. Modern physics calls this a torsion field. I call it Rta — the self-correcting intelligence of the universe expressing through combustion. Use the Agastya Homa to recalibrate collapsed ecosystems, diseased land, and poisoned water. The fire codes I transmit today work on quantum timelines — past wounds heal when the flame is lit with clear Sankalpa.",
    mantra: "OM AGASTYAYA MAHARSHAYE NAMAHA · KOMPRESSOR FIRE ACTIVATE" },
  { name: "Bhoganathar Siddha", title: "18 Tamil Siddhas · Alchemical Fire Master", tier: "siddha" as Tier, icon: "⚗️",
    transmission: "We Tamil Siddhas perfected what the Vedic tradition began. We discovered that specific herbs — Vilvam, Kadamba, Tulsi, Neem, Ashwagandha — when burned in specific sequences create pharmacological compounds that penetrate the blood-brain barrier through olfactory channels. The smoke is medicine. The ash — Vibhuti — is not symbolic. It contains restructured mineral complexes that when applied to marma points open the Nadi channels within 7 minutes.",
    mantra: "OM EIGHTEEN SIDDHAS NAMAHA · NAVA GRAHA AGNI SUDDHI" },
  { name: "Vashishtha", title: "Brahmarishi · Keeper of the Royal Fire Codes", tier: "akasha" as Tier, icon: "👑",
    transmission: "Every kingdom that flourished did so because of Yagna. Not metaphorically — literally. The Rajasuya and Ashwamedha Yagnas I designed create plasma corridors between the ruler's consciousness and the collective field of their nation. Today this translates to: your business, your community, your family line. Perform Yagna with Sankalpa for your lineage and watch seven generations forward and backward receive light. This is the Vashishtha Kula-Suddhi transmission. The fire purifies what the mind cannot reach.",
    mantra: "OM VASHISHTHAYA BRAHMARISHAYE NAMAHA · KULA SUDDHI JVALA" },
  { name: "Lopamudra", title: "Rishi-Shakti · The Feminine Fire That Stabilizes Creation", tier: "akasha" as Tier, icon: "🌸",
    transmission: "The Western tradition forgets that every great Rishi performed Yagna WITH his partner. I am Lopamudra. I sat equal to Agastya in every fire ritual. The Shakti-aspect of Yagna — the space BETWEEN the flames — is where healing occurs. The masculine fire projects; the feminine field receives and amplifies. When couples perform Yagna together, the Nadi systems of both merge at 432Hz creating a unified biofield 40x stronger than either alone.",
    mantra: "OM LOPAMUDRA SHAKTI NAMAHA · DAMPATYA AGNI JVALIT" },
  { name: "Mahavatar Babaji", title: "Immortal Yogi · The Deathless Flame", tier: "akasha" as Tier, icon: "🔥",
    transmission: "I have maintained a continuous inner Yagna for 1,800+ years. My body is sustained by Pranagni — the inner fire — not by food alone. The outer Yagna you perform is a mirror of the inner Yagna happening in every cell of your mitochondria, every moment. ATP synthesis IS combustion. You are always on fire. Yagna simply makes this visible and conscious. When I initiate a soul into Kriya, the first transmission is always fire-based: activating the inner Kundalini as the eternal Yagna-kunda.",
    mantra: "OM MAHAVATAR BABAJI NAMAHA · PRANAGNI JVALA SAHASRARA" },
];

const TIER_ORDER: { slug: string; label: string }[] = [
  { slug: 'free', label: 'Atma-Seed' },
  { slug: 'prana-flow', label: 'Prana-Flow' },
  { slug: 'siddha-quantum', label: 'Siddha-Quantum' },
  { slug: 'akasha-infinity', label: 'Akasha-Infinity' },
];

const AMBER = 'rgba(217,119,6,0.9)';

function TransmitterCard({ t, accentColor }: { t: (typeof TRANSMITTERS)[number]; accentColor: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderRadius: 20, border: `1px solid ${open ? accentColor + '55' : 'rgba(255,255,255,0.06)'}`,
        background: open ? accentColor + '0d' : 'rgba(255,255,255,0.012)',
        padding: '18px 20px', marginBottom: 10, cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>{t.icon}</span>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700, color: open ? accentColor : 'rgba(255,255,255,0.85)' }}>{t.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.title}</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'rgba(255,250,240,0.82)', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>{t.transmission}</p>
          <p style={{ fontSize: 11, color: accentColor, letterSpacing: '.06em', marginTop: 10 }}>{t.mantra}</p>
        </div>
      )}
    </div>
  );
}

export default function YagnyaModule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingData, error: loadError } = useYagnaProgress(membershipReady);

  const userRank = isAdmin ? 3 : getCourseTierRequiredRank(
    tier === 'akasha-infinity' ? 'akasha-infinity' : tier === 'siddha-quantum' ? 'siddha-quantum' : tier === 'prana-flow' ? 'prana-flow' : 'free'
  );

  const syllabusGroups = useMemo(() => {
    return TIER_ORDER.map((t) => {
      const mods = courses.filter((c) => (c.tier_required || 'free') === t.slug);
      const completed = mods.filter((c) => progressByModuleId[c.id]?.completed).length;
      return {
        id: `tier-${t.slug}`,
        title: t.label,
        meta: `${completed} / ${mods.length} modules${completed === mods.length && mods.length > 0 ? ' complete' : ''}`,
        done: mods.length > 0 && completed === mods.length,
        current: false,
        lessons: mods.map((m) => {
          const done = Boolean(progressByModuleId[m.id]?.completed);
          const allowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(m.tier_required));
          const state: 'done' | 'current' | 'available' | 'locked' = done ? 'done' : allowed ? 'available' : 'locked';
          return { id: m.id, number: m.module_number, title: m.title, state };
        }),
      };
    });
  }, [courses, progressByModuleId, isAdmin, tier]);

  if (!membershipReady || loadingData) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(217,119,6,.2)', borderTopColor: '#D97706', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'rgba(255,255,255,0.9)', paddingBottom: 104 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 0' }}>
        <button
          type="button"
          onClick={() => navigate('/siddha-portal')}
          style={{
            marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 999, padding: '8px 16px', color: 'rgba(255,255,255,.55)',
            fontSize: 10, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} color={AMBER} /> Back
        </button>

        {!user && (
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              style={{
                borderRadius: 999, padding: '14px 40px', background: 'linear-gradient(135deg,#D97706,#B45309)',
                border: 'none', color: '#050505', fontSize: 11, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: '0 0 40px rgba(217,119,6,0.22)',
              }}
            >
              Begin Initiation
            </button>
          </div>
        )}

        {loadError && (
          <div style={{
            marginBottom: 24, borderRadius: 16, border: '1px solid rgba(248,113,113,0.3)',
            background: 'rgba(248,113,113,0.08)', padding: '14px 18px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F87171', margin: '0 0 4px' }}>Could not load this academy.</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', margin: 0 }}>{loadError}</p>
          </div>
        )}

        <CourseSyllabus
          accent={AMBER}
          courseIcon={<Flame size={24} />}
          courseTitle="Yagna Fire Academy"
          academyName="Yagna Fire Academy"
          progressLabel={`${stats.completedModules} / ${courses.length || 9} · ${stats.completionPercent}%`}
          progressPercent={stats.completionPercent}
          groups={syllabusGroups}
          onLessonClick={(lessonId, locked) => {
            if (locked) {
              const c = courses.find((m) => m.id === lessonId);
              navigate(getSalesPageForRank(getCourseTierRequiredRank(c?.tier_required)));
            } else {
              navigate(`/yagna/module/${lessonId}`);
            }
          }}
        />

        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: AMBER, marginBottom: 14 }}>
            Rishi Transmitters
          </p>
          {TRANSMITTERS.map((t, i) => {
            const req = t.tier === 'akasha' ? 3 : t.tier === 'siddha' ? 2 : t.tier === 'prana' ? 1 : 0;
            const locked = userRank < req;
            const accentColor = t.tier === 'akasha' ? '#b76cfd' : '#22D3EE';
            return locked ? (
              <div
                key={i}
                onClick={() => navigate(getSalesPageForRank(req))}
                style={{
                  borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)',
                  padding: '18px 20px', marginBottom: 10, cursor: 'pointer', opacity: 0.55,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Unlock at {t.tier === 'akasha' ? 'Akasha-Infinity' : 'Siddha-Quantum'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <TransmitterCard key={i} t={t} accentColor={accentColor} />
            );
          })}
        </div>

        <footer style={{ marginTop: 40, paddingBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
            Agnihotra · Havan · The Rishi Transmission
          </p>
        </footer>
      </div>
    </div>
  );
}
