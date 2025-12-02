import React, { useState, useEffect } from 'react';
import { Play, Lock, Award, Clock, Sparkles, CheckCircle, Loader2, RefreshCw, MessageSquare, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import WealthCourseUpsell from '@/components/courses/WealthCourseUpsell';

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
}

interface Enrollment {
  course_id: string;
  progress_percent: number;
}

const Courses: React.FC = () => {
  const { user, session } = useAuth();
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
        // Show upsell for wealth course after successful checkout redirect
        if (course.id === WEALTH_COURSE_ID) {
          setTimeout(() => setShowWealthUpsell(true), 500);
        }
      } else if (data.success) {
        toast.success(data.message || 'Enrolled successfully!');
        fetchEnrollments();
        // Show upsell for wealth course after free enrollment
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
      {/* Upsell Dialog */}
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
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses available yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, index) => {
            const enrollment = getEnrollment(course.id);
            const isEnrolled = !!enrollment;
            const progress = enrollment?.progress_percent || 0;

            return (
              <div
                key={course.id}
                className={`relative overflow-hidden rounded-2xl border p-5 animate-slide-up transition-all duration-300 ${
                  !isEnrolled && !course.is_free
                    ? 'bg-muted/20 border-border/30'
                    : 'bg-gradient-card border-border/50 hover:scale-[1.02]'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Badge indicators */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {progress === 100 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-secondary/20 rounded-full">
                      <CheckCircle size={12} className="text-secondary" />
                      <span className="text-xs font-medium text-secondary">Done</span>
                    </div>
                  )}
                {course.is_premium_only && (
                    <div className="px-2 py-1 bg-accent/20 rounded-full">
                      <span className="text-xs font-medium text-accent">Premium</span>
                    </div>
                  )}
                  {course.id === WEALTH_COURSE_ID && (
                    <div className="px-2 py-1 bg-yellow-500/20 rounded-full">
                      <span className="text-xs font-medium text-yellow-500">🇸🇪 Svenska</span>
                    </div>
                  )}
                  {course.recurring_price_usd && (
                    <div className="px-2 py-1 bg-primary/20 rounded-full">
                      <RefreshCw size={10} className="inline text-primary mr-1" />
                      <span className="text-xs font-medium text-primary">Subscription</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  {/* Course icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                    !isEnrolled && !course.is_free ? 'bg-muted/30' : 'bg-primary/20'
                  }`}>
                    {!isEnrolled && !course.is_free ? (
                      <Lock size={24} className="text-muted-foreground" />
                    ) : (
                      <span>📚</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className={`font-heading font-semibold ${
                      !isEnrolled && !course.is_free ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Meta info */}
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

                    {/* Progress bar for enrolled courses */}
                    {isEnrolled && progress > 0 && progress < 100 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-healing rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Enrollment buttons */}
                    {!isEnrolled && (
                      <div className="mt-3 space-y-2">
                        {course.is_free ? (
                          <Button 
                            variant="spiritual" 
                            size="sm"
                            disabled={enrollingId === course.id}
                            onClick={() => handleEnroll(course, 'free')}
                          >
                            {enrollingId === course.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Play size={14} />
                            )}
                            Start Free Course
                          </Button>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {/* One-time payment options */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={enrollingId === course.id}
                              onClick={() => handleEnroll(course, 'shc')}
                            >
                              <Sparkles size={14} className="text-accent" />
                              {course.price_shc} SHC
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={enrollingId === course.id}
                              onClick={() => handleEnroll(course, 'stripe')}
                            >
                              ${course.price_usd}
                            </Button>

                            {/* Subscription option */}
                            {course.recurring_price_usd && course.recurring_interval && (
                              <Button 
                                variant="gold" 
                                size="sm"
                                disabled={enrollingId === course.id}
                                onClick={() => handleEnroll(course, 'stripe', true)}
                              >
                                <RefreshCw size={14} />
                                ${course.recurring_price_usd}/{course.recurring_interval === 'month' ? 'mo' : 'yr'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isEnrolled && progress < 100 && (
                      <div className="mt-3">
                        <Button variant="spiritual" size="sm">
                          <Play size={14} />
                          Continue Learning
                        </Button>
                      </div>
                    )}

                    {/* Review button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourseForReview(selectedCourseForReview === course.id ? null : course.id);
                      }}
                      className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageSquare size={14} />
                      <span>Reviews & Comments (Earn 1000 SHC)</span>
                    </button>
                  </div>
                </div>

                {/* Review Section */}
                {selectedCourseForReview === course.id && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <ReviewSection
                      contentType="course"
                      contentId={course.id}
                      contentTitle={course.title}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Courses;