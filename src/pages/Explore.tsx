import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { LibrarySection, type LibraryItem } from "@/components/explore/LibrarySection";
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
      { key: "mantras", title: t("explore.mantras", "Mantras"), subtitle: t("explore.mantrasDesc", "Earn SHC"), href: "/mantras", icon: <Music2 className="h-5 w-5" />, badge: "111 SHC" },
      { key: "abundance", title: t("explore.abundance", "Sacred Healing Abundance"), subtitle: t("explore.abundanceDesc", "Earn with us"), href: "/income-streams", icon: <Zap className="h-5 w-5" />, badge: t("common.new", "New") },
    ],
    [t]
  );

  const goIntent = (intent: "calm" | "heal" | "energy" | "sleep") => {
    switch (intent) {
      case "calm":
        navigate("/meditations?category=healing");
        return;
      case "heal":
        navigate("/paths");
        return;
      case "energy":
        navigate("/music?mood=energizing");
        return;
      case "sleep":
        navigate("/meditations?category=sleep");
        return;
      default:
        navigate("/explore");
    }
  };

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-3">
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          {t("explore.title", "Library")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t(getSubtitleKey(dayPhase), "Take a small pause.")}
        </p>
      </div>

      {/* Quick Intent (4 buttons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => goIntent("calm")}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{t("explore.intent.calm", "Calm my mind")}</div>
              <div className="text-sm text-muted-foreground">{t("explore.intent.calmDesc", "Reduce stress & anxiety")}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button
          onClick={() => goIntent("heal")}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Heart className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{t("explore.intent.heal", "Soften the heart")}</div>
              <div className="text-sm text-muted-foreground">{t("explore.intent.healDesc", "Release, nurture & restore")}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button
          onClick={() => goIntent("energy")}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{t("explore.intent.energy", "Boost my energy")}</div>
              <div className="text-sm text-muted-foreground">{t("explore.intent.energyDesc", "Motivation & power")}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
        <button
          onClick={() => goIntent("sleep")}
          className="rounded-2xl border border-border/50 bg-card/50 px-4 py-4 text-left hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Moon className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{t("explore.intent.sleep", "Sleep deeply")}</div>
              <div className="text-sm text-muted-foreground">{t("explore.intent.sleepDesc", "Wind down & rest")}</div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
      </div>

      {/* Your Space — Premium Membership only */}
      <div className="mb-6">
        <h3 className="text-base font-heading font-semibold text-foreground mb-1">
          {t("explore.yourSpaceTitle", "Your Space")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("explore.yourSpaceSubtitle", "Everything in one place. Yours to return to.")}
        </p>
        <Link to="/membership" className="block">
          <Card className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-pink-500/20 border-amber-500/30 hover:border-amber-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/30 to-purple-500/20">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{t("explore.membership", "Membership")}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {t("explore.badgePremium", "Premium")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("explore.membershipEnterSpace", "Enter your space")}</p>
              </div>
              <span className="text-muted-foreground">›</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Start */}
      <LibrarySection
        title={t("explore.sectionStart", "Start")}
        items={startItems}
        initialVisible={4}
      />

      {/* Deepen */}
      <LibrarySection
        title={t("explore.sectionDeepen", "Deepen")}
        items={deepenItems}
        initialVisible={4}
      />

      {/* Connect */}
      <LibrarySection
        title={t("explore.sectionConnect", "Connect")}
        subtitle={t("explore.sectionConnectSubtitle", "A place to practice with others")}
        items={connectItems}
        initialVisible={4}
      />

      {/* Explore */}
      <LibrarySection
        title={t("explore.sectionExplore", "Explore")}
        items={exploreItems}
        initialVisible={4}
      />

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
