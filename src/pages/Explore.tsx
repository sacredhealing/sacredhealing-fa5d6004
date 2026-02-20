import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { LibrarySection, type LibraryItem } from "@/components/explore/LibrarySection";
import { CollapsibleSection } from "@/features/library/CollapsibleSection";
import { QuickActionFallback } from "@/features/library/QuickActionFallback";
import { useQuickActionItems } from "@/features/library/useQuickActionItems";
import { resolveQuickActionItem } from "@/features/library/quickActionResolver";
import { usePresenceState } from "@/features/presence/usePresenceState";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useMeditationContentLanguage } from "@/features/meditations/useContentLanguage";
import { useMembership } from "@/hooks/useMembership";
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
} from "lucide-react";

function getSubtitleKey(phase: "morning" | "midday" | "evening"): string {
  switch (phase) {
    case "morning": return "explore.subtitleMorning";
    case "midday": return "explore.subtitleMidday";
    case "evening": return "explore.subtitleEvening";
    default: return "explore.subtitleMidday";
  }
}

// Visual card configs for Start section — warm, sacred gradients
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

// Visual card configs for Deepen section — warm amber/gold tones
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
  {
    key: "pregnancy",
    href: "/pregnancy-program",
    icon: Baby,
    gradient: "from-pink-900/60 via-pink-800/40 to-black/60",
    border: "border-pink-500/30",
    glow: "shadow-pink-500/20",
    iconColor: "text-pink-300",
    iconBg: "bg-pink-500/20",
  },
];

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dayPhase = getDayPhase();

  const connectItems: LibraryItem[] = useMemo(() => [
    { key: "community", title: t("explore.community", "Community"), subtitle: t("explore.communityDesc", "Chat with guides & members"), href: "/community", icon: <Users className="h-5 w-5" /> },
    { key: "stargate", title: t("home.stargateMembership", "Stargate Membership"), subtitle: t("home.stargateDesc", "Weekly live sessions, Telegram community"), href: "/stargate", icon: <Crown className="h-5 w-5" />, badge: t("explore.badgeSwedish", "Swedish") },
  ], [t]);

  const exploreItems: LibraryItem[] = useMemo(() => [
    { key: "promptLibrary", title: t("explore.promptLibrary", "Prompt Library"), subtitle: t("explore.promptLibraryDesc", "Single-click templates for instant productivity"), href: "/prompt-library", icon: <FileText className="h-5 w-5" /> },
    { key: "podcast", title: t("explore.podcast", "Podcast"), subtitle: t("explore.podcastDesc", "Streams on Spotify"), href: "/podcast", icon: <Headphones className="h-5 w-5" /> },
    { key: "videos", title: t("explore.videos", "Videos"), subtitle: t("explore.videosDesc", "Watch & learn"), href: "/spiritual-education", icon: <Youtube className="h-5 w-5" /> },
    { key: "creativeSoul", title: t("explore.creativeSoul", "Creative Soul"), subtitle: t("explore.creativeSoulDesc", "Create with AI"), href: "/creative-soul/store", icon: <Sparkles className="h-5 w-5" /> },
    { key: "shop", title: t("explore.shop", "Shop"), subtitle: t("explore.shopDesc", "Laila's Collection"), href: "/shop", icon: <ShoppingBag className="h-5 w-5" /> },
    { key: "leaderboard", title: t("explore.leaderboard", "Leaderboard"), subtitle: t("explore.leaderboardDesc", "Top earners win monthly"), href: "/leaderboard", icon: <Trophy className="h-5 w-5" />, badge: "5,000 SHC" },
    { key: "abundance", title: t("explore.abundance", "Abundance"), subtitle: t("explore.abundanceDescInner", "Inner abundance & life support"), href: "/library/abundance", icon: <Zap className="h-5 w-5" /> },
  ], [t]);

  const { playUniversalAudio } = useMusicPlayer();
  const { allAudioItems } = useQuickActionItems();
  const { language: meditationLanguage } = useMeditationContentLanguage();
  useMembership(); // presence / membership state if needed later
  const [showFallback, setShowFallback] = useState(false);
  const presence = usePresenceState();

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

  // i18n labels for cards
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
    pregnancy: { title: t("pregnancy.title", "Sacred Pregnancy"), subtitle: t("pregnancy.subtitle", "Support on your journey") },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e]/30 to-[#1a0a2e] px-4 pb-24 pt-4">
      {/* Hero Banner — Healing Sounds */}
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

      {/* Community Circle card */}
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

      {/* Header */}
      <div className="mb-3">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-amber-50">
          {t("explore.title", "Library")}
        </h1>
        <p className="text-amber-200/70 mt-1 text-base">{subtitle}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button onClick={() => navigate("/meditations")} className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Sparkles className="h-5 w-5 text-primary" /></span>
            <div className="flex-1"><div className="font-semibold text-foreground">{firstActionTitle}</div><div className="text-sm text-muted-foreground">{firstActionSubtitle}</div></div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button onClick={() => navigate("/healing")} className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Heart className="h-5 w-5 text-primary" /></span>
            <div className="flex-1"><div className="font-semibold text-foreground">{t("explore.intent.heal", "Soften the heart")}</div><div className="text-sm text-muted-foreground">{t("explore.intent.healDesc", "Gentle support when it feels heavy")}</div></div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button onClick={() => onQuick("pause")} className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Zap className="h-5 w-5 text-primary" /></span>
            <div className="flex-1"><div className="font-semibold text-foreground">{t("explore.intent.pause", "Take a small pause")}</div><div className="text-sm text-muted-foreground">{t("explore.intent.pauseDesc", "One-minute breath reset")}</div></div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button onClick={() => navigate("/meditations")} className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Moon className="h-5 w-5 text-primary" /></span>
            <div className="flex-1"><div className="font-semibold text-foreground">{t("explore.intent.sleep", "Sleep deeply")}</div><div className="text-sm text-muted-foreground">{t("explore.intent.sleepDesc", "Unwind into rest")}</div></div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
      </div>

      {showFallback && (
        <QuickActionFallback
          title={t("explore.fallback.title", "New sessions are arriving")}
          body={t("explore.fallback.body", "Your library is still being filled.")}
          buttonLabel={t("explore.fallback.button", "Browse meditations")}
          onClick={() => navigate("/meditations")}
        />
      )}

      {/* Your Space */}
      <section className="mt-8">
        <h2 className="text-xl md:text-2xl font-bold text-amber-100 mb-4 tracking-wide">Your Space</h2>
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-black">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 opacity-60" />
          <button onClick={() => navigate("/membership")} className="relative z-10 w-full p-6 text-left hover:bg-white/5 transition">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/30"><Sparkles size={24} className="text-purple-300" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Your Space</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">Active</span>
                  </div>
                  <p className="text-sm text-white/70 mt-1">Everything included for you — choose where to enter.</p>
                </div>
              </div>
              <div className="p-2 rounded-full bg-purple-500/20 border border-purple-400/30"><ChevronRight size={20} className="text-purple-200" /></div>
            </div>
          </button>
          <div className="relative z-10 px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Vedic Astrology", desc: "Daily influence + blueprint", href: "/vedic-astrology" },
                { label: "Ayurveda", desc: "Balance + daily guidance", href: "/ayurveda" },
                { label: "Vastu", desc: "Abundance Architect", href: "/vastu" },
                { label: "Hand Analyzer", desc: "Sovereign palm reading", href: "/hand-analyzer", Icon: Hand },
              ].map((item) => {
                const Icon = "Icon" in item ? item.Icon : null;
                return (
                  <button key={item.href} onClick={() => navigate(item.href)} className="rounded-2xl px-4 py-4 text-left bg-gradient-to-r from-purple-600/30 to-purple-500/20 border border-purple-400/40 hover:from-purple-600/50 hover:to-purple-500/40 transition flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-amber-300 shrink-0" />}
                    <div>
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="mt-1 text-xs text-purple-100/80">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => navigate("/library")} className="text-sm text-purple-200 hover:text-white transition underline underline-offset-4">Open Library</button>
              <button onClick={() => navigate("/membership")} className="text-sm text-purple-200 hover:text-white transition underline underline-offset-4">Manage</button>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Everything — upgraded visual sections */}
      <CollapsibleSection
        title={t("explore.exploreEverything", "Explore everything")}
        subtitle={t("explore.exploreEverythingSubtitle", "Open when you feel ready.")}
        defaultOpen={false}
      >
        {/* START — 2x2 glowing grid */}
        <div className="mb-6">
          <h3 className="text-lg md:text-xl font-bold text-amber-100 mb-3">
            {t("explore.sectionStart", "Start")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {START_CARDS.map((card) => {
              const Icon = card.icon;
              const label = startLabels[card.key];
              return (
                <button
                  key={card.key}
                  onClick={() => navigate(card.href)}
                  className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4 text-left shadow-lg ${card.glow} hover:scale-[1.02] transition-transform duration-200`}
                >
                  <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <div className="text-sm font-semibold text-white">{label.title}</div>
                  <div className="text-xs text-white/60 mt-0.5">{label.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DEEPEN — warm horizontal scroll cards */}
        <div className="mb-6">
          <h3 className="text-lg md:text-xl font-bold text-amber-100 mb-3">
            {t("explore.sectionDeepen", "Deepen")}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {DEEPEN_CARDS.map((card) => {
              const Icon = card.icon;
              const label = deepenLabels[card.key];
              return (
                <button
                  key={card.key}
                  onClick={() => navigate(card.href)}
                  className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-r ${card.gradient} px-4 py-4 text-left shadow-md hover:scale-[1.01] transition-transform duration-200`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{label.title}</div>
                      <div className="text-xs text-white/60 mt-0.5">{label.subtitle}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONNECT — keep original style */}
        <LibrarySection
          title={t("explore.sectionConnect", "Connect")}
          subtitle={t("explore.sectionConnectSubtitle", "A place to practice with others")}
          items={connectItems}
          initialVisible={4}
        />

        {/* EXPLORE — keep original style */}
        <LibrarySection
          title={t("explore.sectionExplore", "Explore")}
          items={exploreItems}
          initialVisible={4}
        />
      </CollapsibleSection>

      <div className="mt-8">
        <ParamahamsaVishwanandaDailyCard />
      </div>

      {/* Invite Friends - compact at bottom */}
      <div className="rounded-xl glass-card p-3 mt-4 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-heading font-bold text-amber-50">{t("dashboard.inviteFriends")}</h4>
            <p className="text-xs text-muted-foreground truncate">{t("dashboard.inviteDescription")}</p>
          </div>
          <Link to="/invite-friends" className="shrink-0">
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs">
              <Users className="w-3.5 h-3.5" />
              Invite
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
