import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  content_key: string;
  content_type: string;
  title: string | null;
  content: string;
  metadata: unknown;
}

const AdminContent: React.FC = () => {
  const { toast } = useToast();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('content_key');

    if (data) {
      setContents(data as ContentItem[]);
      const initial: Record<string, string> = {};
      data.forEach((item: ContentItem) => {
        initial[item.content_key] = item.content;
      });
      setEditedContent(initial);
    }
    if (error) console.error('Error fetching content:', error);
    setIsLoading(false);
  };

  const handleSave = async (contentKey: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('site_content')
      .update({ content: editedContent[contentKey] })
      .eq('content_key', contentKey);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Content updated successfully' });
    }
    setIsSaving(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    let hasError = false;

    for (const [key, value] of Object.entries(editedContent)) {
      const { error } = await supabase
        .from('site_content')
        .update({ content: value })
        .eq('content_key', key);

      if (error) {
        hasError = true;
        console.error('Error saving:', key, error);
      }
    }

    if (hasError) {
      toast({ title: 'Error', description: 'Some content failed to save', variant: 'destructive' });
    } else {
      toast({ title: 'All Saved!', description: 'All content updated successfully' });
    }
    setIsSaving(false);
  };

  const healingContent = contents.filter(c => c.content_key.startsWith('healing_'));
  const dashboardContent = contents.filter(c => c.content_key.startsWith('dashboard_'));
  const otherContent = contents.filter(c => !c.content_key.startsWith('healing_') && !c.content_key.startsWith('dashboard_'));

  const renderContentEditor = (item: ContentItem) => {
    const isLongText = item.content.length > 100 || item.content_key.includes('intro') || item.content_key.includes('text');
    
    return (
      <div key={item.id} className="space-y-2 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{item.title || item.content_key}</Label>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleSave(item.content_key)}
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Key: {item.content_key}</p>
        
        {isLongText ? (
          <Textarea
            value={editedContent[item.content_key] || ''}
            onChange={(e) => setEditedContent(prev => ({ ...prev, [item.content_key]: e.target.value }))}
            className="min-h-[100px]"
          />
        ) : (
          <Input
            value={editedContent[item.content_key] || ''}
            onChange={(e) => setEditedContent(prev => ({ ...prev, [item.content_key]: e.target.value }))}
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Site Content Editor</h1>
              <p className="text-muted-foreground">Edit text throughout the app</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchContent}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save All Changes
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="healing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="healing">Healing Page</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="healing" className="mt-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Healing Page Content</h2>
              </div>
              
              {/* Language Tabs for Healing */}
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                  <TabsTrigger value="sv">🇸🇪 Swedish</TabsTrigger>
                  <TabsTrigger value="es">🇪🇸 Spanish</TabsTrigger>
                  <TabsTrigger value="no">🇳🇴 Norwegian</TabsTrigger>
                </TabsList>

                {['en', 'sv', 'es', 'no'].map(lang => (
                  <TabsContent key={lang} value={lang} className="space-y-6">
                    {/* Hero Section */}
                    <div className="border-b pb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Hero Section</h3>
                      <div className="space-y-4">
                        {healingContent.filter(c => c.content_key === `healing_hero_title_${lang}`).map(renderContentEditor)}
                        {healingContent.filter(c => c.content_key === `healing_hero_subtitle_${lang}`).map(renderContentEditor)}
                      </div>
                    </div>

                    {/* About Section */}
                    <div className="border-b pb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">About the Healing</h3>
                      <div className="space-y-4">
                        {healingContent.filter(c => c.content_key === `healing_about_title_${lang}`).map(renderContentEditor)}
                        {healingContent.filter(c => c.content_key === `healing_about_text_${lang}`).map(renderContentEditor)}
                      </div>
                    </div>

                    {/* Health Section */}
                    <div className="border-b pb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Health & Vitality</h3>
                      <div className="space-y-4">
                        {healingContent.filter(c => c.content_key === `healing_health_title_${lang}`).map(renderContentEditor)}
                        {healingContent.filter(c => c.content_key === `healing_health_text_${lang}`).map(renderContentEditor)}
                      </div>
                    </div>

                    {/* Mental Section */}
                    <div className="border-b pb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Mental & Emotional Balance</h3>
                      <div className="space-y-4">
                        {healingContent.filter(c => c.content_key === `healing_mental_title_${lang}`).map(renderContentEditor)}
                        {healingContent.filter(c => c.content_key === `healing_mental_text_${lang}`).map(renderContentEditor)}
                      </div>
                    </div>

                    {/* Spiritual Section */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Spiritual Transformation</h3>
                      <div className="space-y-4">
                        {healingContent.filter(c => c.content_key === `healing_spiritual_title_${lang}`).map(renderContentEditor)}
                        {healingContent.filter(c => c.content_key === `healing_spiritual_text_${lang}`).map(renderContentEditor)}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Dashboard Content</h2>
              </div>
              
              <div className="space-y-4">
                {dashboardContent.length > 0 ? (
                  dashboardContent.map(renderContentEditor)
                ) : (
                  <p className="text-muted-foreground text-center py-8">No dashboard content configured yet</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="other" className="mt-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Other Content</h2>
              </div>
              
              <div className="space-y-4">
                {otherContent.length > 0 ? (
                  otherContent.map(renderContentEditor)
                ) : (
                  <p className="text-muted-foreground text-center py-8">No other content configured</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add New Content */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Need More Content Fields?</h2>
          <p className="text-muted-foreground text-sm">
            To add new editable content fields, you can insert them directly into the database 
            using the Cloud panel, or ask me to add specific content fields for other pages.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AdminContent;
