import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Music, DollarSign, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  content_key: string;
  content_type: string;
  title: string | null;
  content: string | null;
  metadata: any;
  language: string;
}

const AdminAffirmation: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from('affirmation_content')
      .select('*')
      .eq('language', 'en')
      .order('content_key');

    if (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content',
        variant: 'destructive'
      });
    } else {
      setContent(data || []);
      // Initialize edited content with current values
      const initial: Record<string, string> = {};
      data?.forEach(item => {
        initial[item.content_key] = item.content || '';
      });
      setEditedContent(initial);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(editedContent).map(([key, value]) => ({
        content_key: key,
        content: value
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('affirmation_content')
          .update({ content: update.content })
          .eq('content_key', update.content_key)
          .eq('language', 'en');

        if (error) throw error;
      }

      toast({
        title: 'Saved!',
        description: 'All changes have been saved successfully'
      });
      
      fetchContent();
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateContent = (key: string, value: string) => {
    setEditedContent(prev => ({ ...prev, [key]: value }));
  };

  const getContentValue = (key: string) => {
    return editedContent[key] ?? content.find(c => c.content_key === key)?.content ?? '';
  };

  const getContentItem = (key: string) => {
    return content.find(c => c.content_key === key);
  };

  const updatePricing = async (key: string, price: string, stripeId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('affirmation_content')
        .update({ 
          content: price,
          metadata: { currency: 'SEK', stripe_price_id: stripeId }
        })
        .eq('content_key', key)
        .eq('language', 'en');

      if (error) throw error;

      toast({
        title: 'Pricing updated!',
        description: 'Price has been saved successfully'
      });
      
      fetchContent();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                Affirmation Soundtrack
              </h1>
              <p className="text-muted-foreground">Manage page content and pricing</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">
              <FileText className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="packages">
              <Sparkles className="w-4 h-4 mr-2" />
              Packages
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Hero Section */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Hero Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Badge Text</label>
                  <Input
                    value={getContentValue('badge')}
                    onChange={(e) => updateContent('badge', e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Title</label>
                  <Input
                    value={getContentValue('title')}
                    onChange={(e) => updateContent('title', e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Subtitle</label>
                  <Input
                    value={getContentValue('subtitle')}
                    onChange={(e) => updateContent('subtitle', e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Description</label>
                  <Textarea
                    value={getContentValue('description')}
                    onChange={(e) => updateContent('description', e.target.value)}
                    className="bg-muted/50 min-h-[100px]"
                  />
                </div>
              </div>
            </Card>

            {/* What's Included */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">What's Included</h3>
              <div className="space-y-6">
                {/* Affirmations */}
                <div className="space-y-2">
                  <Input
                    value={getContentValue('included_affirmations_title')}
                    onChange={(e) => updateContent('included_affirmations_title', e.target.value)}
                    placeholder="Title"
                    className="bg-muted/50 font-medium"
                  />
                  <Textarea
                    value={getContentValue('included_affirmations_desc')}
                    onChange={(e) => updateContent('included_affirmations_desc', e.target.value)}
                    placeholder="Description"
                    className="bg-muted/50"
                  />
                </div>
                {/* Frequencies */}
                <div className="space-y-2">
                  <Input
                    value={getContentValue('included_frequencies_title')}
                    onChange={(e) => updateContent('included_frequencies_title', e.target.value)}
                    placeholder="Title"
                    className="bg-muted/50 font-medium"
                  />
                  <Textarea
                    value={getContentValue('included_frequencies_desc')}
                    onChange={(e) => updateContent('included_frequencies_desc', e.target.value)}
                    placeholder="Description"
                    className="bg-muted/50"
                  />
                </div>
                {/* Binaural */}
                <div className="space-y-2">
                  <Input
                    value={getContentValue('included_binaural_title')}
                    onChange={(e) => updateContent('included_binaural_title', e.target.value)}
                    placeholder="Title"
                    className="bg-muted/50 font-medium"
                  />
                  <Textarea
                    value={getContentValue('included_binaural_desc')}
                    onChange={(e) => updateContent('included_binaural_desc', e.target.value)}
                    placeholder="Description"
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Benefits</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Input
                    key={i}
                    value={getContentValue(`benefit_${i}`)}
                    onChange={(e) => updateContent(`benefit_${i}`, e.target.value)}
                    placeholder={`Benefit ${i}`}
                    className="bg-muted/50"
                  />
                ))}
              </div>
            </Card>

            {/* How It Works */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">How It Works</h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                        {i}
                      </span>
                      <Input
                        value={getContentValue(`step_${i}_title`)}
                        onChange={(e) => updateContent(`step_${i}_title`, e.target.value)}
                        placeholder={`Step ${i} Title`}
                        className="bg-muted/50 font-medium"
                      />
                    </div>
                    <Textarea
                      value={getContentValue(`step_${i}_desc`)}
                      onChange={(e) => updateContent(`step_${i}_desc`, e.target.value)}
                      placeholder={`Step ${i} Description`}
                      className="bg-muted/50 ml-8"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Footer */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Footer CTA</h3>
              <div className="space-y-3">
                <Input
                  value={getContentValue('footer_title')}
                  onChange={(e) => updateContent('footer_title', e.target.value)}
                  placeholder="Footer Title"
                  className="bg-muted/50"
                />
                <Textarea
                  value={getContentValue('footer_desc')}
                  onChange={(e) => updateContent('footer_desc', e.target.value)}
                  placeholder="Footer Description"
                  className="bg-muted/50"
                />
              </div>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            {/* Basic Package Pricing */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Basic Package Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Price (SEK)</label>
                  <Input
                    type="number"
                    value={getContentValue('basic_price')}
                    onChange={(e) => updateContent('basic_price', e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Stripe Price ID</label>
                  <Input
                    value={getContentItem('basic_price')?.metadata?.stripe_price_id || ''}
                    onChange={(e) => {
                      const item = getContentItem('basic_price');
                      if (item) {
                        updatePricing('basic_price', getContentValue('basic_price'), e.target.value);
                      }
                    }}
                    placeholder="price_xxx"
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </Card>

            {/* Ultimate Package Pricing */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ultimate Package Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Price (SEK)</label>
                  <Input
                    type="number"
                    value={getContentValue('ultimate_price')}
                    onChange={(e) => updateContent('ultimate_price', e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Stripe Price ID</label>
                  <Input
                    value={getContentItem('ultimate_price')?.metadata?.stripe_price_id || ''}
                    onChange={(e) => {
                      const item = getContentItem('ultimate_price');
                      if (item) {
                        updatePricing('ultimate_price', getContentValue('ultimate_price'), e.target.value);
                      }
                    }}
                    placeholder="price_xxx"
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-muted-foreground mb-1">Savings Text</label>
                <Input
                  value={getContentValue('ultimate_savings')}
                  onChange={(e) => updateContent('ultimate_savings', e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            {/* Basic Package */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Basic Package Content</h3>
              <div className="space-y-3">
                <Input
                  value={getContentValue('basic_title')}
                  onChange={(e) => updateContent('basic_title', e.target.value)}
                  placeholder="Package Title"
                  className="bg-muted/50"
                />
                <Input
                  value={getContentValue('basic_cta')}
                  onChange={(e) => updateContent('basic_cta', e.target.value)}
                  placeholder="Button Text"
                  className="bg-muted/50"
                />
              </div>
            </Card>

            {/* Ultimate Package */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ultimate Package Content</h3>
              <div className="space-y-3">
                <Input
                  value={getContentValue('ultimate_title')}
                  onChange={(e) => updateContent('ultimate_title', e.target.value)}
                  placeholder="Package Title"
                  className="bg-muted/50"
                />
                <Input
                  value={getContentValue('ultimate_subtitle')}
                  onChange={(e) => updateContent('ultimate_subtitle', e.target.value)}
                  placeholder="Subtitle"
                  className="bg-muted/50"
                />
                <Input
                  value={getContentValue('ultimate_cta')}
                  onChange={(e) => updateContent('ultimate_cta', e.target.value)}
                  placeholder="Button Text"
                  className="bg-muted/50"
                />
                <Input
                  value={getContentValue('ultimate_includes')}
                  onChange={(e) => updateContent('ultimate_includes', e.target.value)}
                  placeholder="Includes text"
                  className="bg-muted/50"
                />
              </div>
            </Card>

            {/* Ultimate Package Items */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ultimate Package - Soundtrack Section</h3>
              <div className="space-y-3">
                <Input
                  value={getContentValue('ultimate_soundtrack_title')}
                  onChange={(e) => updateContent('ultimate_soundtrack_title', e.target.value)}
                  placeholder="Section Title"
                  className="bg-muted/50 font-medium"
                />
                {[1, 2, 3].map(i => (
                  <Input
                    key={i}
                    value={getContentValue(`ultimate_soundtrack_item${i}`)}
                    onChange={(e) => updateContent(`ultimate_soundtrack_item${i}`, e.target.value)}
                    placeholder={`Item ${i}`}
                    className="bg-muted/50"
                  />
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ultimate Package - Healing Section</h3>
              <div className="space-y-3">
                <Input
                  value={getContentValue('ultimate_healing_title')}
                  onChange={(e) => updateContent('ultimate_healing_title', e.target.value)}
                  placeholder="Section Title"
                  className="bg-muted/50 font-medium"
                />
                {[1, 2, 3].map(i => (
                  <Input
                    key={i}
                    value={getContentValue(`ultimate_healing_item${i}`)}
                    onChange={(e) => updateContent(`ultimate_healing_item${i}`, e.target.value)}
                    placeholder={`Item ${i}`}
                    className="bg-muted/50"
                  />
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ultimate Package - Session Section</h3>
              <div className="space-y-3">
                <Input
                  value={getContentValue('ultimate_session_title')}
                  onChange={(e) => updateContent('ultimate_session_title', e.target.value)}
                  placeholder="Section Title"
                  className="bg-muted/50 font-medium"
                />
                {[1, 2, 3].map(i => (
                  <Input
                    key={i}
                    value={getContentValue(`ultimate_session_item${i}`)}
                    onChange={(e) => updateContent(`ultimate_session_item${i}`, e.target.value)}
                    placeholder={`Item ${i}`}
                    className="bg-muted/50"
                  />
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAffirmation;
