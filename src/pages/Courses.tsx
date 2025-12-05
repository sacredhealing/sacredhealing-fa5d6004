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
  cover_image_url: string | null;
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

      {/* Course Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Stargate Membership Card */}
        <div
          onClick={() => window.location.href = '/stargate'}
          className="relative overflow-hidden rounded-xl border border-primary/50 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/20 animate-slide-up"
        >
          <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
            <span className="text-6xl relative z-10">🌟</span>
            <div className="absolute top-2 left-2">
              <span className="px-2 py-0.5 bg-primary/90 rounded-full text-[10px] font-medium text-primary-foreground">
                Community
              </span>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 leading-tight">
              Stargate Membership
            </h3>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Sparkles size={10} className="text-primary" />
                €25/month
              </span>
            </div>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="col-span-full text-center py-12">
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
                onClick={() => window.location.href = `/courses/${course.id}`}
                className="relative overflow-hidden rounded-xl border border-border/30 bg-card cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Course Thumbnail */}
                <div className="aspect-[4/3] relative overflow-hidden bg-muted/30">
                  {course.cover_image_url ? (
                    <img 
                      src={course.cover_image_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <span className="text-4xl">📚</span>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {course.is_free && (
                      <span className="px-2 py-0.5 bg-secondary/90 rounded-full text-[10px] font-medium text-secondary-foreground">
                        Free
                      </span>
                    )}
                    {course.is_premium_only && (
                      <span className="px-2 py-0.5 bg-accent/90 rounded-full text-[10px] font-medium text-accent-foreground">
                        Premium
                      </span>
                    )}
                    {course.id === WEALTH_COURSE_ID && (
                      <span className="px-2 py-0.5 bg-yellow-500/90 rounded-full text-[10px] font-medium text-yellow-950">
                        🇸🇪
                      </span>
                    )}
                  </div>

                  {/* Progress indicator */}
                  {isEnrolled && progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Completion badge */}
                  {progress === 100 && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle size={20} className="text-secondary drop-shadow-md" />
                    </div>
                  )}
                </div>

                {/* Course Title */}
                <div className="p-3">
                  <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Play size={10} />
                      {course.lesson_count}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} />
                      {course.duration_hours}h
                    </span>
                    {course.has_certificate && (
                      <Award size={10} className="text-accent" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Courses;