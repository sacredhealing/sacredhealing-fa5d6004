import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Lock, Award, Clock, CheckCircle, Loader2, Video, Music, Type, FileText, Globe, Wallet, Sparkles, MessageSquare, X, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { toast } from 'sonner';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import WealthCourseUpsell from '@/components/courses/WealthCourseUpsell';
import { useTranslation } from 'react-i18next';
import { useMembership } from '@/hooks/useMembership';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

// Swedish Wealth Course ID
const WEALTH_COURSE_ID = 'f6b3a3e2-c78e-4234-8cf4-cc059655e118';

const languages: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  sv: { name: 'Swedish', flag: '🇸🇪' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  no: { name: 'Norwegian', flag: '🇳🇴' },
};

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty_level: string;
  duration_hours: number;
  lesson_count: number;
  is_free: boolean;
  is_premium_only: boolean;
  price_usd: number;
  price_shc: number;
  has_certificate: boolean;
  enrollment_count: number;
  recurring_price_usd: number | null;
  recurring_interval: string | null;
  cover_image_url: string | null;
  language: string;
  instructor_name?: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
}

interface Enrollment {
  course_id: string;
  progress_percent: number;
}

interface LessonMaterial {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  file_url: string;
  file_type: string;
  order_index?: number;
}

type LessonWithMaterials = Lesson & {
  materials?: LessonMaterial[];
};

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const { tier: membershipTier, isPremium } = useMembership();
  const { t } = useTranslation();
  const { playUniversalAudio } = useMusicPlayer();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonWithMaterials[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<string | null>(null);
  const [showWealthUpsell, setShowWealthUpsell] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');
  const [activeVideoLessonId, setActiveVideoLessonId] = useState<string | null>(null);
  const [hasStargateMembership, setHasStargateMembership] = useState(false);
  const [courseLevelMaterials, setCourseLevelMaterials] = useState<LessonMaterial[]>([]);

  useEffect(() => {
    // Wait for admin loading to complete before fetching course
    if (id && !isAdminLoading) {
      fetchCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin, isAdminLoading]);

  useEffect(() => {
    if (user && id && !isAdminLoading) {
      fetchEnrollment();
      checkStargateMembership();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, isAdminLoading]);

  const checkStargateMembership = async () => {
    if (!user) return;
    try {
      // Check if user has premium membership (which includes Stargate)
      // Stargate members have premium tier access
      // Also check if user has any active premium subscription
      const { data: membershipData } = await supabase
        .from('user_memberships')
        .select('*, membership_tiers!inner(slug, name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or('current_period_end.is.null,current_period_end.gt.now()');
      
      // Check if user has premium tier (premium-monthly, premium-annual, lifetime, or Stargate)
      const hasPremiumAccess = membershipData && membershipData.length > 0 && 
        membershipData.some(m => {
          const tierSlug = m.membership_tiers?.slug || '';
          return tierSlug.includes('premium') || tierSlug === 'lifetime';
        });
      
      // Stargate membership grants full course access
      // Premium members (including Stargate) get access
      setHasStargateMembership(hasPremiumAccess || isPremium || membershipTier !== 'free');
    } catch (error) {
      console.error('Error checking Stargate membership:', error);
      // Default to false if check fails
      setHasStargateMembership(false);
    }
  };

  useEffect(() => {
    if (course && !isAdminLoading && (enrollment || isAdmin || hasStargateMembership || isPremium)) {
      fetchLessons();
    }
  }, [course, enrollment, isAdmin, isAdminLoading, hasStargateMembership, isPremium]);

  // Auto-select first lesson when entering course with access (Sacred Study layout)
  useEffect(() => {
    const access = isAdmin || !!enrollment || hasStargateMembership || isPremium;
    if (!access || lessons.length === 0) return;
    if (activeVideoLessonId) return;
    const first = lessons[0];
    setActiveVideoLessonId(first.id);
    setActiveVideoTitle(first.title);
    setActiveVideoUrl(getVideoUrlForLesson(first));
  }, [isAdmin, enrollment, hasStargateMembership, isPremium, lessons, activeVideoLessonId]);

  const fetchCourse = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      // Admins can access unpublished courses
      let query = supabase
        .from('courses')
        .select('*')
        .eq('id', id);
      
      // Only filter by published if not admin (isAdmin is false, not undefined)
      if (isAdmin === false) {
        query = query.eq('is_published', true);
      }
      
      const { data, error } = await query.single();

      if (error) throw error;
      if (data) {
        setCourse(data as Course);
      } else {
        toast.error('Course not found');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      navigate('/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollment = async () => {
    if (!user || !id) return;
    try {
      const { data } = await supabase
        .from('course_enrollments')
        .select('course_id, progress_percent')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setEnrollment(data);
      }
    } catch (error) {
      // No enrollment found, which is fine
      setEnrollment(null);
    }
  };

  const fetchLessons = async () => {
    // Allow admins, Stargate members, and enrolled users to access lessons
    if (!course || isAdminLoading) return;
    if (!enrollment && !isAdmin && !hasStargateMembership && !isPremium) return;
    
    try {
      // Fetch lessons and their related materials for this course
      const [
        { data: lessonData, error: lessonError },
        { data: materialData, error: materialError }
      ] = await Promise.all([
        supabase
          .from('lessons')
          .select('*')
          .eq('course_id', course.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('course_materials')
          .select('id, course_id, lesson_id, title, file_url, file_type, order_index')
          .eq('course_id', course.id)
          .order('order_index', { ascending: true })
      ]);

      if (lessonError) throw lessonError;
      if (materialError) throw materialError;

      const materialsByLessonId = new Map<string, LessonMaterial[]>();
      const courseMaterials: LessonMaterial[] = [];
      
      (materialData || []).forEach((material: any) => {
        if (!material.lesson_id) {
          // Course-level materials (no lesson_id) - store separately
          courseMaterials.push({ ...material, order_index: material.order_index ?? 0 } as LessonMaterial);
          return;
        }
        const existing = materialsByLessonId.get(material.lesson_id) || [];
        existing.push({ ...material, order_index: material.order_index ?? 0 } as LessonMaterial);
        materialsByLessonId.set(material.lesson_id, existing);
      });

      const lessonsWithMaterials: LessonWithMaterials[] = (lessonData || []).map((lesson: any) => ({
        ...(lesson as Lesson),
        materials: (materialsByLessonId.get(lesson.id) || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      }));

      // Attach course-level materials to the first lesson if it exists
      if (lessonsWithMaterials.length > 0 && courseMaterials.length > 0) {
        const firstLesson = lessonsWithMaterials[0];
        firstLesson.materials = [
          ...(firstLesson.materials || []),
          ...courseMaterials.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        ];
      }

      setLessons(lessonsWithMaterials);
      setCourseLevelMaterials(courseMaterials.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)));
    } catch (error) {
      console.error('Error fetching lessons:', error);
      // Don't show error toast for lessons, just log it
    }
  };

  const handleEnroll = async (paymentMethod: 'free' | 'stripe' | 'crypto', isRecurring = false) => {
    if (!user || !session || !course) {
      toast.error('Please sign in to enroll');
      return;
    }

    if (paymentMethod === 'crypto') {
      toast.info('Opening Phantom Wallet for payment...');
      navigate('/wallet?action=pay&courseId=' + course.id);
      return;
    }

    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.functions.invoke('enroll-course', {
        body: { 
          courseId: course.id, 
          paymentMethod,
          isRecurring 
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        if (course.id === WEALTH_COURSE_ID) {
          setTimeout(() => setShowWealthUpsell(true), 500);
        }
      } else if (data.success) {
        toast.success(data.message || 'Enrolled successfully!');
        fetchEnrollment();
        if (course.id === WEALTH_COURSE_ID) {
          setShowWealthUpsell(true);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  const getLanguageInfo = (code: string) => {
    return languages[code] || languages.en;
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'audio':
        return <Music className="w-4 h-4 text-purple-500" />;
      case 'text':
        return <Type className="w-4 h-4 text-green-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Extract YouTube video ID from various URL formats (including youtu.be)
  const extractYouTubeId = (url: string | null): string | null => {
    if (!url) return null;
    
    // Handle youtube.com/embed/ format
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];
    
    // Handle youtube.com/watch?v= format
    const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return watchMatch[1];
    
    // Handle youtu.be/ format (shortened links from admin)
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];
    
    // Handle youtube.com/v/ format
    const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/);
    if (vMatch) return vMatch[1];
    
    // If it's already just an ID
    if (/^[a-zA-Z0-9_-]+$/.test(url)) return url;
    
    return null;
  };

  // Normalize any YouTube URL to embed format before passing to iframe
  const toYouTubeEmbedUrl = (url: string | null): string | null => {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&origin=${window.location.origin}`;
  };

  // Get video URL for main player: lesson content_url (video/audio) OR first YouTube material (by type or URL). Video → main player only.
  const getVideoUrlForLesson = (lesson: LessonWithMaterials): string | null => {
    const trimmedContentUrl = lesson.content_url?.trim();
    if ((lesson.content_type === 'video' || lesson.content_type === 'audio') && trimmedContentUrl && extractYouTubeId(trimmedContentUrl)) {
      return trimmedContentUrl;
    }
    const materials = lesson.materials ?? [];
    const byType = materials.find((m) => String(m.file_type).toLowerCase() === 'youtube' && m.file_url?.trim());
    if (byType?.file_url?.trim()) return byType.file_url.trim();
    const byUrl = materials.find((m) => m.file_url?.trim() && extractYouTubeId(m.file_url.trim()));
    if (byUrl?.file_url?.trim()) return byUrl.file_url.trim();
    if (trimmedContentUrl) return trimmedContentUrl;
    return null;
  };

  // Materials that are NOT video (PDF / Audio) → Sacred Material buttons only. Never show Sacred Material for YouTube.
  const getNonVideoMaterials = (lesson: LessonWithMaterials): LessonMaterial[] => {
    return (lesson.materials ?? []).filter((m) => {
      const type = String(m.file_type).toLowerCase();
      if (type === 'youtube') return false;
      if (m.file_url?.trim() && extractYouTubeId(m.file_url.trim())) return false;
      return true;
    });
  };

  // Show loading while checking admin status or fetching course
  if (isAdminLoading || isLoading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24 flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Course not found</p>
        <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
      </div>
    );
  }

  // Admins, Stargate members, and enrolled users get full access
  const hasAccess = isAdmin || !!enrollment || hasStargateMembership || isPremium;
  const isEnrolled = !!enrollment;
  const progress = enrollment?.progress_percent || 0;
  const langInfo = getLanguageInfo(course.language || 'en');

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <Button
        variant="ghost"
        onClick={() => navigate('/courses')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Courses
      </Button>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Course Header */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
              {isAdmin || hasStargateMembership || isPremium ? (
                <Award className="w-8 h-8 text-primary" />
              ) : isEnrolled ? (
                progress === 100 ? (
                  <CheckCircle className="w-8 h-8 text-secondary" />
                ) : (
                  <Lock className="w-8 h-8 text-primary" />
                )
              ) : (
                <Lock className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <span className="text-xl" title={langInfo.name}>{langInfo.flag}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                <span>{course.category}</span>
                <span>•</span>
                <span>{course.difficulty_level}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration_hours} hours
                </span>
                <span>•</span>
                <span>{course.lesson_count} lessons</span>
                {course.has_certificate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Certificate
                    </span>
                  </>
                )}
              </div>
              {course.description && (
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              )}
            </div>
          </div>

          {/* Admin/Stargate Badge */}
          {(isAdmin || hasStargateMembership || isPremium) && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {isAdmin 
                    ? 'Admin Access - Full Course Access Granted'
                    : hasStargateMembership || isPremium
                    ? 'Full Course Access Granted'
                    : 'Access Granted'}
                </span>
              </div>
            </div>
          )}

          {/* Enrollment Status */}
          {isEnrolled && !isAdmin && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Enrollment Actions - Only show if not admin and not enrolled */}
          {!hasAccess && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-semibold">
                    {course.is_free ? 'Free Course' : `$${course.price_usd}`}
                  </p>
                  {course.recurring_price_usd && (
                    <p className="text-sm text-muted-foreground">
                      Then ${course.recurring_price_usd}/{course.recurring_interval}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {course.is_free ? (
                    <Button
                      onClick={() => handleEnroll('free')}
                      disabled={isEnrolling}
                      className="bg-primary"
                    >
                      {isEnrolling ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Enroll Free
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleEnroll('stripe')}
                        disabled={isEnrolling}
                        variant="outline"
                      >
                        {isEnrolling ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Wallet className="w-4 h-4 mr-2" />
                        )}
                        Pay with Card
                      </Button>
                      {course.price_shc > 0 && (
                        <Button
                          onClick={() => handleEnroll('crypto')}
                          disabled={isEnrolling}
                          className="bg-primary"
                        >
                          {isEnrolling ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Wallet className="w-4 h-4 mr-2" />
                          )}
                          Pay with SHC
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Sacred Study layout: sidebar + main (only when has access and has lessons) */}
        {hasAccess && lessons.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6 mt-6">
            {/* Left: curriculum list */}
            <aside className="w-full lg:w-72 shrink-0">
              <Card className="p-4 lg:max-h-[70vh] overflow-hidden flex flex-col">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Curriculum</h3>
                <div className="overflow-y-auto space-y-1 pr-1">
                  {lessons.map((lesson, index) => {
                    const isActive = activeVideoLessonId === lesson.id;
                    const videoUrl = getVideoUrlForLesson(lesson);
                    const isLocked = !hasAccess
                      ? !videoUrl && lesson.content_type !== 'text'
                      : false;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          setActiveVideoLessonId(lesson.id);
                          setActiveVideoTitle(lesson.title);
                          setActiveVideoUrl(videoUrl);
                          if (!hasAccess && !videoUrl && lesson.content_type !== 'text') {
                            toast.info('This lesson content is being prepared.');
                          }
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors ${
                          isActive ? 'bg-primary/15 border border-primary/30' : 'hover:bg-muted/40 border border-transparent'
                        } ${isLocked ? 'opacity-75' : ''}`}
                      >
                        <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                          {index + 1}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium">{lesson.title}</span>
                        {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </aside>

            {/* Right: large player + lesson title + description + only Sacred Material & Continue */}
            <main className="flex-1 min-w-0 space-y-4">
              <Card className="p-6 overflow-hidden">
                {/* Large video/audio player */}
                <div className="relative w-full rounded-lg overflow-hidden bg-muted/30" style={{ paddingBottom: '56.25%' }}>
                  {(() => {
                    const embedUrl = toYouTubeEmbedUrl(activeVideoUrl);
                    if (embedUrl) {
                      return (
                        <iframe
                          width="100%"
                          height="100%"
                          src={embedUrl}
                          title={activeVideoTitle}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full"
                        />
                      );
                    }
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <Video className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground text-center font-medium mb-1">Content Coming Soon</p>
                        <p className="text-muted-foreground/70 text-center text-sm">This lesson is being prepared.</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Lesson title + description */}
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-foreground">{activeVideoTitle}</h2>
                  {lessons.find(l => l.id === activeVideoLessonId)?.description && (
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {lessons.find(l => l.id === activeVideoLessonId)?.description}
                    </p>
                  )}
                </div>

                {/* Only 2 actions: Sacred Material (PDF/Audio only; never YouTube), Continue (next lesson) */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {(() => {
                    const currentLesson = lessons.find(l => l.id === activeVideoLessonId);
                    const nonVideoMaterials = currentLesson ? getNonVideoMaterials(currentLesson) : [];
                    return (
                      nonVideoMaterials.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {nonVideoMaterials.map((material) => {
                            const isAudio = material.file_type?.toLowerCase() === 'audio' || 
                                           material.file_url?.match(/\.(mp3|wav|m4a|ogg|aac)$/i);
                            const handleMaterialClick = () => {
                              if (isAudio && playUniversalAudio) {
                                // Play audio in music player
                                playUniversalAudio({
                                  id: material.id,
                                  title: material.title,
                                  artist: course?.instructor_name || 'Sacred Healing',
                                  audio_url: material.file_url,
                                  preview_url: null,
                                  cover_image_url: course?.cover_image_url || null,
                                  duration_seconds: 0,
                                  shc_reward: 0,
                                  contentType: 'meditation'
                                });
                              } else {
                                // Open PDF or other files in new tab
                                window.open(material.file_url, '_blank');
                              }
                            };
                            
                            return (
                              <Button
                                key={material.id}
                                variant="outline"
                                size="sm"
                                onClick={handleMaterialClick}
                                className="gap-2"
                              >
                                {isAudio ? <Music className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                {nonVideoMaterials.length === 1 ? 'Sacred Material' : `Sacred Material: ${material.title}`}
                              </Button>
                            );
                          })}
                        </div>
                      )
                    );
                  })()}
                  {(() => {
                    const idx = lessons.findIndex(l => l.id === activeVideoLessonId);
                    const nextLesson = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
                    return nextLesson ? (
                      <Button
                        className="gap-2"
                        onClick={() => {
                          setActiveVideoLessonId(nextLesson.id);
                          setActiveVideoTitle(nextLesson.title);
                          setActiveVideoUrl(getVideoUrlForLesson(nextLesson));
                        }}
                      >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : null;
                  })()}
                </div>
              </Card>
            </main>
          </div>
        )}

        {/* Reviews Section */}
        <Card className="p-6">
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
            onClick={() => setSelectedCourseForReview(course.id)}
          >
            <MessageSquare className="w-4 h-4" />
            Reviews & Comments
          </button>
          {selectedCourseForReview === course.id && (
            <ReviewSection
              itemId={course.id}
              itemType="course"
              onClose={() => setSelectedCourseForReview(null)}
            />
          )}
        </Card>
      </div>

      {/* Wealth Course Upsell Modal */}
      {showWealthUpsell && course.id === WEALTH_COURSE_ID && (
        <WealthCourseUpsell onClose={() => setShowWealthUpsell(false)} />
      )}

    </div>
  );
};

export default CourseDetail;
