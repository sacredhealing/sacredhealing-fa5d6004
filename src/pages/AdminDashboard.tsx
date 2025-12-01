import React from 'react';
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
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const adminSections = [
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
    color: 'text-green-500',
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

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
