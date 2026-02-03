import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Check, AlertCircle, Map, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PathDayEditor from '@/components/admin/PathDayEditor';

interface SpiritualPath {
  id: string;
  title: string;
  slug: string;
  duration_days: number;
  cover_image_url: string | null;
}

interface PathDay {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  morning_meditation_id: string | null;
  evening_meditation_id: string | null;
  affirmation: string | null;
  journal_prompt: string | null;
  mantra_text: string | null;
  breathing_description: string | null;
  shc_reward: number;
  path_id: string;
}

interface Meditation {
  id: string;
  title: string;
  category: string;
}

const AdminPaths: React.FC = () => {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<SpiritualPath[]>([]);
  const [pathDays, setPathDays] = useState<PathDay[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [editingDay, setEditingDay] = useState<PathDay | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [savingCover, setSavingCover] = useState<string | null>(null);
  const [uploadingForPathId, setUploadingForPathId] = useState<string | null>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all paths
      const { data: pathsData, error: pathsError } = await supabase
        .from('spiritual_paths')
        .select('id, title, slug, duration_days, cover_image_url')
        .eq('is_active', true)
        .order('order_index');

      if (pathsError) throw pathsError;
      setPaths(pathsData || []);
      setCoverUrls(
        (pathsData || []).reduce((acc, p) => ({ ...acc, [p.id]: p.cover_image_url || '' }), {})
      );
      if (pathsData && pathsData.length > 0 && !selectedPath) {
        setSelectedPath(pathsData[0].id);
      }

      // Fetch all path days
      const { data: daysData, error: daysError } = await supabase
        .from('spiritual_path_days')
        .select('*')
        .order('day_number');

      if (daysError) throw daysError;
      setPathDays(daysData || []);

      // Fetch all meditations
      const { data: medsData, error: medsError } = await supabase
        .from('meditations')
        .select('id, title, category')
        .order('title');

      if (medsError) throw medsError;
      setMeditations(medsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPathDays = (pathId: string) => {
    return pathDays.filter(d => d.path_id === pathId).sort((a, b) => a.day_number - b.day_number);
  };

  const getDayCompleteness = (day: PathDay) => {
    const fields = [
      day.affirmation,
      day.journal_prompt,
      day.morning_meditation_id || day.evening_meditation_id,
    ];
    const filledCount = fields.filter(Boolean).length;
    return { filled: filledCount, total: 3 };
  };

  const getPathStats = (pathId: string) => {
    const days = getPathDays(pathId);
    const complete = days.filter(d => {
      const { filled, total } = getDayCompleteness(d);
      return filled === total;
    }).length;
    return { complete, total: days.length };
  };

  const handleEditDay = (day: PathDay) => {
    setEditingDay(day);
    setEditorOpen(true);
  };

  const handleSave = () => {
    fetchData();
  };

  const saveCoverImage = async (pathId: string) => {
    const url = coverUrls[pathId]?.trim() || null;
    setSavingCover(pathId);
    try {
      const { error } = await supabase
        .from('spiritual_paths')
        .update({ cover_image_url: url || null })
        .eq('id', pathId);
      if (error) throw error;
      toast.success('Cover image updated');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update cover image');
    } finally {
      setSavingCover(null);
    }
  };

  const handleCoverUpload = async (pathId: string, file: File) => {
    setSavingCover(pathId);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `paths/${pathId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('community-uploads')
        .upload(fileName, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('community-uploads').getPublicUrl(fileName);
      const { error } = await supabase
        .from('spiritual_paths')
        .update({ cover_image_url: data.publicUrl })
        .eq('id', pathId);
      if (error) throw error;
      setCoverUrls((prev) => ({ ...prev, [pathId]: data.publicUrl }));
      toast.success('Cover image updated');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload image');
    } finally {
      setSavingCover(null);
    }
  };

  const currentPath = paths.find(p => p.id === selectedPath);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading paths...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Spiritual Paths Manager</h1>
            <p className="text-muted-foreground">Edit daily content for all spiritual paths</p>
          </div>
        </div>

        {/* Path Tabs */}
        <Tabs value={selectedPath} onValueChange={setSelectedPath}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            {paths.map((path) => {
              const stats = getPathStats(path.id);
              return (
                <TabsTrigger 
                  key={path.id} 
                  value={path.id}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Map className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{path.title}</span>
                  <span className="sm:hidden">{path.title.split(' ')[0]}</span>
                  <Badge variant={stats.complete === stats.total ? "default" : "secondary"} className="text-xs">
                    {stats.complete}/{stats.total}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {paths.map((path) => (
            <TabsContent key={path.id} value={path.id} className="mt-6">
              {/* Path Info */}
              <Card className="p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{path.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {path.duration_days} days • {getPathStats(path.id).complete} of {getPathStats(path.id).total} days complete
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Cover image (shown on /paths)</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      {coverUrls[path.id] ? (
                        <img src={coverUrls[path.id]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Image URL (e.g. https://...)"
                        value={coverUrls[path.id] || ''}
                        onChange={(e) => setCoverUrls((prev) => ({ ...prev, [path.id]: e.target.value }))}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUploadingForPathId(path.id);
                            setTimeout(() => coverInputRef.current?.click(), 0);
                          }}
                          disabled={savingCover === path.id}
                        >
                          {savingCover === path.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                          <span className="ml-1">Upload</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveCoverImage(path.id)}
                          disabled={savingCover === path.id}
                        >
                          Save URL
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Meditations Summary */}
              <Card className="p-4 mb-6 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground mb-3">Path Meditations</h3>
                <div className="space-y-2">
                  {(() => {
                    const pathDays = getPathDays(path.id);
                    const morningMeds = pathDays
                      .filter(d => d.morning_meditation_id)
                      .map(d => meditations.find(m => m.id === d.morning_meditation_id))
                      .filter(Boolean);
                    const eveningMeds = pathDays
                      .filter(d => d.evening_meditation_id)
                      .map(d => meditations.find(m => m.id === d.evening_meditation_id))
                      .filter(Boolean);
                    const allMeds = [...new Set([...morningMeds, ...eveningMeds])];
                    
                    return allMeds.length > 0 ? (
                      <div className="space-y-1">
                        {allMeds.map((med) => (
                          <div key={med?.id} className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>🧘</span>
                            <span>{med?.title}</span>
                            <Badge variant="outline" className="text-xs">{med?.category}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No meditations assigned yet</p>
                    );
                  })()}
                </div>
              </Card>

              {/* Days Grid */}
              <div className="space-y-2">
                {getPathDays(path.id).map((day) => {
                  const completeness = getDayCompleteness(day);
                  const isComplete = completeness.filled === completeness.total;
                  
                  return (
                    <Card 
                      key={day.id} 
                      className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleEditDay(day)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            isComplete 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {day.day_number}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{day.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {day.affirmation && <Badge variant="outline" className="text-xs">Affirmation</Badge>}
                              {day.journal_prompt && <Badge variant="outline" className="text-xs">Journal</Badge>}
                              {(day.morning_meditation_id || day.evening_meditation_id) && (
                                <Badge variant="outline" className="text-xs">Meditation</Badge>
                              )}
                              {day.mantra_text && <Badge variant="outline" className="text-xs">Mantra</Badge>}
                              {day.breathing_description && <Badge variant="outline" className="text-xs">Breathing</Badge>}
                            </div>
                            {/* Show meditation titles if assigned */}
                            <div className="mt-2 space-y-1">
                              {day.morning_meditation_id && (
                                <div className="text-xs text-muted-foreground">
                                  🌅 {meditations.find(m => m.id === day.morning_meditation_id)?.title || 'Morning Meditation'}
                                </div>
                              )}
                              {day.evening_meditation_id && (
                                <div className="text-xs text-muted-foreground">
                                  🌙 {meditations.find(m => m.id === day.evening_meditation_id)?.title || 'Evening Meditation'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isComplete ? (
                            <Check className="w-5 h-5 text-primary" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && uploadingForPathId) {
              handleCoverUpload(uploadingForPathId, f);
              setUploadingForPathId(null);
            }
            e.target.value = '';
          }}
        />

        {/* Editor Dialog */}
        <PathDayEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          pathDay={editingDay}
          meditations={meditations}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default AdminPaths;
