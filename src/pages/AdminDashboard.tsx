import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Music, 
  Sparkles, 
  FileText, 
  Play, 
  Settings,
  Users,
  CreditCard,
  BookOpen,
  Bell,
  DollarSign,
  Youtube,
  ShoppingBag,
  Crown,
  Trophy,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const adminSections = [
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
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, activeThisMonth: 0, totalSHC: 0 });

  useEffect(() => {
    const fetchStats = async () => {
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all your app content</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.members.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto text-secondary mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.activeThisMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Active This Month</p>
          </Card>
          <Card className="p-4 text-center">
            <Sparkles className="w-6 h-6 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold text-foreground">{(stats.totalSHC / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground">SHC Distributed</p>
          </Card>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {adminSections.map((section) => (
            <Link key={section.href} to={section.href}>
              <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-muted ${section.color}`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/content')}>
              <FileText className="w-4 h-4 mr-2" />
              Edit Healing Page
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/meditations')}>
              <Play className="w-4 h-4 mr-2" />
              Add Meditation
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/healing')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Add Healing Audio
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/music')}>
              <Music className="w-4 h-4 mr-2" />
              Add Music Track
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
