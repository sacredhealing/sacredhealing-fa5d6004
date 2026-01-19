import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, Trash2, Music, Loader2, Check, AlertCircle, 
  FolderOpen, RefreshCw, X, FileAudio
} from 'lucide-react';

interface StyleSound {
  id: string;
  style_id: string;
  name: string;
  description: string | null;
  file_path: string;
  is_active: boolean;
  created_at: string;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
}

const MEDITATION_STYLES = [
  { id: 'indian', name: 'Indian / Sitar', folder: 'indian' },
  { id: 'shamanic', name: 'Shamanic', folder: 'shamanic' },
  { id: 'mystic', name: 'Mystic', folder: 'mystic' },
  { id: 'tibetan', name: 'Tibetan', folder: 'tibetan' },
  { id: 'sufi', name: 'Sufi', folder: 'sufi' },
  { id: 'zen', name: 'Zen', folder: 'zen' },
  { id: 'nature', name: 'Nature', folder: 'nature' },
  { id: 'ocean', name: 'Ocean', folder: 'ocean' },
  { id: 'sound_bath', name: 'Sound Bath', folder: 'sound_bath' },
  { id: 'chakra', name: 'Chakra', folder: 'chakra' },
  { id: 'higher_consciousness', name: 'Higher Consciousness', folder: 'higher_consciousness' },
  { id: 'relaxing', name: 'Relaxing', folder: 'relaxing' },
  { id: 'forest', name: 'Forest', folder: 'forest' },
  { id: 'breath_focus', name: 'Breath Focus', folder: 'breath_focus' },
  { id: 'kundalini', name: 'Kundalini', folder: 'kundalini' },
];

const BUCKET_NAME = 'creative-soul-library';

export default function MeditationStyleSoundsManager() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [styleSounds, setStyleSounds] = useState<StyleSound[]>([]);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [existingFilePaths, setExistingFilePaths] = useState<Set<string>>(new Set());

  // Fetch sounds for selected style
  const fetchStyleSounds = useCallback(async (styleId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('meditation_style_sounds')
        .select('*')
        .eq('style_id', styleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStyleSounds(data || []);
    } catch (error) {
      console.error('Error fetching style sounds:', error);
      toast.error('Failed to fetch sounds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch storage files for selected style folder
  const fetchStorageFiles = useCallback(async (styleId: string) => {
    try {
      const style = MEDITATION_STYLES.find(s => s.id === styleId);
      if (!style) return;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(style.folder, { 
          limit: 500,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      
      // Filter out folders and get only audio files
      const audioFiles = (data || []).filter(file => 
        !file.id.endsWith('/') && 
        (file.name.endsWith('.wav') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a'))
      );
      
      setStorageFiles(audioFiles);
    } catch (error) {
      console.error('Error fetching storage files:', error);
    }
  }, []);

  // Fetch all existing file paths to prevent duplicates
  const fetchExistingFilePaths = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('meditation_style_sounds')
        .select('file_path');

      if (error) throw error;
      
      const paths = new Set<string>((data || []).map((s: any) => s.file_path.toLowerCase()));
      setExistingFilePaths(paths);
    } catch (error) {
      console.error('Error fetching existing paths:', error);
    }
  }, []);

  useEffect(() => {
    fetchExistingFilePaths();
  }, [fetchExistingFilePaths]);

  useEffect(() => {
    if (selectedStyle) {
      fetchStyleSounds(selectedStyle);
      fetchStorageFiles(selectedStyle);
      setSelectedFiles(new Set());
    }
  }, [selectedStyle, fetchStyleSounds, fetchStorageFiles]);

  // Check if file already exists in storage
  const checkDuplicateInStorage = async (fileName: string, styleFolder: string): Promise<boolean> => {
    try {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .list(styleFolder, { search: fileName });
      
      return (data || []).some(f => f.name.toLowerCase() === fileName.toLowerCase());
    } catch {
      return false;
    }
  };

  // Handle file upload with duplicate prevention
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!selectedStyle) {
      toast.error('Please select a meditation style first');
      return;
    }

    const style = MEDITATION_STYLES.find(s => s.id === selectedStyle);
    if (!style) return;

    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(f => 
      f.name.endsWith('.wav') || f.name.endsWith('.mp3') || f.name.endsWith('.m4a')
    );

    if (audioFiles.length === 0) {
      toast.error('Please select audio files (.wav, .mp3, .m4a)');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: audioFiles.length });

    let uploaded = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const file of audioFiles) {
      try {
        // Check for duplicate in storage
        const isDuplicate = await checkDuplicateInStorage(file.name, style.folder);
        if (isDuplicate) {
          skipped++;
          setUploadProgress({ current: uploaded + skipped, total: audioFiles.length });
          continue;
        }

        // Check if path already in database
        const filePath = `${style.folder}/${file.name}`;
        if (existingFilePaths.has(filePath.toLowerCase())) {
          skipped++;
          setUploadProgress({ current: uploaded + skipped, total: audioFiles.length });
          continue;
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, { upsert: false });

        if (uploadError) {
          if (uploadError.message.includes('already exists')) {
            skipped++;
          } else {
            errors.push(`${file.name}: ${uploadError.message}`);
          }
          setUploadProgress({ current: uploaded + skipped, total: audioFiles.length });
          continue;
        }

        // Add to database
        const soundName = file.name.replace(/\.(wav|mp3|m4a)$/i, '').replace(/_/g, ' ');
        const { error: dbError } = await (supabase as any)
          .from('meditation_style_sounds')
          .insert({
            style_id: selectedStyle,
            name: soundName,
            file_path: filePath,
            is_active: true,
          });

        if (dbError) {
          errors.push(`${file.name}: ${dbError.message}`);
        } else {
          uploaded++;
          // Update existing paths set
          setExistingFilePaths(prev => new Set([...prev, filePath.toLowerCase()]));
        }

        setUploadProgress({ current: uploaded + skipped, total: audioFiles.length });
      } catch (error: any) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    // Refresh data
    await fetchStyleSounds(selectedStyle);
    await fetchStorageFiles(selectedStyle);
    await fetchExistingFilePaths();

    // Show results
    if (uploaded > 0) {
      toast.success(`Successfully uploaded ${uploaded} file(s)`);
    }
    if (skipped > 0) {
      toast.info(`Skipped ${skipped} duplicate file(s)`);
    }
    if (errors.length > 0) {
      toast.error(`Failed to upload ${errors.length} file(s)`);
      console.error('Upload errors:', errors);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (soundId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(soundId)) {
        newSet.delete(soundId);
      } else {
        newSet.add(soundId);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedFiles.size === styleSounds.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(styleSounds.map(s => s.id)));
    }
  };

  // Delete selected files
  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) {
      toast.error('No files selected');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFiles.size} file(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    let deleted = 0;
    const errors: string[] = [];

    for (const soundId of selectedFiles) {
      const sound = styleSounds.find(s => s.id === soundId);
      if (!sound) continue;

      try {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([sound.file_path]);

        if (storageError) {
          console.warn('Storage delete warning:', storageError);
        }

        // Delete from database
        const { error: dbError } = await (supabase as any)
          .from('meditation_style_sounds')
          .delete()
          .eq('id', soundId);

        if (dbError) throw dbError;

        deleted++;
      } catch (error: any) {
        errors.push(`${sound.name}: ${error.message}`);
      }
    }

    setIsLoading(false);
    setSelectedFiles(new Set());

    // Refresh data
    if (selectedStyle) {
      await fetchStyleSounds(selectedStyle);
      await fetchStorageFiles(selectedStyle);
      await fetchExistingFilePaths();
    }

    if (deleted > 0) {
      toast.success(`Deleted ${deleted} file(s)`);
    }
    if (errors.length > 0) {
      toast.error(`Failed to delete ${errors.length} file(s)`);
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (sound: StyleSound) => {
    try {
      const { error } = await (supabase as any)
        .from('meditation_style_sounds')
        .update({ is_active: !sound.is_active })
        .eq('id', sound.id);

      if (error) throw error;

      setStyleSounds(prev => 
        prev.map(s => s.id === sound.id ? { ...s, is_active: !s.is_active } : s)
      );

      toast.success(`Sound ${!sound.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const selectedStyleInfo = MEDITATION_STYLES.find(s => s.id === selectedStyle);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Meditation Style Sounds</h2>
        <p className="text-muted-foreground">
          Manage audio files for each meditation style. Files are randomly selected during meditation.
        </p>
      </div>

      {/* Style Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Meditation Style</CardTitle>
          <CardDescription>Choose a style to manage its sound library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MEDITATION_STYLES.map(style => (
              <Button
                key={style.id}
                variant={selectedStyle === style.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStyle(style.id)}
                className="flex items-center gap-2"
              >
                <Music className="w-3 h-3" />
                {style.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedStyle && (
        <>
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                {selectedStyleInfo?.name} - Upload Sounds
              </CardTitle>
              <CardDescription>
                Drag & drop audio files or click to browse. Duplicates are automatically skipped.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${isUploading ? 'pointer-events-none opacity-50' : ''}
                `}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  multiple
                  accept=".wav,.mp3,.m4a"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Uploading {uploadProgress?.current} of {uploadProgress?.total} files...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="font-medium">Drop audio files here</p>
                    <p className="text-sm text-muted-foreground">
                      Supports .wav, .mp3, .m4a • Max 100MB per file
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sound Library */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Sound Library</CardTitle>
                  <CardDescription>
                    {styleSounds.length} sound(s) • {styleSounds.filter(s => s.is_active).length} active
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchStyleSounds(selectedStyle);
                      fetchStorageFiles(selectedStyle);
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {styleSounds.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectAll}
                      >
                        {selectedFiles.size === styleSounds.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      {selectedFiles.size > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSelected}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete ({selectedFiles.size})
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : styleSounds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileAudio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No sounds uploaded for this style yet</p>
                  <p className="text-sm">Drag & drop audio files above to add sounds</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {styleSounds.map(sound => (
                      <div
                        key={sound.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border transition-colors
                          ${selectedFiles.has(sound.id) ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-transparent'}
                        `}
                      >
                        <Checkbox
                          checked={selectedFiles.has(sound.id)}
                          onCheckedChange={() => toggleFileSelection(sound.id)}
                        />
                        <FileAudio className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{sound.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{sound.file_path}</p>
                        </div>
                        <Badge 
                          variant={sound.is_active ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleActiveStatus(sound)}
                        >
                          {sound.is_active ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
