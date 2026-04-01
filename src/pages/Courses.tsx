import React, { useState, useEffect } from 'react';
import { Play, Lock, Award, Clock, Sparkles, CheckCircle, Loader2, RefreshCw, MessageSquare, Globe, Wallet, PlayCircle, Music, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import WealthCourseUpsell from '@/components/courses/WealthCourseUpsell';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  const { i18n } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<string | null>(null);
  const [showWealthUpsell, setShowWealthUpsell] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [loadingLessons, setLoadingLessons] = useState<Record<string, boolean>>({});

  const currentLanguage = i18n.language?.split('-')[0] || 'en';

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
        return <PlayCircle size={16} className="text-[#D4AF37]/80" />;
      case 'audio':
        return <Music size={16} className="text-[#D4AF37]/80" />;
      case 'pdf':
        return <FileText size={16} className="text-white/50" />;
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="glass-card flex items-center gap-3 px-6 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
          <div className="leading-tight">
            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">
              Loading
            </div>
            <div className="text-sm text-white/70">Preparing transmissions…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 pt-6 pb-24">
      <WealthCourseUpsell isOpen={showWealthUpsell} onOpenChange={setShowWealthUpsell} />
      
      {/* Header */}
      <header className="mb-6 max-w-5xl mx-auto animate-fade-in">
        <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">
          Prema-Pulse Transmissions
        </div>
        <h1 className="mt-2 text-[34px] leading-[1.05] font-black tracking-[-0.05em] text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)]">
          Courses
        </h1>
        <p className="mt-2 text-white/60 leading-[1.6]">
          Bhakti-Algorithms encoded as structured paths — built to work in 2026 and forward.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 max-w-5xl mx-auto animate-slide-up">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-black tracking-[-0.03em] text-[#D4AF37]">{completedCount}</p>
          <p className="mt-1 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">Completed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-black tracking-[-0.03em] text-[#D4AF37]">{inProgressCount}</p>
          <p className="mt-1 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">In Progress</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-black tracking-[-0.03em] text-[#D4AF37]">{availableCount}</p>
          <p className="mt-1 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">Available</p>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4 max-w-5xl mx-auto">
        {filteredCourses.length === 0 ? (
          <div className="glass-card w-full text-center py-12">
            <p className="text-white/60">No courses available yet</p>
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
                className="glass-card p-6 relative cursor-pointer transition-all animate-slide-up hover:border-[#D4AF37]/25 hover:shadow-[0_0_28px_rgba(212,175,55,0.10)]"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                    {isEnrolled ? (
                      progress === 100 ? (
                        <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                      ) : (
                        <Lock className="w-5 h-5 text-[#D4AF37]" />
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-white/35" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black tracking-[-0.03em] text-[18px] text-white">
                          {course.title}
                        </h3>
                        <span className="text-base shrink-0" title={langInfo.name}>{langInfo.flag}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {course.recurring_price_usd && (
                          <span className="px-2 py-0.5 bg-[#D4AF37]/15 border border-[#D4AF37]/25 rounded-full text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#D4AF37] whitespace-nowrap">
                            Subscription
                          </span>
                        )}
                        {course.is_free && (
                          <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/70 whitespace-nowrap">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-white/60 mt-2 line-clamp-2 leading-[1.6]">
                      {course.description || 'Expand your consciousness with this transformative course.'}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-4 text-xs text-white/60">
                      <span className="flex items-center gap-2">
                        <Play size={12} className="text-[#D4AF37]/80" />
                        {course.lesson_count} lessons
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={12} className="text-[#D4AF37]/80" />
                        {course.duration_hours}h
                      </span>
                      {course.has_certificate && (
                        <span className="flex items-center gap-2">
                          <Award size={12} className="text-[#D4AF37]/80" />
                          Certificate
                        </span>
                      )}
                    </div>

                    {/* Pricing Badges - No SHC, added Crypto */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {!course.is_free && course.price_usd > 0 && (
                        <span className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-xs font-semibold text-white/80">
                          ${course.price_usd}
                        </span>
                      )}
                      {course.recurring_price_usd && course.recurring_interval && (
                        <span className="px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-xs font-semibold text-[#D4AF37] flex items-center gap-2">
                          <RefreshCw size={12} />
                          ${course.recurring_price_usd}/{course.recurring_interval === 'month' ? 'mo' : course.recurring_interval}
                        </span>
                      )}
                      {!course.is_free && (
                        <span className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-xs font-semibold text-white/75 flex items-center gap-2">
                          <Wallet size={12} className="text-[#D4AF37]/80" />
                          Crypto
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isEnrolled && progress > 0 && progress < 100 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#D4AF37] rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/60 mt-1">{progress}% complete</p>
                      </div>
                    )}

                    {/* Reviews Link */}
                    <button 
                      className="flex items-center gap-2 text-xs text-white/60 hover:text-[#D4AF37] mt-4 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourseForReview(course.id);
                      }}
                    >
                      <MessageSquare size={12} />
                      Reviews & Comments
                    </button>

                    {/* Curriculum Preview */}
                    <div className="mt-5 border-t border-white/5 pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCurriculum(course.id);
                        }}
                        className="flex items-center gap-2 text-xs text-[#D4AF37]/80 hover:text-[#D4AF37] transition-colors"
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
                              <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                            </div>
                          ) : courseLessons[course.id] && courseLessons[course.id].length > 0 ? (
                            courseLessons[course.id].map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl opacity-80"
                              >
                                <div className="flex items-center gap-3">
                                  {getLessonIcon(lesson.content_type)}
                                  <span className="text-sm text-white/80 font-normal">
                                    {lesson.title}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-white/40">
                                  {formatDuration(lesson.duration_minutes)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-white/60 py-2">
                              No lessons available yet
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="mt-5 rounded-[20px] bg-[#D4AF37] text-[#050505] font-black hover:opacity-90" 
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

      {/* Review Section Modal */}
      {selectedCourseForReview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black tracking-[-0.03em] text-lg text-[#D4AF37] [text-shadow:0_0_12px_rgba(212,175,55,0.25)]">
                Reviews & Comments
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
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
  );
};

export default Courses;