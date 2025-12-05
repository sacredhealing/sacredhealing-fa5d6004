import React, { useState, useEffect } from 'react';
import { Play, Lock, Award, Clock, Sparkles, CheckCircle, Loader2, RefreshCw, MessageSquare, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import WealthCourseUpsell from '@/components/courses/WealthCourseUpsell';
import { useNavigate } from 'react-router-dom';

// Swedish Wealth Course ID
const WEALTH_COURSE_ID = 'f6b3a3e2-c78e-4234-8cf4-cc059655e118';

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
}

interface Enrollment {
  course_id: string;
  progress_percent: number;
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

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
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

  const handleEnroll = async (course: Course, paymentMethod: 'free' | 'shc' | 'stripe', isRecurring = false) => {
    if (!user || !session) {
      toast.error('Please sign in to enroll');
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

  const completedCount = enrollments.filter(e => e.progress_percent === 100).length;
  const inProgressCount = enrollments.filter(e => e.progress_percent > 0 && e.progress_percent < 100).length;
  const availableCount = courses.length - enrollments.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <WealthCourseUpsell isOpen={showWealthUpsell} onOpenChange={setShowWealthUpsell} />
      
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">Courses</h1>
        <p className="text-muted-foreground mt-1">Expand your consciousness</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <p className="text-2xl font-heading font-bold text-primary">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <p className="text-2xl font-heading font-bold text-secondary">{inProgressCount}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <p className="text-2xl font-heading font-bold text-accent">{availableCount}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Stargate Membership Card */}
        <div
          className="bg-card rounded-xl border border-border/30 p-5 relative cursor-pointer hover:border-primary/50 transition-all animate-slide-up"
          onClick={() => navigate('/stargate')}
        >
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-heading font-bold text-lg text-foreground">Stargate Membership</h3>
                <span className="px-3 py-1 bg-primary/90 rounded-full text-xs font-medium text-primary-foreground whitespace-nowrap">
                  Subscription
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                Explore the Stargate community and unlock new spiritual dimensions. Bi-weekly Zoom sessions (Mantrachanting, Healing Chamber, Bhagavad Gita), private Telegram group with daily inspiration and spiritual support.
              </p>
              
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Play size={12} />
                  Bi-weekly sessions
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  Telegram Group
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="px-3 py-1.5 bg-secondary/20 rounded-full text-xs font-medium text-secondary flex items-center gap-1">
                  <Sparkles size={12} />
                  500 SHC
                </span>
                <span className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-foreground">
                  €25
                </span>
                <span className="px-3 py-1.5 bg-primary/20 rounded-full text-xs font-medium text-primary flex items-center gap-1">
                  <RefreshCw size={12} />
                  €25/mo
                </span>
              </div>

              <button 
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-3 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCourseForReview('stargate');
                }}
              >
                <MessageSquare size={12} />
                Reviews & Comments (Earn 1000 SHC)
              </button>

              <Button className="mt-4 rounded-xl" size="sm">
                View & Sign Up
              </Button>
            </div>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="w-full text-center py-12">
            <p className="text-muted-foreground">No courses available yet</p>
          </div>
        ) : (
          courses.map((course, index) => {
            const enrollment = getEnrollment(course.id);
            const isEnrolled = !!enrollment;
            const progress = enrollment?.progress_percent || 0;

            return (
              <div
                key={course.id}
                className="bg-card rounded-xl border border-border/30 p-5 relative cursor-pointer hover:border-primary/50 transition-all animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    {isEnrolled ? (
                      progress === 100 ? (
                        <CheckCircle className="w-5 h-5 text-secondary" />
                      ) : (
                        <Lock className="w-5 h-5 text-primary" />
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-heading font-bold text-lg text-foreground">{course.title}</h3>
                      {course.recurring_price_usd && (
                        <span className="px-3 py-1 bg-primary/90 rounded-full text-xs font-medium text-primary-foreground whitespace-nowrap">
                          Subscription
                        </span>
                      )}
                      {course.is_free && (
                        <span className="px-3 py-1 bg-secondary/90 rounded-full text-xs font-medium text-secondary-foreground whitespace-nowrap">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {course.description || 'Expand your consciousness with this transformative course.'}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play size={12} />
                        {course.lesson_count} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {course.duration_hours}h
                      </span>
                      {course.has_certificate && (
                        <span className="flex items-center gap-1">
                          <Award size={12} className="text-accent" />
                          Certificate
                        </span>
                      )}
                    </div>

                    {/* Pricing Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {course.price_shc > 0 && (
                        <span className="px-3 py-1.5 bg-secondary/20 rounded-full text-xs font-medium text-secondary flex items-center gap-1">
                          <Sparkles size={12} />
                          {course.price_shc} SHC
                        </span>
                      )}
                      {!course.is_free && course.price_usd > 0 && (
                        <span className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-foreground">
                          ${course.price_usd}
                        </span>
                      )}
                      {course.recurring_price_usd && course.recurring_interval && (
                        <span className="px-3 py-1.5 bg-primary/20 rounded-full text-xs font-medium text-primary flex items-center gap-1">
                          <RefreshCw size={12} />
                          ${course.recurring_price_usd}/{course.recurring_interval === 'month' ? 'mo' : course.recurring_interval}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isEnrolled && progress > 0 && progress < 100 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                      </div>
                    )}

                    {/* Reviews Link */}
                    <button 
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-3 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourseForReview(course.id);
                      }}
                    >
                      <MessageSquare size={12} />
                      Reviews & Comments (Earn 1000 SHC)
                    </button>

                    {/* Action Button */}
                    <Button 
                      className="mt-4 rounded-xl" 
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg">Reviews & Comments</h3>
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
