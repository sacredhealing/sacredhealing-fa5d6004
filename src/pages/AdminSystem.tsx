import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderKanban, CheckSquare, FileText, Calendar, Settings, Users, LayoutDashboard, Music, GraduationCap, Workflow, DollarSign, TrendingUp, Gift, Mic, Bot, Trophy, Radio, Map, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboardTab from '@/components/admin-system/AdminDashboardTab';
import AdminProjectsTab from '@/components/admin-system/AdminProjectsTab';
import AdminTasksTab from '@/components/admin-system/AdminTasksTab';
import AdminContentTab from '@/components/admin-system/AdminContentTab';
import AdminEventsTab from '@/components/admin-system/AdminEventsTab';
import AdminSettingsTab from '@/components/admin-system/AdminSettingsTab';
import AdminUsersTab from '@/components/admin-system/AdminUsersTab';
import MusicProjectsSection from '@/components/admin-system/MusicProjectsSection';
import CoursesProjectsSection from '@/components/admin-system/CoursesProjectsSection';
import WorkflowTemplateManager from '@/components/admin-system/WorkflowTemplateManager';
import AdminMonthlyCostsTab from '@/components/admin-system/AdminMonthlyCostsTab';
import AdminRevenueTab from '@/components/admin-system/AdminRevenueTab';
import AdminAccessGrantTab from '@/components/admin-system/AdminAccessGrantTab';
import RecordingStudioTab from '@/components/admin-system/RecordingStudioTab';
import AdminMQLStrategiesTab from '@/components/admin-system/AdminMQLStrategiesTab';
import AdminChallengesTab from '@/components/admin-system/AdminChallengesTab';
import AdminLiveEventsTab from '@/components/admin-system/AdminLiveEventsTab';
import AdminRoadmapTab from '@/components/admin-system/AdminRoadmapTab';
import AdminCreativeSoulTab from '@/components/admin-system/AdminCreativeSoulTab';

const AdminSystem = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const { isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isAuthLoading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="glass-card flex items-center gap-3 px-6 py-4">
          <div className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <p className="text-white/70 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen bg-[#050505] flex items-center justify-center px-6"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 45%), #050505",
        }}
      >
        <div className="glass-card w-full max-w-md text-center">
          <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">
            Admin Gate
          </div>
          <h1 className="mt-3 text-[26px] leading-[1.05] font-black tracking-[-0.05em] text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)]">
            Access Denied
          </h1>
          <p className="mt-3 text-white/60 leading-[1.6]">
            You need admin privileges to access this page.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full rounded-[20px] bg-[#D4AF37] text-[#050505] font-black hover:opacity-90"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: '90-Day Roadmap', icon: Map },
    { id: 'recording', label: 'Recording Studio', icon: Mic },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'live-events', label: 'Live Events', icon: Radio },
    { id: 'creative-soul', label: 'Creative Soul', icon: Sparkles },
    { id: 'mql', label: 'MQL Strategies', icon: Bot },
    { id: 'costs', label: 'Costs', icon: DollarSign },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'access', label: 'Access', icon: Gift },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className="min-h-screen bg-[#050505] text-white"
      style={{
        background:
          "radial-gradient(ellipse 110% 70% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 45%), radial-gradient(ellipse 90% 70% at 12% 22%, rgba(255,255,255,0.04) 0%, transparent 55%), #050505",
      }}
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-[#D4AF37]/25"
          >
            <ArrowLeft className="h-5 w-5 text-[#D4AF37]" />
          </Button>
          <div className="flex-1">
            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">
              Bhakti-Algorithms Control Plane
            </div>
            <h1 className="mt-2 text-[30px] leading-[1.05] font-black tracking-[-0.05em] text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)]">
              Admin System
            </h1>
            <p className="mt-2 text-white/60 leading-[1.6]">
              Orchestrate projects, tasks, content, and transmissions.
            </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card flex flex-wrap gap-1 h-auto p-2">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={[
                  "flex items-center gap-2 py-2.5 px-3.5 rounded-[18px]",
                  "text-[11px] font-extrabold tracking-[0.18em] uppercase",
                  "text-white/60 hover:text-white/85",
                  "data-[state=active]:bg-[#D4AF37]/14 data-[state=active]:border data-[state=active]:border-[#D4AF37]/28 data-[state=active]:text-[#D4AF37]",
                  "transition-all",
                ].join(" ")}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboardTab />
          </TabsContent>

          <TabsContent value="roadmap">
            <AdminRoadmapTab />
          </TabsContent>

          <TabsContent value="recording">
            <RecordingStudioTab />
          </TabsContent>

          <TabsContent value="projects">
            <AdminProjectsTab />
          </TabsContent>

          <TabsContent value="music">
            <MusicProjectsSection />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesProjectsSection />
          </TabsContent>

          <TabsContent value="workflows">
            <WorkflowTemplateManager />
          </TabsContent>

          <TabsContent value="tasks">
            <AdminTasksTab />
          </TabsContent>

          <TabsContent value="content">
            <AdminContentTab />
          </TabsContent>

          <TabsContent value="events">
            <AdminEventsTab />
          </TabsContent>

          <TabsContent value="challenges">
            <AdminChallengesTab />
          </TabsContent>

          <TabsContent value="live-events">
            <AdminLiveEventsTab />
          </TabsContent>

          <TabsContent value="creative-soul">
            <AdminCreativeSoulTab />
          </TabsContent>

          <TabsContent value="mql">
            <AdminMQLStrategiesTab />
          </TabsContent>

          <TabsContent value="costs">
            <AdminMonthlyCostsTab />
          </TabsContent>

          <TabsContent value="revenue">
            <AdminRevenueTab />
          </TabsContent>

          <TabsContent value="access">
            <AdminAccessGrantTab />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSystem;
