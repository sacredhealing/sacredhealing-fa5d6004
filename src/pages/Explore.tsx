import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
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
  Star,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type OfferItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  badge?: string;
};

type ToolCategory = {
  titleKey: string;
  items: OfferItem[];
};

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
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const dayPhase = getDayPhase();

  const dailyPractice: OfferItem[] = useMemo(
    () => [
      { title: t("explore.meditations", "Meditations"), description: t("explore.meditationsDesc", "Find your inner peace"), icon: <Sparkles className="h-5 w-5" />, to: "/meditations" },
      { title: t("explore.breathing", "Breathing"), description: t("explore.breathingDesc", "Calm & energize"), icon: <Sparkles className="h-5 w-5" />, to: "/breathing" },
      { title: t("explore.music", "Music"), description: t("explore.musicDesc", "Sacred frequencies"), icon: <Music2 className="h-5 w-5" />, to: "/music" },
      { title: t("explore.soul", "Soul"), description: t("explore.soulDesc", "Transform & restore"), icon: <Heart className="h-5 w-5" />, to: "/healing" },
    ],
    [t]
  );

  const growth: OfferItem[] = useMemo(
    () => [
      { title: t("explore.courses", "Courses"), description: t("explore.coursesDesc", "Deepen your practice"), icon: <BookOpen className="h-5 w-5" />, to: "/courses" },
      { title: t("explore.coaching", "Coaching"), description: t("explore.coachingDesc", "6-Month Program"), icon: <Heart className="h-5 w-5" />, to: "/transformation" },
      { title: t("home.practitionerCert", "Practitioner Certification"), description: t("home.certDesc", "Become a certified practitioner"), icon: <Star className="h-5 w-5" />, to: "/certification" },
      { title: t("pregnancy.title", "Sacred Pregnancy"), description: t("pregnancy.subtitle", "Support on your journey"), icon: <Heart className="h-5 w-5" />, to: "/pregnancy-program" },
    ],
    [t]
  );

  const belong: OfferItem[] = useMemo(
    () => [
      { title: t("explore.community", "Community"), description: t("explore.communityDesc", "Chat with guides & members"), icon: <Users className="h-5 w-5" />, to: "/community" },
      { title: t("explore.privateSessions", "Private Sessions"), description: t("explore.privateSessionsDesc", "1-on-1 with Adam or Laila"), icon: <Users className="h-5 w-5" />, to: "/private-sessions" },
    ],
    [t]
  );

  const explore: OfferItem[] = useMemo(
    () => [
      { title: t("explore.videos", "Videos"), description: t("explore.videosDesc", "Watch & learn"), icon: <Youtube className="h-5 w-5" />, to: "/spiritual-education" },
      { title: t("explore.podcast", "Podcast"), description: t("explore.podcastDesc", "Streams on Spotify"), icon: <Headphones className="h-5 w-5" />, to: "/podcast" },
      { title: t("explore.creativeSoul", "Creative Soul"), description: t("explore.creativeSoulDesc", "Create with AI"), icon: <Sparkles className="h-5 w-5" />, to: "/creative-soul/store" },
      { title: t("explore.shop", "Shop"), description: t("explore.shopDesc", "Laila's Collection"), icon: <ShoppingBag className="h-5 w-5" />, to: "/shop" },
      { title: t("explore.leaderboard", "Leaderboard"), description: t("explore.leaderboardDesc", "Top earners win monthly"), icon: <Trophy className="h-5 w-5" />, to: "/leaderboard", badge: "5,000 SHC" },
      { title: t("explore.abundance", "Sacred Healing Abundance"), description: t("explore.abundanceDesc", "Earn with us"), icon: <Zap className="h-5 w-5" />, to: "/income-streams", badge: t("common.new", "New") },
    ],
    [t]
  );

  const categories: ToolCategory[] = useMemo(
    () => [
      { titleKey: "explore.categoryDailyPractice", items: dailyPractice },
      { titleKey: "explore.categoryGrowth", items: growth },
      { titleKey: "explore.categoryBelong", items: belong },
      { titleKey: "explore.categoryExplore", items: explore },
    ],
    [dailyPractice, growth, belong, explore]
  );

  const filterItems = (items: OfferItem[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        (o.badge ? o.badge.toLowerCase().includes(q) : false)
    );
  };

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
          {t(getSubtitleKey(dayPhase), "Today you may need softness.")}
        </p>
      </div>

      {/* ① Begin */}
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
              <div className="font-semibold text-foreground">
                {t("explore.intent.calm", "Calm my mind")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("explore.intent.calmDesc", "Reduce stress & anxiety")}
              </div>
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
              <div className="font-semibold text-foreground">
                {t("explore.intent.heal", "Soften the heart")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("explore.intent.healDesc", "Inner child, release & restore")}
              </div>
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
              <div className="font-semibold text-foreground">
                {t("explore.intent.energy", "Boost my energy")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("explore.intent.energyDesc", "Motivation & power")}
              </div>
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
              <div className="font-semibold text-foreground">
                {t("explore.intent.sleep", "Sleep deeply")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("explore.intent.sleepDesc", "Wind down & rest")}
              </div>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>
      </div>

      {/* ② Daily Practice */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("explore.categoryDailyPractice", "Daily Practice")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dailyPractice.map((item) => (
            <Link key={item.to} to={item.to} className="block">
              <Card className="rounded-2xl p-4 bg-card/50 border-border/50 hover:bg-muted/30 transition">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{item.title}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Membership — standalone centered invitation */}
      <div className="mb-6">
        <Link to="/stargate" className="block">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-pink-500/10 px-6 py-6 text-center hover:border-amber-500/50 transition-all">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              {t("explore.membershipEnterTitle", "Enter the Circle")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {t("explore.membershipEnterDesc", "Ongoing guidance, live sessions, and shared presence. A place to walk the path together.")}
            </p>
            <Button variant="outline" className="border-amber-500/40 text-foreground hover:bg-amber-500/10">
              {t("explore.membershipEnterButton", "Enter Membership")}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              {t("explore.membershipEnterPrice", "€25/month")}
            </p>
          </div>
        </Link>
      </div>

      {/* ③ Grow */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("explore.categoryGrowth", "Grow")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {growth.map((item) => (
            <Link key={item.to} to={item.to} className="block">
              <Card className="rounded-2xl p-4 bg-card/50 border-border/50 hover:bg-muted/30 transition">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-foreground truncate">{item.title}</div>
                      {item.badge ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 shrink-0">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ④ Belong */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("explore.categoryBelong", "Belong")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {belong.map((item) => (
            <Link key={item.to} to={item.to} className="block">
              <Card className="rounded-2xl p-4 bg-card/50 border-border/50 hover:bg-muted/30 transition">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{item.title}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ⑤ Explore — collapsible for space */}
      <div className="mb-4">
        <button
          onClick={() => setToolsExpanded((v) => !v)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-muted/30 transition"
        >
          <h2 className="text-lg font-heading font-semibold text-foreground">
            {t("explore.categoryExplore", "Explore")}
          </h2>
          {toolsExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {toolsExpanded && (
          <div className="mt-4 space-y-6">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search", "Search...")}
              className="rounded-2xl bg-muted/30 border-border/50"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filterItems(explore).map((item) => (
                <Link key={item.to} to={item.to} className="block">
                  <Card className="rounded-2xl p-4 bg-card/50 border-border/50 hover:bg-muted/30 transition">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-foreground truncate">{item.title}</div>
                          {item.badge ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 shrink-0">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="rounded-2xl glass-card p-5">
              <h3 className="text-base font-heading font-semibold text-foreground mb-3">{t("dashboard.inviteFriends")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("dashboard.inviteDescription")}</p>
              <Link to="/invite-friends">
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold shadow-[0_0_30px_rgba(0,242,254,0.4)]">
                  <Users className="w-4 h-4" />
                  {t("dashboard.inviteFriends")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <ParamahamsaVishwanandaDailyCard />
      </div>
    </div>
  );
}
