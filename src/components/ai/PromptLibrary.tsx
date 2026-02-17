import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, FileText, Calendar, Briefcase, Eye, Workflow, Heart, 
  Sparkles, BookOpen, HeartPulse, Utensils, HeartHandshake, 
  GraduationCap, Search, Loader2, Zap, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface AITemplate {
  id: string;
  category: string;
  label_en: string;
  label_sv: string;
  mega_prompt: string;
  tone_filter: 'vishwananda' | 'sri_yukteswar' | 'robbins';
  icon_name: string | null;
  is_featured: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  FileEdit: FileText,
  FileText,
  Share2: FileText,
  Calendar,
  Briefcase,
  FileCheck: FileText,
  TrendingUp: Briefcase,
  Eye,
  Megaphone: Eye,
  ShoppingBag: Briefcase,
  Workflow,
  Clock: Calendar,
  CheckSquare: Calendar,
  Heart,
  Sparkles,
  BookOpen,
  HeartPulse,
  Utensils,
  HeartHandshake,
  Handshake: HeartHandshake,
  GraduationCap,
  BookMarked: BookOpen,
};

const TONE_DESCRIPTIONS = {
  vishwananda: {
    en: 'Heart-Centered Love',
    sv: 'Hjärtcentrerad Kärlek',
    icon: Heart,
    color: 'text-pink-500'
  },
  sri_yukteswar: {
    en: 'Logical Wisdom',
    sv: 'Logisk Visdom',
    icon: BookOpen,
    color: 'text-blue-500'
  },
  robbins: {
    en: 'Action Energy',
    sv: 'Handlingsenergi',
    icon: Zap,
    color: 'text-yellow-500'
  }
};

export const PromptLibrary: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AITemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTone, setSelectedTone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userTonePreference, setUserTonePreference] = useState<'vishwananda' | 'sri_yukteswar' | 'robbins'>('vishwananda');

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('ai_templates')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('category', { ascending: true });

      if (!error && data) {
        setTemplates(data);
        setFilteredTemplates(data);
      }
      setIsLoading(false);
    };

    fetchTemplates();
  }, []);

  // Fetch user tone preference
  useEffect(() => {
    if (!user) return;

    const fetchPreference = async () => {
      const { data } = await supabase
        .from('ai_user_preferences')
        .select('default_tone_filter')
        .eq('user_id', user.id)
        .single();

      if (data?.default_tone_filter) {
        setUserTonePreference(data.default_tone_filter as any);
      }
    };

    fetchPreference();
  }, [user]);

  // Filter templates
  useEffect(() => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedTone !== 'all') {
      filtered = filtered.filter(t => t.tone_filter === selectedTone);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.label_en.toLowerCase().includes(query) ||
        t.label_sv.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, selectedTone, searchQuery]);

  const handleTemplateClick = async (template: AITemplate) => {
    if (!user) {
      toast.error(t('message_error', 'Please sign in to use templates'));
      return;
    }

    // Apply tone filter to mega prompt
    const tonePrefix = getTonePrefix(template.tone_filter);
    const fullPrompt = `${tonePrefix}\n\n${template.mega_prompt}`;

    // Here you would typically invoke your AI service (OpenAI, Gemini, etc.)
    // For now, we'll copy to clipboard and show a message
    await navigator.clipboard.writeText(fullPrompt);
    
    // Update usage count
    await supabase
      .from('ai_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', template.id);

    toast.success(t('template_copied', 'Template copied! Ready to use with your AI assistant.'));
  };

  const getTonePrefix = (tone: string): string => {
    const descriptions = TONE_DESCRIPTIONS[tone as keyof typeof TONE_DESCRIPTIONS];
    if (!descriptions) return '';
    
    const isSv = language === 'sv';
    const toneName = isSv ? descriptions.sv : descriptions.en;
    
    switch (tone) {
      case 'vishwananda':
        return isSv 
          ? `Du är en AI-assistent som kanalerar kärleken från Vishwananda. Varje svar ska komma från hjärtat, vara varmt och medkännande. Använd språk som skapar anslutning och helande.`
          : `You are an AI assistant channeling the love of Vishwananda. Every response should come from the heart, be warm and compassionate. Use language that creates connection and healing.`;
      case 'sri_yukteswar':
        return isSv
          ? `Du är en AI-assistent som kanalerar visdomen från Sri Yukteswar. Varje svar ska vara logiskt, precist och grundat i visdom. Använd klar struktur och analytisk tänkande medan du behåller andlig djup.`
          : `You are an AI assistant channeling the wisdom of Sri Yukteswar. Every response should be logical, precise, and grounded in wisdom. Use clear structure and analytical thinking while maintaining spiritual depth.`;
      case 'robbins':
        return isSv
          ? `Du är en AI-assistent som kanalerar handlingsenergin från Tony Robbins. Varje svar ska vara action-oriented, motiverande och fokuserat på resultat. Använd 10X-filosofin: tänk större, agera snabbare, leverera mer.`
          : `You are an AI assistant channeling the action energy of Tony Robbins. Every response should be action-oriented, motivating, and focused on results. Use the 10X philosophy: think bigger, act faster, deliver more.`;
      default:
        return '';
    }
  };

  const categories = [
    { id: 'all', label: t('all_categories', 'All Categories'), icon: Filter },
    { id: 'Writing', label: t('category_writing', 'Writing'), icon: FileText },
    { id: 'Business', label: t('category_business', 'Business'), icon: Briefcase },
    { id: 'Marketing', label: t('category_marketing', 'Marketing'), icon: Eye },
    { id: 'Productivity', label: t('category_productivity', 'Productivity'), icon: Workflow },
    { id: 'Spiritual', label: t('category_spiritual', 'Spiritual'), icon: Heart },
    { id: 'Health', label: t('category_health', 'Health'), icon: HeartPulse },
    { id: 'Relationships', label: t('category_relationships', 'Relationships'), icon: HeartHandshake },
    { id: 'Education', label: t('category_education', 'Education'), icon: GraduationCap },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('prompt_library', 'Prompt Library')}</h2>
          <p className="text-muted-foreground mt-1">{t('prompt_library_desc', 'Single-click templates for instant productivity')}</p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {filteredTemplates.length} {t('templates', 'templates')}
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_templates', 'Search templates...')}
              className="h-12 text-base"
              style={{ fontSize: '1rem', minHeight: '48px' }}
            />
          </div>
          <Select value={selectedTone} onValueChange={setSelectedTone}>
            <SelectTrigger className="w-48 h-12 text-base" style={{ fontSize: '1rem', minHeight: '48px' }}>
              <SelectValue placeholder={t('filter_by_tone', 'Filter by Tone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_tones', 'All Tones')}</SelectItem>
              <SelectItem value="vishwananda">{TONE_DESCRIPTIONS.vishwananda[language === 'sv' ? 'sv' : 'en']}</SelectItem>
              <SelectItem value="sri_yukteswar">{TONE_DESCRIPTIONS.sri_yukteswar[language === 'sv' ? 'sv' : 'en']}</SelectItem>
              <SelectItem value="robbins">{TONE_DESCRIPTIONS.robbins[language === 'sv' ? 'sv' : 'en']}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-5 lg:grid-cols-9 gap-2 h-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex flex-col items-center gap-1 h-auto py-3 px-2 text-sm"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{cat.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t('no_templates_found', 'No templates found')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = template.icon_name ? ICON_MAP[template.icon_name] || FileText : FileText;
            const toneDesc = TONE_DESCRIPTIONS[template.tone_filter];
            const ToneIcon = toneDesc.icon;
            const label = language === 'sv' ? template.label_sv : template.label_en;

            return (
              <Card
                key={template.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/50"
                onClick={() => handleTemplateClick(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">{label}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    {template.is_featured && (
                      <Badge variant="default" className="text-xs">⭐</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ToneIcon className={`h-4 w-4 ${toneDesc.color}`} />
                    <span>{toneDesc[language === 'sv' ? 'sv' : 'en']}</span>
                  </div>
                  <Button
                    className="w-full mt-4 h-12 text-base font-semibold"
                    style={{ fontSize: '1rem', minHeight: '48px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateClick(template);
                    }}
                  >
                    {t('use_template', 'Use Template')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
