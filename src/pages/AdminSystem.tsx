import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderKanban, CheckSquare, FileText, Calendar, Settings, Users, LayoutDashboard, Music, GraduationCap } from 'lucide-react';
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

const AdminSystem = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const { isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isAuthLoading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Admin System</h1>
            <p className="text-muted-foreground">Manage projects, tasks, content, and more</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-2 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 py-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboardTab />
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

          <TabsContent value="tasks">
            <AdminTasksTab />
          </TabsContent>

          <TabsContent value="content">
            <AdminContentTab />
          </TabsContent>

          <TabsContent value="events">
            <AdminEventsTab />
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
