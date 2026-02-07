import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Heart,
  Moon,
  Zap,
  Sparkles,
  Music2,
  ShoppingBag,
  Mic,
  Trophy,
  Users,
  BookOpen,
  Headphones,
  Calendar,
  Youtube,
} from "lucide-react";

type OfferItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  badge?: string;
};

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const offers: OfferItem[] = useMemo(
    () => [
      {
        title: t("explore.mantras", "Mantras"),
        description: t("explore.mantrasDesc", "Earn SHC"),
        icon: <Music2 className="h-5 w-5" />,
        to: "/mantras",
        badge: "111 SHC",
      },
      {
        title: t("explore.breathing", "Breathing"),
        description: t("explore.breathingDesc", "Calm & energize"),
        icon: <Sparkles className="h-5 w-5" />,
        to: "/breathing",
      },
      {
        title: t("explore.shop", "Shop"),
        description: t("explore.shopDesc", "Laila's Collection"),
        icon: <ShoppingBag className="h-5 w-5" />,
        to: "/shop",
      },
      {
        title: t("explore.membership", "Membership"),
        description: t("explore.membershipDesc", "Upgrade your plan"),
        icon: <Sparkles className="h-5 w-5" />,
        to: "/membership",
      },
      {
        title: t("explore.coaching", "Coaching"),
        description: t("explore.coachingDesc", "6-Month Program"),
        icon: <Heart className="h-5 w-5" />,
        to: "/transformation",
      },
      {
        title: t("explore.leaderboard", "Leaderboard"),
        description: t("explore.leaderboardDesc", "Top earners win monthly"),
        icon: <Trophy className="h-5 w-5" />,
        to: "/leaderboard",
        badge: "5,000 SHC",
      },
      {
        title: t("explore.affirmationSoundtrack", "Affirmation Soundtrack"),
        description: t("explore.affirmationSoundtrackDesc", "Personalized for you"),
        icon: <Mic className="h-5 w-5" />,
        to: "/affirmation-soundtrack",
      },
      {
        title: t("explore.privateSessions", "Private Sessions"),
        description: t("explore.privateSessionsDesc", "1-on-1 with Adam or Laila"),
        icon: <Users className="h-5 w-5" />,
        to: "/private-sessions",
      },
      {
        title: t("explore.podcast", "Podcast"),
        description: t("explore.podcastDesc", "Streams on Spotify"),
        icon: <Headphones className="h-5 w-5" />,
        to: "/podcast",
      },
      {
        title: t("explore.abundance", "Sacred Healing Abundance"),
        description: t("explore.abundanceDesc", "Earn with us"),
        icon: <Zap className="h-5 w-5" />,
        to: "/income-streams",
        badge: t("common.new", "New"),
      },
      {
        title: t("explore.courses", "Courses"),
        description: t("explore.coursesDesc", "Deepen your practice"),
        icon: <BookOpen className="h-5 w-5" />,
        to: "/courses",
      },
      {
        title: t("explore.community", "Community"),
        description: t("explore.communityDesc", "Chat with guides & members"),
        icon: <Users className="h-5 w-5" />,
        to: "/community",
      },
      {
        title: t("explore.videos", "Videos"),
        description: t("explore.videosDesc", "Watch & learn"),
        icon: <Youtube className="h-5 w-5" />,
        to: "/spiritual-education",
      },
      {
        title: t("explore.creativeSoul", "Creative Soul"),
        description: t("explore.creativeSoulDesc", "Create with AI"),
        icon: <Sparkles className="h-5 w-5" />,
        to: "/creative-soul/store",
      },
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

  const filteredOffers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((o) => {
      return (
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        (o.badge ? o.badge.toLowerCase().includes(q) : false)
      );
    });
  }, [offers, query]);

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-3">
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          {t("explore.title", "Explore")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("explore.helpToday", "How can we help you today?")}
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
                {t("explore.intent.heal", "Heal emotionally")}
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

      {/* Browse everything (collapsed by default) */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          {t("explore.browseAll", "Browse everything")}
        </h2>
        <Button
          variant="ghost"
          onClick={() => setShowAll((v) => !v)}
          className="text-sm"
        >
          {showAll ? t("common.hide", "Hide") : t("common.show", "Show")}
        </Button>
      </div>

      {showAll && (
        <div className="space-y-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search", "Search...")}
            className="rounded-2xl bg-muted/30 border-border/50"
          />

          <div>
            <div className="text-sm text-muted-foreground mb-2">
              {t("explore.whatWeOffer", "What we offer")}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOffers.map((item) => (
                <Link key={item.to} to={item.to} className="block">
                  <Card className="rounded-2xl p-4 bg-card/50 border-border/50 hover:bg-muted/30 transition">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-foreground truncate">
                            {item.title}
                          </div>
                          {item.badge ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 shrink-0">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
