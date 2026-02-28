import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { GitaCard } from "@/components/dashboard/GitaCard";
import AkashicSiddhaReading from "@/components/vedic/AkashicSiddhaReading";
import { CollapsibleSection } from "@/features/library/CollapsibleSection";
import { QuickActionFallback } from "@/features/library/QuickActionFallback";
import { useQuickActionItems } from "@/features/library/useQuickActionItems";
import { resolveQuickActionItem } from "@/features/library/quickActionResolver";
import { usePresenceState } from "@/features/presence/usePresenceState";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useMeditationContentLanguage } from "@/features/meditations/useContentLanguage";
import { useMembership } from "@/hooks/useMembership";
import { useAuth } from "@/hooks/useAuth";
import { useAkashicAccess } from "@/hooks/useAkashicAccess";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getDayPhase } from "@/utils/postSessionContext";

import {
  Heart,
  Moon,
  Zap,
  Sparkles,
  Music2,
  ShoppingBag,
  Users,
  BookOpen,
  Headphones,
  Youtube,
  Crown,
  Star,
  Trophy,
  Mic2,
  ChevronRight,
  FileText,
  Wind,
  Baby,
  Hand,
  Leaf,
  Eye,
} from "lucide-react";
import SacredRevealGate from "@/components/SacredRevealGate";
import {
  GlobalResonanceProvider,
  SanctuaryDashboard,
  SiteEffectOverlay,
} from '@/components/resonance/GlobalResonanceHub';

function getSubtitleKey(phase: "morning" | "midday" | "evening"): string {
  switch (phase) {
    case "morning": return "explore.subtitleMorning";
    case "midday": return "explore.subtitleMidday";
    case "evening": return "explore.subtitleEvening";
    default: return "explore.subtitleMidday";
  }
}

const START_CARDS = [
  {
    key: "meditations",
    href: "/meditations",
    icon: Sparkles,
    gradient: "from-cyan-900/60 via-cyan-800/40 to-black/60",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    iconColor: "text-cyan-300",
    iconBg: "bg-cyan-500/20",
    badge: null,
  },
  {
    key: "breathing",
    href: "/breathing",
    icon: Wind,
    gradient: "from-blue-900/60 via-blue-800/40 to-black/60",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
    iconColor: "text-blue-300",
    iconBg: "bg-blue-500/20",
    badge: null,
  },
  {
    key: "music",
    href: "/music",
    icon: Music2,
    gradient: "from-violet-900/60 via-violet-800/40 to-black/60",
    border: "border-violet-500/30",
    glow: "shadow-violet-500/20",
    iconColor: "text-violet-300",
    iconBg: "bg-violet-500/20",
    badge: null,
  },
  {
    key: "soul",
    href: "/healing",
    icon: Heart,
    gradient: "from-rose-900/60 via-rose-800/40 to-black/60",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/20",
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/20",
    badge: null,
  },
];

const DEEPEN_CARDS = [
  {
    key: "courses",
    href: "/courses",
    icon: BookOpen,
    gradient: "from-amber-900/60 via-amber-800/40 to-black/60",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/20",
  },
  {
    key: "coaching",
    href: "/transformation",
    icon: Heart,
    gradient: "from-orange-900/60 via-orange-800/40 to-black/60",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    iconColor: "text-orange-300",
    iconBg: "bg-orange-500/20",
  },
  {
    key: "privateSessions",
    href: "/private-sessions",
    icon: Users,
    gradient: "from-yellow-900/60 via-yellow-800/40 to-black/60",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-500/20",
    iconColor: "text-yellow-300",
    iconBg: "bg-yellow-500/20",
  },
  {
    key: "affirmationSoundtrack",
    href: "/affirmation-soundtrack",
    icon: Mic2,
    gradient: "from-lime-900/60 via-lime-800/40 to-black/60",
    border: "border-lime-500/30",
    glow: "shadow-lime-500/20",
    iconColor: "text-lime-300",
    iconBg: "bg-lime-500/20",
  },
  {
    key: "certification",
    href: "/certification",
    icon: Star,
    gradient: "from-amber-900/60 via-yellow-800/40 to-black/60",
    border: "border-yellow-400/30",
    glow: "shadow-yellow-400/20",
    iconColor: "text-yellow-200",
    iconBg: "bg-yellow-400/20",
  },
];

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dayPhase = getDayPhase();

  const { playUniversalAudio } = useMusicPlayer();
  const { allAudioItems } = useQuickActionItems();
  const { language: meditationLanguage } = useMeditationContentLanguage();
  const { isPremium } = useMembership();
  const { user } = useAuth();
  const { hasAccess: hasAkashicAccess } = useAkashicAccess(user?.id);
  const { isAdmin } = useAdminRole();
  const [showFallback, setShowFallback] = useState(false);
  const [akashicOpen, setAkashicOpen] = useState(false);
  const [sacredRevealOpen, setSacredRevealOpen] = useState(false);
  const presence = usePresenceState();
  const userHouse = 12;

  const onQuick = (key: "calm" | "heart" | "pause" | "sleep") => {
    if (key === "pause") {
      const item = resolveQuickActionItem(allAudioItems, "pause", meditationLanguage);
      if (item) { setShowFallback(false); playUniversalAudio(item); }
      else navigate("/breathing");
      return;
    }
    const item = resolveQuickActionItem(allAudioItems, key, meditationLanguage);
    if (!item) { setShowFallback(true); return; }
    setShowFallback(false);
    playUniversalAudio(item);
  };

  const subtitleMap: Record<string, string> = {
    start: t(getSubtitleKey(dayPhase), "Begin gently today."),
    returned: t("explore.presence.returned", "Welcome back — stay with the feeling."),
    deep: t("explore.presence.deep", "You're in a quiet space now."),
  };
  const subtitle = subtitleMap[presence] ?? subtitleMap.start;

  const firstActionTitle = presence === "start" ? t("explore.intent.calm", "Calm my mind") : t("explore.presence.continueGently", "Continue gently");
  const firstActionSubtitle = presence === "start" ? t("explore.intent.calmDesc", "A short reset (2–3 min)") : t("explore.presence.stayWithState", "Stay with this state");

  const startLabels: Record<string, { title: string; subtitle: string }> = {
    meditations: { title: t("explore.meditations", "Meditations"), subtitle: t("explore.meditationsDesc", "Find your inner peace") },
    breathing: { title: t("explore.breathing", "Breathing"), subtitle: t("explore.breathingDesc", "Calm & energize") },
    music: { title: t("explore.music", "Music"), subtitle: t("explore.musicDesc", "Sacred frequencies") },
    soul: { title: t("explore.soul", "Soul"), subtitle: t("explore.soulDesc", "Transform & restore") },
  };

  const deepenLabels: Record<string, { title: string; subtitle: string }> = {
    courses: { title: t("explore.courses", "Courses"), subtitle: t("explore.coursesDesc", "Deepen your practice") },
    coaching: { title: t("explore.coaching", "Coaching"), subtitle: t("explore.coachingDesc", "6-Month Program") },
    privateSessions: { title: t("explore.privateSessions", "Private Sessions"), subtitle: t("explore.privateSessionsDesc", "1-on-1 with Adam or Laila") },
    affirmationSoundtrack: { title: t("explore.affirmationSoundtrack", "Affirmation Soundtrack"), subtitle: t("explore.affirmationSoundtrackDesc", "Personalized for you") },
    certification: { title: t("home.practitionerCert", "Practitioner Certification"), subtitle: t("home.certDesc", "Become a certified practitioner") },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e]/30 to-[#1a0a2e] px-4 pb-24 pt-4">
      <div className="mb-3">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-amber-50">
          {t("explore.title", "Library")}
        </h1>
        <p className="text-amber-200/70 mt-1 text-base">{subtitle}</p>
      </div>

      <div className="mb-6">
        <GitaCard />
      </div>

      <section className="mb-6 -mx-4">
        <button
          onClick={() => navigate("/music")}
          className="relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-purple-900/80 via-amber-900/40 to-[#1a0a2e] p-6 text-left shadow-[0_0_40px_rgba(251,191,36,0.15)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-purple-500/10" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40">
              <Music2 className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-amber-100 tracking-tight">
                {t("explore.healingSounds", "Healing Sounds")}
              </h2>
              <p className="mt-1 text-sm text-amber-200/80">
                {t("explore.healingSoundsDesc", "Sacred frequencies for body and soul")}
              </p>
            </div>
            <ChevronRight className="ml-auto h-6 w-6 text-amber-300/80" />
          </div>
        </button>
      </section>

      <section className="mb-6">
        <button
          onClick={() => navigate("/community")}
          className="relative w-full overflow-hidden rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-800/50 via-purple-700/30 to-[#1a0a2e] p-5 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/30 border border-purple-400/40">
              <Users className="h-6 w-6 text-purple-200" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                {t("explore.communityCircle", "Community Circle")}
              </h3>
              <p className="mt-0.5 text-sm text-white/70">
                {t("explore.communityCircleDesc", "Connect with guides and members")}
              </p>
            </div>
            <ChevronRight className="ml-auto h-5 w-5 text-purple-300" />
          </div>
        </button>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button onClick={() => navigate("/meditations")} className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Sparkles className="h-5 w-5 text-primary" /></span>
            <div className="flex-1"><div className="font-semibold text-foreground">{firstActionTitle}</div><div className="text-sm text-muted-foreground">{firstActionSubtitle}</div></div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button onClick={() => navigate("/healing")} className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted
