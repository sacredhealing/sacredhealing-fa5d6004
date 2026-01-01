import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface IncomeStream {
  id: string;
  title: string;
  title_sv: string | null;
  title_es: string | null;
  title_no: string | null;
  description: string | null;
  description_sv: string | null;
  description_es: string | null;
  description_no: string | null;
  link: string;
  category: string;
  potential_earnings: string | null;
  potential_earnings_sv: string | null;
  potential_earnings_es: string | null;
  potential_earnings_no: string | null;
  is_featured: boolean;
  is_active: boolean;
  image_url: string | null;
  order_index: number;
}

const emptyStream = {
  title: '',
  title_sv: '',
  title_es: '',
  title_no: '',
  description: '',
  description_sv: '',
  description_es: '',
  description_no: '',
  link: '',
  category: 'other',
  potential_earnings: '',
  potential_earnings_sv: '',
  potential_earnings_es: '',
  potential_earnings_no: '',
  is_featured: false,
  is_active: true,
  image_url: '',
  order_index: 0,
};

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
];

const AdminIncomeStreams: React.FC = () => {
  const navigate = useNavigate();
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<IncomeStream | null>(null);
  const [formData, setFormData] = useState(emptyStream);
  const [activeLang, setActiveLang] = useState('en');

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    const { data, error } = await supabase
      .from('income_streams')
      .select('*')
      .order('order_index', { ascending: true });

    if (data) setStreams(data as unknown as IncomeStream[]);
    if (error) console.error('Error fetching streams:', error);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.link) {
      toast.error('Please fill in title and link');
      return;
    }

    const payload = {
      title: formData.title,
      title_sv: formData.title_sv || null,
      title_es: formData.title_es || null,
      title_no: formData.title_no || null,
      description: formData.description || null,
      description_sv: formData.description_sv || null,
      description_es: formData.description_es || null,
      description_no: formData.description_no || null,
      link: formData.link,
      category: formData.category,
      potential_earnings: formData.potential_earnings || null,
      potential_earnings_sv: formData.potential_earnings_sv || null,
      potential_earnings_es: formData.potential_earnings_es || null,
      potential_earnings_no: formData.potential_earnings_no || null,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      image_url: formData.image_url || null,
      order_index: formData.order_index,
    };

    if (editingStream) {
      const { error } = await supabase
        .from('income_streams')
        .update(payload)
        .eq('id', editingStream.id);

      if (error) {
        toast.error('Failed to update');
        return;
      }
      toast.success('Income stream updated');
    } else {
      const { error } = await supabase
        .from('income_streams')
        .insert({ ...payload, order_index: streams.length });

      if (error) {
        toast.error('Failed to create');
        return;
      }
      toast.success('Income stream created');
    }

    setIsDialogOpen(false);
    setEditingStream(null);
    setFormData(emptyStream);
    setActiveLang('en');
    fetchStreams();
  };

  const handleEdit = (stream: IncomeStream) => {
    setEditingStream(stream);
    setFormData({
      title: stream.title,
      title_sv: stream.title_sv || '',
      title_es: stream.title_es || '',
      title_no: stream.title_no || '',
      description: stream.description || '',
      description_sv: stream.description_sv || '',
      description_es: stream.description_es || '',
      description_no: stream.description_no || '',
      link: stream.link,
      category: stream.category,
      potential_earnings: stream.potential_earnings || '',
      potential_earnings_sv: stream.potential_earnings_sv || '',
      potential_earnings_es: stream.potential_earnings_es || '',
      potential_earnings_no: stream.potential_earnings_no || '',
      is_featured: stream.is_featured,
      is_active: stream.is_active,
      image_url: stream.image_url || '',
      order_index: stream.order_index,
    });
    setActiveLang('en');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income stream?')) return;

    const { error } = await supabase
      .from('income_streams')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Income stream deleted');
    fetchStreams();
  };

  const toggleActive = async (stream: IncomeStream) => {
    const { error } = await supabase
      .from('income_streams')
      .update({ is_active: !stream.is_active })
      .eq('id', stream.id);

    if (error) {
      toast.error('Failed to update');
      return;
    }
    fetchStreams();
  };

  const openNewDialog = () => {
    setEditingStream(null);
    setFormData(emptyStream);
    setActiveLang('en');
    setIsDialogOpen(true);
  };

  const getTranslationStatus = (stream: IncomeStream) => {
    const hasTranslations = stream.title_sv || stream.title_es || stream.title_no;
    const complete = stream.title_sv && stream.title_es && stream.title_no;
    return { hasTranslations, complete };
  };

  const getTitleField = () => activeLang === 'en' ? 'title' : `title_${activeLang}` as keyof typeof formData;
  const getDescField = () => activeLang === 'en' ? 'description' : `description_${activeLang}` as keyof typeof formData;
  const getEarningsField = () => activeLang === 'en' ? 'potential_earnings' : `potential_earnings_${activeLang}` as keyof typeof formData;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stream
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStream ? 'Edit Income Stream' : 'New Income Stream'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Language Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">Translations</Label>
                  </div>
                  <Tabs value={activeLang} onValueChange={setActiveLang}>
                    <TabsList className="grid grid-cols-4 w-full">
                      {languages.map((lang) => (
                        <TabsTrigger key={lang.code} value={lang.code} className="text-xs">
                          {lang.flag} {lang.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                {/* Translatable Fields */}
                <div className="space-y-2">
                  <Label>
                    Title {activeLang === 'en' ? '*' : `(${languages.find(l => l.code === activeLang)?.name})`}
                  </Label>
                  <Input
                    value={formData[getTitleField()] as string}
                    onChange={(e) => setFormData({ ...formData, [getTitleField()]: e.target.value })}
                    placeholder={activeLang === 'en' ? 'e.g., Affiliate Marketing Program' : `Translation for ${languages.find(l => l.code === activeLang)?.name}`}
                  />
                  {activeLang !== 'en' && formData.title && (
                    <p className="text-xs text-muted-foreground">English: {formData.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Description {activeLang !== 'en' ? `(${languages.find(l => l.code === activeLang)?.name})` : ''}
                  </Label>
                  <Textarea
                    value={formData[getDescField()] as string}
                    onChange={(e) => setFormData({ ...formData, [getDescField()]: e.target.value })}
                    placeholder={activeLang === 'en' ? 'Describe this income opportunity...' : `Translation for ${languages.find(l => l.code === activeLang)?.name}`}
                    rows={3}
                  />
                  {activeLang !== 'en' && formData.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">English: {formData.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Potential Earnings {activeLang !== 'en' ? `(${languages.find(l => l.code === activeLang)?.name})` : ''}
                  </Label>
                  <Input
                    value={formData[getEarningsField()] as string}
                    onChange={(e) => setFormData({ ...formData, [getEarningsField()]: e.target.value })}
                    placeholder={activeLang === 'en' ? 'e.g., $500-$5000/month' : `Translation for ${languages.find(l => l.code === activeLang)?.name}`}
                  />
                  {activeLang !== 'en' && formData.potential_earnings && (
                    <p className="text-xs text-muted-foreground">English: {formData.potential_earnings}</p>
                  )}
                </div>

                {/* Non-translatable fields (only show on English tab for clarity) */}
                {activeLang === 'en' && (
                  <>
                    <div className="space-y-2">
                      <Label>Link *</Label>
                      <Input
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="affiliate">Affiliate</SelectItem>
                            <SelectItem value="investment">Investment</SelectItem>
                            <SelectItem value="passive">Passive Income</SelectItem>
                            <SelectItem value="freelance">Freelance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_featured}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                        />
                        <Label>Featured</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                  </>
                )}

                <Button onClick={handleSave} className="w-full">
                  {editingStream ? 'Update' : 'Create'} Income Stream
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Manage Income Streams</h1>
        <p className="text-sm text-muted-foreground">
          Add and edit income opportunities • Supports EN, SV, ES, NO
        </p>
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {streams.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No income streams yet. Add your first one!</p>
            </CardContent>
          </Card>
        ) : (
          streams.map((stream) => {
            const { complete, hasTranslations } = getTranslationStatus(stream);
            return (
              <Card 
                key={stream.id} 
                className={`bg-card/50 ${!stream.is_active ? 'opacity-50' : ''}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium truncate">{stream.title}</h3>
                        {stream.is_featured && (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
                            Featured
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {stream.category}
                        </Badge>
                        {hasTranslations && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${complete ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}`}
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            {complete ? '4 langs' : 'partial'}
                          </Badge>
                        )}
                      </div>
                      {stream.potential_earnings && (
                        <p className="text-sm text-primary">{stream.potential_earnings}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-1">{stream.link}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(stream)}
                      >
                        <div className={`w-2 h-2 rounded-full ${stream.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(stream)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(stream.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminIncomeStreams;
