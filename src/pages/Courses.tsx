import React, { useState, useEffect } from 'react';
import { Play, Lock, Award, Clock, Sparkles, CheckCircle, Loader2, RefreshCw, MessageSquare, Wallet, PlayCircle, Music, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import WealthCourseUpsell from '@/components/courses/WealthCourseUpsell';
import { useNavigate } from 'react-router-dom';

// Swedish Wealth Course ID
const WEALTH_COURSE_ID = 'f6b3a3e2-c78e-4234-8cf4-cc059655e118';

const akashaField = (
  <>
    <div className="pointer-events-none fixed inset-0 bg-[#050505] z-0" aria-hidden />
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.95] bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(212,175,55,0.1)_0%,transparent_55%),radial-gradient(ellipse_90%_55%_at_100%_25%,rgba(212,175,55,0.05)_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_0%_75%,rgba(34,211,238,0.035)_0%,transparent_45%)]"
      aria-hidden
    />
  </>
);

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
}

interface Enrollment {
  course_id: string;
  progress_percent: number;
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  duration_minutes: number;
  order_index: number;
}

const Courses: React.FC = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<string | null>(null);
  const [showWealthUpsell, setShowWealthUpsell] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [loadingLessons, setLoadingLessons] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchCourses = async () => {
    // Only fetch published courses for public visibility
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (data) setCourses(data as unknown as Course[]);
    setIsLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('course_enrollments')
      .select('course_id, progress_percent')
      .eq('user_id', user.id);
    if (data) setEnrollments(data);
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find(e => e.course_id === courseId);
  };

  const fetchLessons = async (courseId: string) => {
    if (courseLessons[courseId]) return; // Already loaded
    
    setLoadingLessons(prev => ({ ...prev, [courseId]: true }));
    const { data } = await supabase
      .from('lessons')
      .select('id, title, content_type, duration_minutes, order_index')
      .eq('course_id', courseId)
      .order('order_index');
    
    if (data) {
      setCourseLessons(prev => ({ ...prev, [courseId]: data as Lesson[] }));
    }
    setLoadingLessons(prev => ({ ...prev, [courseId]: false }));
  };

  const handleToggleCurriculum = (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
    } else {
      setExpandedCourseId(courseId);
      fetchLessons(courseId);
    }
  };

  const getLessonIcon = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
      case 'video':
        return <PlayCircle size={16} className="text-[#D4AF37]" />;
      case 'audio':
        return <Music size={16} className="text-[#22D3EE]" />;
      case 'pdf':
        return <FileText size={16} className="text-[#D4AF37]/80" />;
      default:
        return <FileText size={16} className="text-white/50" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleEnroll = async (course: Course, paymentMethod: 'free' | 'stripe' | 'crypto', isRecurring = false) => {
    if (!user || !session) {
      toast.error('Please sign in to enroll');
      return;
    }

    if (paymentMethod === 'crypto') {
      toast.info('Opening Phantom Wallet for payment...');
      // Navigate to wallet page or trigger Phantom deep link
      navigate('/wallet?action=pay&courseId=' + course.id);
      return;
    }

    setEnrollingId(course.id);
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
        fetchEnrollments();
        if (course.id === WEALTH_COURSE_ID) {
          setShowWealthUpsell(true);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  const getLanguageInfo = (code: string) => {
    return languages[code] || languages.en;
  };

  // Show all courses regardless of language
  const filteredCourses = courses;

  const completedCount = enrollments.filter(e => e.progress_percent === 100).length;
  const inProgressCount = enrollments.filter(e => e.progress_percent > 0 && e.progress_percent < 100).length;
  const availableCount = courses.length - enrollments.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {akashaField}
        <Loader2 className="w-9 h-9 animate-spin text-[#D4AF37] relative z-10 drop-shadow-[0_0_16px_rgba(212,175,55,0.45)]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] pb-28">
      {akashaField}
      <div className="relative z-10 px-4 pt-6 max-w-4xl mx-auto">
      <WealthCourseUpsell isOpen={showWealthUpsell} onOpenChange={setShowWealthUpsell} />

      <header className="mb-8 animate-fade-in">
        <p className="sqi-label-text mb-2 text-[#D4AF37]/70">Bhakti-Algorithm · Prema-Pulse</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-[-0.05em] font-heading text-[#D4AF37] gold-glow">Courses</h1>
        <p className="sqi-body-text mt-2 text-base">Expand your consciousness</p>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up">
        <div className="rounded-[28px] p-4 text-center border border-white/[0.08] bg-white/[0.02] backdrop-blur-[40px] shadow-[0_0_36px_-12px_rgba(212,175,55,0.12)] hover:border-[#D4AF37]/20 transition-colors">
          <p className="text-2xl font-black tracking-[-0.04em] font-heading text-[#D4AF37]">{completedCount}</p>
          <p className="text-[10px] sqi-label-text mt-1 !text-white/50 !tracking-[0.35em]">Completed</p>
        </div>
        <div className="rounded-[28px] p-4 text-center border border-white/[0.08] bg-white/[0.02] backdrop-blur-[40px] shadow-[0_0_36px_-12px_rgba(34,211,238,0.08)] hover:border-[#22D3EE]/25 transition-colors">
          <p className="text-2xl font-black tracking-[-0.04em] font-heading text-[#22D3EE]">{inProgressCount}</p>
          <p className="text-[10px] sqi-label-text mt-1 !text-white/50 !tracking-[0.35em]">In Progress</p>
        </div>
        <div className="rounded-[28px] p-4 text-center border border-white/[0.08] bg-white/[0.02] backdrop-blur-[40px] shadow-[0_0_36px_-12px_rgba(212,175,55,0.1)] hover:border-[#D4AF37]/20 transition-colors">
          <p className="text-2xl font-black tracking-[-0.04em] font-heading text-[#D4AF37]">{availableCount}</p>
          <p className="text-[10px] sqi-label-text mt-1 !text-white/50 !tracking-[0.35em]">Available</p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="w-full text-center py-16 rounded-[40px] border border-dashed border-[#D4AF37]/20 bg-white/[0.02]">
            <Sparkles className="w-10 h-10 text-[#D4AF37]/60 mx-auto mb-3" />
            <p className="sqi-body-text">No courses available yet</p>
          </div>
        ) : (
          filteredCourses.map((course, index) => {
            const enrollment = getEnrollment(course.id);
            const isEnrolled = !!enrollment;
            const progress = enrollment?.progress_percent || 0;
            const langInfo = getLanguageInfo(course.language || 'en');

            return (
              <div
                key={course.id}
                className="rounded-[40px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-[40px] p-5 relative cursor-pointer shadow-[0_0_48px_-16px_rgba(212,175,55,0.12)] hover:border-[#D4AF37]/28 hover:shadow-[0_0_56px_-12px_rgba(212,175,55,0.2)] transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 flex items-center justify-center shrink-0 shadow-[0_0_20px_-8px_rgba(212,175,55,0.25)]">
                    {isEnrolled ? (
                      progress === 100 ? (
                        <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                      ) : (
                        <Lock className="w-5 h-5 text-[#22D3EE]" />
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black tracking-[-0.04em] font-heading text-lg text-white leading-snug">{course.title}</h3>
                        <span className="text-base shrink-0" title={langInfo.name}>{langInfo.flag}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {course.recurring_price_usd && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-[#D4AF37]/35 bg-[#D4AF37]/15 text-[#D4AF37] whitespace-nowrap">
                            Subscription
                          </span>
                        )}
                        {course.is_free && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-white/15 bg-white/[0.06] text-white/80 whitespace-nowrap">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm sqi-body-text mt-2 line-clamp-2">
                      {course.description || 'Expand your consciousness with this transformative course.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs sqi-body-text">
                      <span className="flex items-center gap-1">
                        <Play size={12} className="text-[#D4AF37]" />
                        {course.lesson_count} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-[#D4AF37]" />
                        {course.duration_hours}h
                      </span>
                      {course.has_certificate && (
                        <span className="flex items-center gap-1">
                          <Award size={12} className="text-[#D4AF37]" />
                          Certificate
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {!course.is_free && course.price_usd > 0 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 bg-white/[0.04] text-white">
                          ${course.price_usd}
                        </span>
                      )}
                      {course.recurring_price_usd && course.recurring_interval && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] flex items-center gap-1">
                          <RefreshCw size={12} />
                          ${course.recurring_price_usd}/{course.recurring_interval === 'month' ? 'mo' : course.recurring_interval}
                        </span>
                      )}
                      {!course.is_free && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-[#22D3EE]/25 bg-[#22D3EE]/10 text-[#22D3EE] flex items-center gap-1">
                          <Wallet size={12} />
                          Crypto
                        </span>
                      )}
                    </div>

                    {isEnrolled && progress > 0 && progress < 100 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden border border-white/[0.06]">
                          <div
                            className="h-full rounded-full transition-all glowing-filament"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs sqi-body-text mt-1.5">{progress}% complete</p>
                      </div>
                    )}

                    <button
                      className="flex items-center gap-1.5 text-xs sqi-body-text hover:text-[#D4AF37] mt-3 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourseForReview(course.id);
                      }}
                    >
                      <MessageSquare size={12} className="text-[#D4AF37]/70" />
                      Reviews & Comments
                    </button>

                    <div className="mt-5 border-t border-white/[0.06] pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCurriculum(course.id);
                        }}
                        className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE] hover:text-[#22D3EE]/90 transition-colors"
                      >
                        {expandedCourseId === course.id ? 'Hide curriculum' : `See what's inside (${course.lesson_count} lessons)`}
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${expandedCourseId === course.id ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {expandedCourseId === course.id && (
                        <div className="mt-4 space-y-2">
                          {loadingLessons[course.id] ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                            </div>
                          ) : courseLessons[course.id] && courseLessons[course.id].length > 0 ? (
                            courseLessons[course.id].map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3 rounded-[20px] border border-white/[0.06] bg-white/[0.03] backdrop-blur-[20px]"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {getLessonIcon(lesson.content_type)}
                                  <span className="text-sm text-white/85 font-medium truncate">{lesson.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-white/45 shrink-0 ml-2">
                                  {formatDuration(lesson.duration_minutes)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs sqi-body-text py-2">
                              No lessons available yet
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      className="mt-4 rounded-[28px] font-black text-xs tracking-[0.12em] uppercase border border-[#D4AF37]/30 bg-[#D4AF37] text-[#050505] hover:bg-[#D4AF37]/90 shadow-[0_0_24px_-6px_rgba(212,175,55,0.45)]"
                      size="sm"
                      disabled={enrollingId === course.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEnrolled) {
                          navigate(`/courses/${course.id}`);
                        } else if (course.is_free) {
                          handleEnroll(course, 'free');
                        } else {
                          navigate(`/courses/${course.id}`);
                        }
                      }}
                    >
                      {enrollingId === course.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isEnrolled ? (
                        'Continue Learning'
                      ) : (
                        'View & Sign Up'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedCourseForReview && (
        <div className="fixed inset-0 bg-[#050505]/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 rounded-[40px] border border-white/[0.1] bg-white/[0.04] backdrop-blur-[40px] shadow-[0_0_64px_-12px_rgba(212,175,55,0.25)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black tracking-[-0.04em] text-[#D4AF37] gold-glow font-heading text-lg">Reviews & Comments</h3>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-[#D4AF37] hover:text-[#D4AF37] hover:bg-white/[0.06]"
                onClick={() => setSelectedCourseForReview(null)}
              >
                Close
              </Button>
            </div>
            <ReviewSection
              contentType="course"
              contentId={selectedCourseForReview}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Courses;