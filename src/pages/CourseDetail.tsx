import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Lock, Award, Clock, CheckCircle, Loader2, Video, Music, Type, FileText, Globe, Wallet, Sparkles, MessageSquare, X } from 'lucide-react';
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

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const { tier: membershipTier, isPremium } = useMembership();
  const { t } = useTranslation();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<string | null>(null);
  const [showWealthUpsell, setShowWealthUpsell] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');
  const [activeVideoLessonId, setActiveVideoLessonId] = useState<string | null>(null);
  const [hasStargateMembership, setHasStargateMembership] = useState(false);

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
    // Fetch lessons if enrolled OR if admin OR if has Stargate membership (admins and Stargate members get full access)
    // Wait for admin loading to complete
    if (course && !isAdminLoading && (enrollment || isAdmin || hasStargateMembership || isPremium)) {
      fetchLessons();
    }
  }, [course, enrollment, isAdmin, isAdminLoading, hasStargateMembership, isPremium]);

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
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) {
        setLessons(data as Lesson[]);
      }
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

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = (url: string | null): string | null => {
    if (!url) return null;
    
    // Handle youtube.com/embed/ format
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];
    
    // Handle youtube.com/watch?v= format
    const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return watchMatch[1];
    
    // Handle youtu.be/ format
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];
    
    // Handle youtube.com/v/ format
    const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/);
    if (vMatch) return vMatch[1];
    
    // If it's already just an ID
    if (/^[a-zA-Z0-9_-]+$/.test(url)) return url;
    
    return null;
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

        {/* Embedded Video Player - Inline on page */}
        {activeVideoUrl && (
          <Card className="p-6" id="embedded-video-player">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{activeVideoTitle}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveVideoUrl(null);
                  setActiveVideoTitle('');
                  setActiveVideoLessonId(null);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Close Video
              </Button>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {extractYouTubeId(activeVideoUrl) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${extractYouTubeId(activeVideoUrl)}?rel=0&modestbranding=1&origin=${window.location.origin}`}
                  title={activeVideoTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-muted-foreground">Video URL is not valid or not available.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Lessons Section - Show for admins or enrolled users */}
        {hasAccess && lessons.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Course Lessons</h2>
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/30 cursor-pointer ${
                    activeVideoLessonId === lesson.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  } ${!lesson.content_url ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (!lesson.content_url) {
                      toast.error('Lesson content is not available yet. Please contact support if this persists.');
                      return;
                    }

                    try {
                      // Handle different content types
                      if (lesson.content_type === 'video') {
                        // For video content, embed inline on the page
                        setActiveVideoTitle(lesson.title);
                        setActiveVideoUrl(lesson.content_url);
                        setActiveVideoLessonId(lesson.id);
                        // Scroll to video player
                        setTimeout(() => {
                          const videoElement = document.getElementById('embedded-video-player');
                          if (videoElement) {
                            videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      } else if (lesson.content_type === 'audio') {
                        // Audio can also be embedded if it's YouTube, otherwise open directly
                        if (lesson.content_url.includes('youtube.com') || lesson.content_url.includes('youtu.be')) {
                          setActiveVideoTitle(lesson.title);
                          setActiveVideoUrl(lesson.content_url);
                          setActiveVideoLessonId(lesson.id);
                          setTimeout(() => {
                            const videoElement = document.getElementById('embedded-video-player');
                            if (videoElement) {
                              videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        } else {
                          window.open(lesson.content_url, '_blank');
                        }
                      } else if (lesson.content_type === 'text') {
                        // For text content, open in new tab
                        window.open(lesson.content_url, '_blank');
                      } else if (lesson.content_type === 'pdf') {
                        // PDFs can be opened directly
                        window.open(lesson.content_url, '_blank');
                      } else {
                        // Default: check if it's YouTube, embed inline, otherwise open in new tab
                        if (lesson.content_url.includes('youtube.com') || lesson.content_url.includes('youtu.be')) {
                          setActiveVideoTitle(lesson.title);
                          setActiveVideoUrl(lesson.content_url);
                          setActiveVideoLessonId(lesson.id);
                          setTimeout(() => {
                            const videoElement = document.getElementById('embedded-video-player');
                            if (videoElement) {
                              videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        } else {
                          window.open(lesson.content_url, '_blank');
                        }
                      }
                    } catch (error) {
                      console.error('Error opening lesson content:', error);
                      toast.error('Failed to open lesson content. Please try again.');
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    {getContentTypeIcon(lesson.content_type)}
                    <div className="flex-1">
                      <p className="font-medium">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground">{lesson.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {lesson.duration_minutes} min
                        {lesson.is_preview && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {lesson.content_url ? (
                    <Play className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Play className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>
            {lessons.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lessons available yet for this course.
              </p>
            )}
          </Card>
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
