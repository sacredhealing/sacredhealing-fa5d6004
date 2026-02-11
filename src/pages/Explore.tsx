import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";

function getSubtitleKey(phase: "morning" | "midday" | "evening"): string {
  switch (phase) {
    case "morning":
      return "explore.subtitleMorning";
    case "midday":
      return "explore.subtitleMidday";
    case "evening":
      return "explore.subtitleEvening";
    default:
      return "explore.subtitleMidday";
  }
}

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dayPhase = getDayPhase();

  const startItems: LibraryItem[] = useMemo(
    () => [
      { key: "meditations", title: t("explore.meditations", "Meditations"), subtitle: t("explore.meditationsDesc", "Find your inner peace"), href: "/meditations", icon: <Sparkles className="h-5 w-5" /> },
      { key: "breathing", title: t("explore.breathing", "Breathing"), subtitle: t("explore.breathingDesc", "Calm & energize"), href: "/breathing", icon: <Sparkles className="h-5 w-5" /> },
      { key: "music", title: t("explore.music", "Music"), subtitle: t("explore.musicDesc", "Sacred frequencies"), href: "/music", icon: <Music2 className="h-5 w-5" /> },
      { key: "soul", title: t("explore.soul", "Soul"), subtitle: t("explore.soulDesc", "Transform & restore"), href: "/healing", icon: <Heart className="h-5 w-5" /> },
    ],
    [t]
  );

  const deepenItems: LibraryItem[] = useMemo(
    () => [
      { key: "courses", title: t("explore.courses", "Courses"), subtitle: t("explore.coursesDesc", "Deepen your practice"), href: "/courses", icon: <BookOpen className="h-5 w-5" /> },
      { key: "coaching", title: t("explore.coaching", "Coaching"), subtitle: t("explore.coachingDesc", "6-Month Program"), href: "/transformation", icon: <Heart className="h-5 w-5" /> },
      { key: "privateSessions", title: t("explore.privateSessions", "Private Sessions"), subtitle: t("explore.privateSessionsDesc", "1-on-1 with Adam or Laila"), href: "/private-sessions", icon: <Users className="h-5 w-5" /> },
      { key: "affirmationSoundtrack", title: t("explore.affirmationSoundtrack", "Affirmation Soundtrack"), subtitle: t("explore.affirmationSoundtrackDesc", "Personalized for you"), href: "/affirmation-soundtrack", icon: <Mic2 className="h-5 w-5" /> },
      { key: "certification", title: t("home.practitionerCert", "Practitioner Certification"), subtitle: t("home.certDesc", "Become a certified practitioner"), href: "/certification", icon: <Star className="h-5 w-5" /> },
      { key: "pregnancy", title: t("pregnancy.title", "Sacred Pregnancy"), subtitle: t("pregnancy.subtitle", "Support on your journey"), href: "/pregnancy-program", icon: <Heart className="h-5 w-5" /> },
    ],
    [t]
  );

  const connectItems: LibraryItem[] = useMemo(
    () => [
      { key: "community", title: t("explore.community", "Community"), subtitle: t("explore.communityDesc", "Chat with guides & members"), href: "/community", icon: <Users className="h-5 w-5" /> },
      { key: "stargate", title: t("home.stargateMembership", "Stargate Membership"), subtitle: t("home.stargateDesc", "Weekly live sessions, Telegram community"), href: "/stargate", icon: <Crown className="h-5 w-5" />, badge: t("explore.badgeSwedish", "Swedish") },
    ],
    [t]
  );

  const exploreItems: LibraryItem[] = useMemo(
    () => [
      { key: "podcast", title: t("explore.podcast", "Podcast"), subtitle: t("explore.podcastDesc", "Streams on Spotify"), href: "/podcast", icon: <Headphones className="h-5 w-5" /> },
      { key: "videos", title: t("explore.videos", "Videos"), subtitle: t("explore.videosDesc", "Watch & learn"), href: "/spiritual-education", icon: <Youtube className="h-5 w-5" /> },
      { key: "creativeSoul", title: t("explore.creativeSoul", "Creative Soul"), subtitle: t("explore.creativeSoulDesc", "Create with AI"), href: "/creative-soul/store", icon: <Sparkles className="h-5 w-5" /> },
      { key: "shop", title: t("explore.shop", "Shop"), subtitle: t("explore.shopDesc", "Laila's Collection"), href: "/shop", icon: <ShoppingBag className="h-5 w-5" /> },
      { key: "leaderboard", title: t("explore.leaderboard", "Leaderboard"), subtitle: t("explore.leaderboardDesc", "Top earners win monthly"), href: "/leaderboard", icon: <Trophy className="h-5 w-5" />, badge: "5,000 SHC" },
      { key: "abundance", title: t("explore.abundance", "Abundance"), subtitle: t("explore.abundanceDescInner", "Inner abundance & life support"), href: "/library/abundance", icon: <Zap className="h-5 w-5" /> },
    ],
    [t]
  );

  const { playUniversalAudio } = useMusicPlayer();
  const { allAudioItems } = useQuickActionItems();
  const { language: meditationLanguage } = useMeditationContentLanguage();
  const { isPremium: isPaid } = useMembership();
  const [showFallback, setShowFallback] = useState(false);
  const presence = usePresenceState();

  const onQuick = (key: "calm" | "heart" | "pause" | "sleep") => {
    if (key === "pause") {
      const item = resolveQuickActionItem(allAudioItems, "pause", meditationLanguage);
      if (item) {
        setShowFallback(false);
        playUniversalAudio(item);
      } else {
        navigate("/breathing");
      }
      return;
    }
    const item = resolveQuickActionItem(allAudioItems, key, meditationLanguage);
    if (!item) {
      setShowFallback(true);
      return;
    }
    setShowFallback(false);
    playUniversalAudio(item);
  };

  const subtitleMap: Record<string, string> = {
    start: t(getSubtitleKey(dayPhase), "Begin gently today."),
    returned: t("explore.presence.returned", "Welcome back — stay with the feeling."),
    deep: t("explore.presence.deep", "You're in a quiet space now."),
  };
  const subtitle = subtitleMap[presence] ?? subtitleMap.start;

  const firstActionTitle =
    presence === "start"
      ? t("explore.intent.calm", "Calm my mind")
      : t("explore.presence.continueGently", "Continue gently");
  const firstActionSubtitle =
    presence === "start"
      ? t("explore.intent.calmDesc", "A short reset (2–3 min)")
      : t("explore.presence.stayWithState", "Stay with this state");

  const onQuickCalm = () => onQuick("calm");
  const onQuickHeart = () => onQuick("heart");
  const onQuickPause = () => onQuick("pause");
  const onQuickSleep = () => onQuick("sleep");

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-3">
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          {t("explore.title", "Library")}
        </h1>
        <p className="text-white/60 mt-1 text-sm">
          {subtitle}
        </p>
      </div>

      {/* Quick Actions — start immediately, no navigation to categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={onQuickCalm}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{firstActionTitle}</div>
              <div className="text-sm text-muted-foreground">{firstActionSubtitle}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button
          onClick={onQuickHeart}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Heart className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{t("explore.intent.heal", "Soften the heart")}</div>
              <div className="text-sm text-muted-foreground">{t("explore.intent.healDesc", "Gentle support when it feels heavy")}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button
          onClick={onQuickPause}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{t("explore.intent.pause", "Take a small pause")}</div>
              <div className="text-sm text-muted-foreground">{t("explore.intent.pauseDesc", "One-minute breath reset")}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button
          onClick={onQuickSleep}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Moon className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{t("explore.intent.sleep", "Sleep deeply")}</div>
              <div className="text-sm text-muted-foreground">{t("explore.intent.sleepDesc", "Unwind into rest")}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
      </div>

      {showFallback ? (
        <QuickActionFallback
          title={t("explore.fallback.title", "New sessions are arriving")}
          body={t("explore.fallback.body", "Your library is still being filled. You can explore what's available right now.")}
          buttonLabel={t("explore.fallback.button", "Browse meditations")}
          onClick={() => navigate("/meditations")}
        />
      ) : null}

      {/* Your Space */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-white/50 mb-4 tracking-wide uppercase">
          Your Space
        </h2>

        <div className="w-full relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {/* subtle "alive" glow */}
          <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity
                          bg-gradient-to-r from-white/0 via-white/5 to-white/0" />

          {/* Header row clickable */}
          <button
            onClick={() => navigate("/membership")}
            className="w-full p-6 text-left hover:bg-white/7 transition relative z-10"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Sparkles size={24} className="text-white/80" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {isPaid ? "Your Space" : "Membership"}
                    </h3>

                    {isPaid ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/70">
                        Active
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-white/60 mt-1 max-w-md leading-relaxed">
                    {isPaid
                      ? "Everything included for you — choose where to enter."
                      : "Open your full space and access everything in one place."}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-full bg-white/5 border border-white/10">
                <ChevronRight size={20} className="text-white/60" />
              </div>
            </div>
          </button>

          {/* Paid-only: tool launcher row inside the same card */}
          {isPaid ? (
            <div className="relative z-10 px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => navigate("/vedic-astrology")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/7 transition"
                >
                  <div className="text-sm font-semibold text-white">Vedic Astrology</div>
                  <div className="mt-1 text-xs text-white/60">Daily influence + blueprint</div>
                </button>

                <button
                  onClick={() => navigate("/ayurveda")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/7 transition"
                >
                  <div className="text-sm font-semibold text-white">Ayurveda</div>
                  <div className="mt-1 text-xs text-white/60">Balance + daily guidance</div>
                </button>

                <button
                  onClick={() => navigate("/soul")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/7 transition"
                >
                  <div className="text-sm font-semibold text-white">Soul</div>
                  <div className="mt-1 text-xs text-white/60">Receive deeper sessions</div>
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => navigate("/library")}
                  className="text-sm text-white/70 hover:text-white transition underline underline-offset-4"
                >
                  Open Library
                </button>

                <button
                  onClick={() => navigate("/membership")}
                  className="text-sm text-white/70 hover:text-white transition underline underline-offset-4"
                >
                  Manage
                </button>
              </div>
            </div>
          ) : (
            // Free-only: simple CTA footer (optional)
            <div className="relative z-10 px-6 pb-6">
              <button
                onClick={() => navigate("/membership")}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
              >
                View plans
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Explore everything — collapsed by default */}
      <CollapsibleSection
        title={t("explore.exploreEverything", "Explore everything")}
        subtitle={t("explore.exploreEverythingSubtitle", "Open when you feel ready.")}
        defaultOpen={false}
      >
        <LibrarySection
          title={t("explore.sectionStart", "Start")}
          items={startItems}
          initialVisible={4}
        />
        <LibrarySection
          title={t("explore.sectionDeepen", "Deepen")}
          items={deepenItems}
          initialVisible={4}
        />
        <LibrarySection
          title={t("explore.sectionConnect", "Connect")}
          subtitle={t("explore.sectionConnectSubtitle", "A place to practice with others")}
          items={connectItems}
          initialVisible={4}
        />
        <LibrarySection
          title={t("explore.sectionExplore", "Explore")}
          items={exploreItems}
          initialVisible={4}
        />
      </CollapsibleSection>

      {/* Invite Friends */}
      <div className="rounded-2xl glass-card p-5 mb-6">
        <h3 className="text-base font-heading font-semibold text-foreground mb-3">{t("dashboard.inviteFriends")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("dashboard.inviteDescription")}</p>
        <Link to="/invite-friends">
          <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold shadow-[0_0_30px_rgba(0,242,254,0.4)]">
            <Users className="w-4 h-4" />
            {t("dashboard.inviteFriends")}
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        <ParamahamsaVishwanandaDailyCard />
      </div>
    </div>
  );
}
