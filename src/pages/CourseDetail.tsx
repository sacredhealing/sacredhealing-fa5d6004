import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Lock, Award, Clock, CheckCircle, Loader2, Video, Music, Type, FileText, Globe, Wallet, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import WealthCourseUpsell from '@/components/courses/WealthCourseUpsell';
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
  const { t } = useTranslation();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<string | null>(null);
  const [showWealthUpsell, setShowWealthUpsell] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
      if (user) {
        fetchEnrollment();
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (course && enrollment) {
      fetchLessons();
    }
  }, [course, enrollment]);

  const fetchCourse = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

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
    if (!course || !enrollment) return;
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

  if (isLoading) {
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
              {isEnrolled ? (
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

          {/* Enrollment Status */}
          {isEnrolled && (
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

          {/* Enrollment Actions */}
          {!isEnrolled && (
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

        {/* Lessons Section */}
        {isEnrolled && lessons.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Course Lessons</h2>
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    if (lesson.content_url) {
                      if (lesson.content_type === 'video' || lesson.content_type === 'audio') {
                        window.open(lesson.content_url, '_blank');
                      } else {
                        window.open(lesson.content_url, '_blank');
                      }
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
                  <Play className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
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
