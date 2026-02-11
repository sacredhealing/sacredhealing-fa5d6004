import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen } from 'lucide-react';
import { DiaryType } from '@/features/community/diaryTypes';

interface AdminDiaryCreatorProps {
  onDiaryCreated: () => void;
}

const AdminDiaryCreator = ({ onDiaryCreated }: AdminDiaryCreatorProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [diaryType, setDiaryType] = useState<DiaryType>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !title.trim() || !body.trim()) {
      toast({ 
        title: t('community.diary.error'), 
        description: t('community.diary.fillAllFields'),
        variant: 'destructive' 
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content: body.trim(),
          post_type: 'diary',
          diary_type: diaryType,
          diary_title: title.trim(),
        });

      if (error) throw error;

      toast({ 
        title: t('community.diary.success'), 
        description: t('community.diary.createdSuccessfully') 
      });
      
      // Reset form
      setTitle('');
      setBody('');
      setDiaryType('daily');
      
      onDiaryCreated();
    } catch (error) {
      console.error('Error creating diary entry:', error);
      toast({ 
        title: t('community.diary.error'), 
        description: t('community.diary.failedToCreate'),
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-400" />
          {t('community.diary.createEntry', 'Create Diary Entry')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Diary Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('community.diary.type', 'Type')}
            </label>
            <Select value={diaryType} onValueChange={(value) => setDiaryType(value as DiaryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('community.diary.daily', 'Daily')}</SelectItem>
                <SelectItem value="weekly">{t('community.diary.weekly', 'Weekly')}</SelectItem>
                <SelectItem value="monthly">{t('community.diary.monthly', 'Monthly')}</SelectItem>
                <SelectItem value="yearly">{t('community.diary.yearly', 'Yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('community.diary.title', 'Title')}
            </label>
            <Input
              placeholder={t('community.diary.titlePlaceholder', 'e.g., Today\'s Note, This Week\'s Reflection...')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Body Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('community.diary.content', 'Content')}
            </label>
            <Textarea
              placeholder={t('community.diary.contentPlaceholder', 'Share what you\'re doing, reflections, updates...')}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={!title.trim() || !body.trim() || isSubmitting}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <BookOpen className="h-4 w-4 mr-2" />
              )}
              {t('community.diary.post', 'Post Diary Entry')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDiaryCreator;
