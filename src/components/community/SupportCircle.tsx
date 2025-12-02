import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Heart, HelpCircle, Video, Sparkles, Loader2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportRequest {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  recipient_name: string | null;
  is_resolved: boolean;
  support_count: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  user_supported?: boolean;
}

const categoryConfig = {
  question: { icon: HelpCircle, color: 'bg-blue-500/20 text-blue-400', label: 'supportCircle.question' },
  video_suggestion: { icon: Video, color: 'bg-purple-500/20 text-purple-400', label: 'supportCircle.videoSuggestion' },
  healing_blessing: { icon: Sparkles, color: 'bg-amber-500/20 text-amber-400', label: 'supportCircle.healingBlessing' },
};

const SupportCircle = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    category: 'question',
    title: '',
    content: '',
    recipient_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    // Fetch profiles
    const userIds = [...new Set(data?.map(r => r.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    // Fetch user's supports
    let userSupports: string[] = [];
    if (user) {
      const { data: supports } = await supabase
        .from('request_supports')
        .select('request_id')
        .eq('user_id', user.id);
      userSupports = supports?.map(s => s.request_id) || [];
    }

    const requestsWithData = data?.map(req => ({
      ...req,
      profile: profiles?.find(p => p.user_id === req.user_id),
      user_supported: userSupports.includes(req.id)
    })) || [];

    setRequests(requestsWithData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleCreateRequest = async () => {
    if (!user || !newRequest.title.trim() || !newRequest.content.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from('support_requests')
      .insert({
        user_id: user.id,
        category: newRequest.category,
        title: newRequest.title.trim(),
        content: newRequest.content.trim(),
        recipient_name: newRequest.category === 'healing_blessing' ? newRequest.recipient_name.trim() : null
      });

    if (error) {
      toast({ title: t('common.error'), description: 'Failed to create request', variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('supportCircle.requestCreated') });
      setNewRequest({ category: 'question', title: '', content: '', recipient_name: '' });
      setIsCreateOpen(false);
      fetchRequests();
    }
    setIsSubmitting(false);
  };

  const handleSupport = async (requestId: string) => {
    if (!user) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    if (request.user_supported) {
      await supabase.from('request_supports').delete().eq('request_id', requestId).eq('user_id', user.id);
      await supabase.from('support_requests').update({ support_count: request.support_count - 1 }).eq('id', requestId);
    } else {
      await supabase.from('request_supports').insert({ request_id: requestId, user_id: user.id });
      await supabase.from('support_requests').update({ support_count: request.support_count + 1 }).eq('id', requestId);
    }

    fetchRequests();
  };

  const filteredRequests = activeCategory === 'all' 
    ? requests 
    : requests.filter(r => r.category === activeCategory);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Request Button */}
      {user && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('supportCircle.createRequest')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('supportCircle.createRequest')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={newRequest.category === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewRequest({ ...newRequest, category: key })}
                    className="flex flex-col h-auto py-3 gap-1"
                  >
                    <config.icon className="h-4 w-4" />
                    <span className="text-xs">{t(config.label)}</span>
                  </Button>
                ))}
              </div>
              
              <Input
                placeholder={t('supportCircle.titlePlaceholder')}
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
              />

              {newRequest.category === 'healing_blessing' && (
                <Input
                  placeholder={t('supportCircle.recipientPlaceholder')}
                  value={newRequest.recipient_name}
                  onChange={(e) => setNewRequest({ ...newRequest, recipient_name: e.target.value })}
                />
              )}

              <Textarea
                placeholder={t('supportCircle.contentPlaceholder')}
                value={newRequest.content}
                onChange={(e) => setNewRequest({ ...newRequest, content: e.target.value })}
                rows={4}
              />

              <Button 
                onClick={handleCreateRequest} 
                disabled={!newRequest.title.trim() || !newRequest.content.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('supportCircle.submit')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">{t('supportCircle.all')}</TabsTrigger>
          <TabsTrigger value="question">
            <HelpCircle className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="video_suggestion">
            <Video className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="healing_blessing">
            <Sparkles className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('supportCircle.noRequests')}</p>
          </CardContent>
        </Card>
      ) : (
        filteredRequests.map((request) => {
          const config = categoryConfig[request.category as keyof typeof categoryConfig];
          const CategoryIcon = config.icon;
          
          return (
            <Card key={request.id} className="bg-card border-border">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {request.profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{request.profile?.full_name || 'Anonymous'}</p>
                      <Badge variant="secondary" className={config.color}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {t(config.label)}
                      </Badge>
                      {request.is_resolved && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          {t('supportCircle.resolved')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-2">{request.title}</h3>
                {request.category === 'healing_blessing' && request.recipient_name && (
                  <p className="text-sm text-primary mb-2">
                    🙏 {t('supportCircle.prayingFor')}: <span className="font-medium">{request.recipient_name}</span>
                  </p>
                )}
                <p className="text-foreground text-sm whitespace-pre-wrap mb-4">{request.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSupport(request.id)}
                    className={request.user_supported ? 'text-red-500' : 'text-muted-foreground'}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${request.user_supported ? 'fill-current' : ''}`} />
                    {request.support_count} {request.category === 'healing_blessing' 
                      ? t('supportCircle.praying') 
                      : t('supportCircle.supporting')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default SupportCircle;
