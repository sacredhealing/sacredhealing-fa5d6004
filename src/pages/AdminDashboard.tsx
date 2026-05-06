/**
 * SQI-2050 Admin Nexus — visual layer only; all routes & Supabase stats logic preserved.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { 
  ArrowLeft, 
  Music, 
  Sparkles, 
  FileText, 
  Play, 
  Users,
  BookOpen,
  Bell,
  DollarSign,
  Youtube,
  ShoppingBag,
  Crown,
  Trophy,
  Mail,
  SendHorizontal,
  FolderKanban,
  Wind,
  AudioLines,
  BarChart3,
  Map,
  MessageCircle,
  Volume2,
  Languages,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { fetchPublicAggregateDashboardStats } from '@/lib/dashboardAggregateStats';

const ADMIN_DASH_SQI_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  .sqi-admin-dash {
    font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
    background: #050505;
    color: rgba(255, 255, 255, 0.92);
    min-height: 100vh;
  }
  .sqi-admin-dash .ad-glass {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 40px;
    box-shadow: 0 0 48px rgba(212, 175, 55, 0.06);
  }
  .sqi-admin-dash .ad-glass:hover {
    border-color: rgba(212, 175, 55, 0.14);
    box-shadow: 0 0 56px rgba(212, 175, 55, 0.1);
  }
  .sqi-admin-dash .ad-kicker {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.42);
  }
  .sqi-admin-dash .ad-h1 {
    font-weight: 900;
    letter-spacing: -0.05em;
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.25);
  }
  .sqi-admin-dash .ad-body {
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.6);
  }
  .sqi-admin-dash .ad-stat-lbl {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.38);
  }
  /* Sealed sigil wells — light contained (no diffuse bleed) */
  .sqi-admin-dash .ad-sigil {
    position: relative;
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 18px;
    padding: 1px;
    isolation: isolate;
    contain: layout style paint;
    background: linear-gradient(155deg, rgba(212, 175, 55, 0.42), rgba(212, 175, 55, 0.06));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.55);
  }
  .sqi-admin-dash .ad-sigil--sm {
    width: 46px;
    height: 46px;
    border-radius: 16px;
  }
  .sqi-admin-dash .ad-sigil--sm .ad-sigil__inner {
    border-radius: 15px;
  }
  .sqi-admin-dash .ad-sigil--cyan {
    background: linear-gradient(155deg, rgba(34, 211, 238, 0.38), rgba(34, 211, 238, 0.05));
  }
  .sqi-admin-dash .ad-sigil__inner {
    width: 100%;
    height: 100%;
    border-radius: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.22);
    background:
      radial-gradient(ellipse 90% 75% at 35% 22%, rgba(212, 175, 55, 0.14), transparent 58%),
      linear-gradient(168deg, rgba(22, 20, 16, 0.99), rgba(5, 5, 5, 1));
  }
  .sqi-admin-dash .ad-sigil--cyan .ad-sigil__inner {
    border-color: rgba(34, 211, 238, 0.28);
    background:
      radial-gradient(ellipse 90% 75% at 35% 22%, rgba(34, 211, 238, 0.12), transparent 58%),
      linear-gradient(168deg, rgba(12, 22, 26, 0.99), rgba(5, 5, 5, 1));
  }
  .sqi-admin-dash .ad-sigil__svg {
    width: 22px;
    height: 22px;
    stroke-width: 1.35px;
    opacity: 0.94;
    color: #D4AF37;
  }
  .sqi-admin-dash .ad-sigil--sm .ad-sigil__svg {
    width: 19px;
    height: 19px;
    stroke-width: 1.45px;
  }
  .sqi-admin-dash .ad-sigil--cyan .ad-sigil__svg {
    color: #22D3EE;
  }
  .sqi-admin-dash .ad-sigil--mini {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    padding: 1px;
  }
  .sqi-admin-dash .ad-sigil--mini .ad-sigil__inner {
    border-radius: 9px;
  }
  .sqi-admin-dash .ad-sigil--mini .ad-sigil__svg {
    width: 14px;
    height: 14px;
    stroke-width: 1.5px;
  }
  .sqi-admin-dash .ad-back-sigil {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    padding: 1px;
    isolation: isolate;
    contain: layout style paint;
    background: linear-gradient(155deg, rgba(212, 175, 55, 0.28), rgba(212, 175, 55, 0.04));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 12px rgba(0, 0, 0, 0.45);
  }
  .sqi-admin-dash .ad-back-sigil__inner {
    width: 100%;
    height: 100%;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.18);
    background: linear-gradient(168deg, rgba(14, 13, 10, 0.98), rgba(5, 5, 5, 1));
  }
  .sqi-admin-dash .ad-back-sigil__svg {
    width: 18px;
    height: 18px;
    stroke-width: 1.4px;
    color: #D4AF37;
    opacity: 0.9;
  }
  .sqi-admin-dash .ad-btn-outline {
    border-radius: 40px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.85);
  }
  .sqi-admin-dash .ad-btn-outline:hover {
    border-color: rgba(212, 175, 55, 0.35);
    color: #D4AF37;
    background: rgba(212, 175, 55, 0.06);
  }
`;

/** Contained Siddha sigil — glow stays inside the well (no outward bleed). */
function AdminSigilIcon({
  icon: Icon,
  variant = 'gold',
  size = 'md',
}: {
  icon: LucideIcon;
  variant?: 'gold' | 'cyan';
  size?: 'md' | 'sm' | 'mini';
}) {
  const classes = [
    'ad-sigil',
    variant === 'cyan' ? 'ad-sigil--cyan' : '',
    size === 'sm' ? 'ad-sigil--sm' : '',
    size === 'mini' ? 'ad-sigil--mini' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const sw = size === 'mini' ? 1.5 : size === 'sm' ? 1.4 : 1.35;
  return (
    <div className={classes} aria-hidden>
      <div className="ad-sigil__inner">
        <Icon className="ad-sigil__svg" strokeWidth={sw} />
      </div>
    </div>
  );
}

const adminSections = [
  {
    title: 'Grant Access',
    description: 'Give users free access to courses, membership, Sri Yantra, Creative Soul & more',
    icon: Gift,
    href: '/admin/grant-access',
    color: 'text-amber-500',
  },
  {
    title: 'Announcements',
    description: 'Send notices and updates to all users',
    icon: Bell,
    href: '/admin/announcements',
    color: 'text-yellow-500',
  },
  {
    title: 'Site Content',
    description: 'Edit text, titles, and descriptions throughout the app',
    icon: FileText,
    href: '/admin/content',
    color: 'text-blue-500',
  },
  {
    title: 'Courses',
    description: 'Create and manage courses with lessons & certificates',
    icon: BookOpen,
    href: '/admin/courses',
    color: 'text-orange-500',
  },
  {
    title: 'Income Streams',
    description: 'Share money-making opportunities with users',
    icon: DollarSign,
    href: '/admin/income-streams',
    color: 'text-green-500',
  },
  {
    title: 'YouTube Channels',
    description: 'Manage channels for Spiritual Education videos',
    icon: Youtube,
    href: '/admin/youtube',
    color: 'text-red-500',
  },
  {
    title: 'Meditations',
    description: 'Upload and manage meditation audio files',
    icon: Play,
    href: '/admin/meditations',
    color: 'text-purple-500',
  },
  {
    title: 'Healing Audio',
    description: 'Manage healing space audio content',
    icon: Sparkles,
    href: '/admin/healing',
    color: 'text-pink-500',
  },
  {
    title: 'Music Store',
    description: 'Upload and manage music tracks for sale',
    icon: Music,
    href: '/admin/music',
    color: 'text-emerald-500',
  },
  {
    title: 'Divine Transmissions',
    description: 'Manage Explore Akasha audio talks, oracle teachings & series',
    icon: AudioLines,
    href: '/admin/divine-transmissions',
    color: 'text-violet-500',
  },
  {
    title: 'Mantras',
    description: 'Manage sacred mantras for users to earn 111 SHC',
    icon: Crown,
    href: '/admin/mantras',
    color: 'text-amber-500',
  },
  {
    title: 'Shop Products',
    description: "Manage Laila's clothing and art for sale",
    icon: ShoppingBag,
    href: '/admin/shop',
    color: 'text-pink-500',
  },
  {
    title: 'Private Sessions',
    description: 'Manage session types, packages, and Calendly links',
    icon: Users,
    href: '/admin/private-sessions',
    color: 'text-indigo-500',
  },
  {
    title: 'Transformation Program',
    description: 'Manage program details, variations, and pricing',
    icon: Sparkles,
    href: '/admin/transformation',
    color: 'text-amber-500',
  },
  {
    title: 'Email List',
    description: 'Manage subscribers and send bulk emails',
    icon: Mail,
    href: '/admin/email-list',
    color: 'text-cyan-500',
  },
  {
    title: 'Email Automation',
    description: 'Weekly digest, Lakshmi Friday, welcome flows & send logs',
    icon: SendHorizontal,
    href: '/admin/email-automation',
    color: 'text-amber-400',
  },
  {
    title: 'Admin System',
    description: 'Manage projects, tasks, content, events & settings',
    icon: FolderKanban,
    href: '/admin/system',
    color: 'text-violet-500',
  },
  {
    title: 'Breathing Exercises',
    description: 'Manage breathing patterns and exercises',
    icon: Wind,
    href: '/admin/breathing',
    color: 'text-cyan-500',
  },
  {
    title: 'Ambient Sounds',
    description: 'Manage background audio loops for meditation',
    icon: Volume2,
    href: '/admin/ambient-sounds',
    color: 'text-teal-500',
  },
  {
    title: 'Affirmation Soundtrack',
    description: 'Manage content and pricing for affirmation page',
    icon: AudioLines,
    href: '/admin/affirmation',
    color: 'text-purple-500',
  },
  {
    title: 'Analytics & KPIs',
    description: 'View conversion, retention, ARPU and churn metrics',
    icon: BarChart3,
    href: '/admin/analytics',
    color: 'text-emerald-500',
  },
  {
    title: 'Spiritual Paths',
    description: 'Manage daily content for all 114 spiritual path days',
    icon: Map,
    href: '/admin/paths',
    color: 'text-teal-500',
  },
  {
    title: 'Sacred Circles',
    description: 'Manage chat rooms, moderation, and community circles',
    icon: MessageCircle,
    href: '/admin/circles',
    color: 'text-pink-500',
  },
  {
    title: 'Vedic Translation Tool',
    description: 'Bhagavad Gita, Guru Gita & Bhagavatam – devotional Swedish translations',
    icon: Languages,
    href: '/admin/vedic-translation',
    color: 'text-amber-500',
  },
  {
    title: 'Scriptural Books',
    description: 'Automated book creation from audio with Sanskrit verse detection',
    icon: BookOpen,
    href: '/admin/books',
    color: 'text-purple-500',
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, activeThisMonth: 0, totalSHC: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const agg = await fetchPublicAggregateDashboardStats();
      if (agg) {
        setStats({
          members: agg.total_profiles,
          activeThisMonth: agg.active_this_month,
          totalSHC: Number(agg.total_shc_distributed) || 0,
        });
        return;
      }

      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: activeData } = await supabase
        .from('shc_transactions')
        .select('user_id')
        .gte('created_at', startOfMonth.toISOString());

      const uniqueActive = new Set(activeData?.map(d => d.user_id) || []);

      const { data: balances } = await supabase
        .from('user_balances')
        .select('total_earned');

      const totalSHC = balances?.reduce((sum, b) => sum + Number(b.total_earned), 0) || 0;

      setStats({
        members: memberCount || 0,
        activeThisMonth: uniqueActive.size,
        totalSHC
      });
    };
    fetchStats();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_DASH_SQI_CSS }} />
      <div className="sqi-admin-dash pb-28 px-4 pt-6 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              className="h-auto w-auto p-0 shrink-0 rounded-[14px] border-0 bg-transparent hover:bg-transparent text-[#D4AF37] shadow-none"
              aria-label="Back to profile"
            >
              <div className="ad-back-sigil">
                <div className="ad-back-sigil__inner">
                  <ArrowLeft className="ad-back-sigil__svg" strokeWidth={1.4} />
                </div>
              </div>
            </Button>
            <div className="min-w-0">
              <p className="ad-kicker mb-1">NADA · ADMIN NEXUS</p>
              <h1 className="ad-h1 text-xl sm:text-2xl">Admin Dashboard</h1>
              <p className="ad-body text-sm mt-1">Manage all your app content — Vedic Light-Codes & Bhakti-Algorithms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <AdminSigilIcon icon={Users} variant="gold" size="sm" />
              </div>
              <p className="text-2xl font-black tracking-tight text-[#D4AF37] tabular-nums">{stats.members.toLocaleString()}</p>
              <p className="ad-stat-lbl mt-2">Total Members</p>
            </Card>
            <Card className="ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <AdminSigilIcon icon={Trophy} variant="cyan" size="sm" />
              </div>
              <p className="text-2xl font-black tracking-tight text-[#22D3EE] tabular-nums">{stats.activeThisMonth.toLocaleString()}</p>
              <p className="ad-stat-lbl mt-2">Active This Month</p>
            </Card>
            <Card className="ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <AdminSigilIcon icon={Sparkles} variant="gold" size="sm" />
              </div>
              <p className="text-2xl font-black tracking-tight text-[#D4AF37] tabular-nums">{(stats.totalSHC / 1000).toFixed(1)}K</p>
              <p className="ad-stat-lbl mt-2">SHC Distributed</p>
            </Card>
          </div>

          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {adminSections.map((section) => (
              <Link key={section.href} to={section.href}>
                <Card className="ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 cursor-pointer h-full transition-transform hover:scale-[1.01]">
                  <div className="flex items-start gap-4">
                    <AdminSigilIcon icon={section.icon} variant="gold" size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black tracking-tight text-[15px] sm:text-base text-[#D4AF37]" style={{ textShadow: '0 0 12px rgba(212,175,55,0.2)' }}>{section.title}</h3>
                      <p className="ad-body text-sm mt-1.5">{section.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6">
            <h2 className="ad-kicker mb-4 block">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/content')} className="ad-btn-outline rounded-[40px] border-0 gap-2">
                <AdminSigilIcon icon={FileText} size="mini" />
                Edit Healing Page
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/meditations')} className="ad-btn-outline rounded-[40px] border-0 gap-2">
                <AdminSigilIcon icon={Play} size="mini" />
                Add Meditation
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/healing')} className="ad-btn-outline rounded-[40px] border-0 gap-2">
                <AdminSigilIcon icon={Sparkles} size="mini" />
                Add Healing Audio
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/music')} className="ad-btn-outline rounded-[40px] border-0 gap-2">
                <AdminSigilIcon icon={Music} size="mini" />
                Add Music Track
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
