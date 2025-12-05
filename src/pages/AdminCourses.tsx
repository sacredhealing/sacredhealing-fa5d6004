import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, BookOpen, Loader2, Save, Video, FileText, Music, Type, Edit2, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty_level: string;
  duration_hours: number;
  is_free: boolean;
  is_premium_only: boolean;
  price_usd: number;
  price_shc: number;
  has_certificate: boolean;
  instructor_name: string;
  enrollment_count: number;
  lesson_count: number;
  recurring_price_usd: number | null;
  recurring_interval: string | null;
  language: string;
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

const categories = ['healing', 'yoga', 'meditation', 'spiritual', 'wellness', 'mindfulness', 'abundance'];
const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
];

const AdminCourses: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'healing',
    difficulty_level: 'beginner',
    duration_hours: 1,
    is_free: false,
    is_premium_only: false,
    price_usd: 49.99,
    price_shc: 0,
    has_certificate: true,
    instructor_name: 'Sacred Healing Academy',
    recurring_price_usd: null as number | null,
    recurring_interval: null as string | null,
    language: 'en',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content_type: 'video',
    content_url: '',
    text_content: '',
    duration_minutes: 10,
    is_preview: false,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCourses(data as Course[]);
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (data) setLessons(data);
  };

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      category: 'healing',
      difficulty_level: 'beginner',
      duration_hours: 1,
      is_free: false,
      is_premium_only: false,
      price_usd: 49.99,
      price_shc: 0,
      has_certificate: true,
      instructor_name: 'Sacred Healing Academy',
      recurring_price_usd: null,
      recurring_interval: null,
      language: 'en',
    });
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from('courses').insert(courseForm);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Course created!' });
      resetCourseForm();
      fetchCourses();
    }
    setIsLoading(false);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      category: course.category,
      difficulty_level: course.difficulty_level,
      duration_hours: course.duration_hours,
      is_free: course.is_free,
      is_premium_only: course.is_premium_only,
      price_usd: course.price_usd,
      price_shc: course.price_shc,
      has_certificate: course.has_certificate,
      instructor_name: course.instructor_name || 'Sacred Healing Academy',
      recurring_price_usd: course.recurring_price_usd,
      recurring_interval: course.recurring_interval,
      language: course.language || 'en',
    });
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('courses')
      .update(courseForm)
      .eq('id', editingCourse.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Course updated!' });
      setEditingCourse(null);
      resetCourseForm();
      fetchCourses();
    }
    setIsLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
    resetCourseForm();
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all its lessons?')) return;
    
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetchCourses();
      if (selectedCourse?.id === id) setSelectedCourse(null);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setIsLoading(true);

    const lessonData = {
      title: lessonForm.title,
      description: lessonForm.content_type === 'text' ? lessonForm.text_content : lessonForm.description,
      content_type: lessonForm.content_type,
      content_url: lessonForm.content_type === 'text' ? null : lessonForm.content_url,
      duration_minutes: lessonForm.duration_minutes,
      is_preview: lessonForm.is_preview,
      course_id: selectedCourse.id,
      order_index: lessons.length,
    };

    const { error } = await supabase.from('lessons').insert(lessonData);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await supabase
        .from('courses')
        .update({ lesson_count: lessons.length + 1 })
        .eq('id', selectedCourse.id);

      toast({ title: 'Lesson added!' });
      setLessonForm({
        title: '',
        description: '',
        content_type: 'video',
        content_url: '',
        text_content: '',
        duration_minutes: 10,
        is_preview: false,
      });
      fetchLessons(selectedCourse.id);
      fetchCourses();
    }
    setIsLoading(false);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedCourse) return;
    
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await supabase
        .from('courses')
        .update({ lesson_count: Math.max(0, lessons.length - 1) })
        .eq('id', selectedCourse.id);
      fetchLessons(selectedCourse.id);
      fetchCourses();
    }
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(l => l.code === code) || languages[0];
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Course Manager</h1>
            <p className="text-muted-foreground">Create, edit and manage courses & lessons</p>
          </div>
        </div>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="lessons" disabled={!selectedCourse}>
              Lessons {selectedCourse && `(${selectedCourse.title})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {/* Create/Edit Course Form */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {editingCourse ? (
                  <>
                    <Edit2 className="w-5 h-5" />
                    Edit Course: {editingCourse.title}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create New Course
                  </>
                )}
                {editingCourse && (
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="ml-auto">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </h2>

              <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="Introduction to Chakra Healing"
                      required
                    />
                  </div>
                  <div>
                    <Label>Instructor</Label>
                    <Input
                      value={courseForm.instructor_name}
                      onChange={(e) => setCourseForm({ ...courseForm, instructor_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Learn the fundamentals of chakra healing..."
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Category</Label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-background border border-input"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <select
                      value={courseForm.difficulty_level}
                      onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-background border border-input"
                    >
                      {difficultyLevels.map(level => (
                        <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Duration (hours)</Label>
                    <Input
                      type="number"
                      value={courseForm.duration_hours}
                      onChange={(e) => setCourseForm({ ...courseForm, duration_hours: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      Language
                    </Label>
                    <select
                      value={courseForm.language}
                      onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-background border border-input"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>One-Time Price (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={courseForm.price_usd}
                      onChange={(e) => setCourseForm({ ...courseForm, price_usd: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Recurring Payment Section */}
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Recurring Payment Option</Label>
                    <Switch
                      checked={courseForm.recurring_interval !== null}
                      onCheckedChange={(checked) => setCourseForm({ 
                        ...courseForm, 
                        recurring_interval: checked ? 'month' : null,
                        recurring_price_usd: checked ? 19.99 : null
                      })}
                    />
                  </div>
                  
                  {courseForm.recurring_interval && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Recurring Price (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={courseForm.recurring_price_usd || ''}
                          onChange={(e) => setCourseForm({ ...courseForm, recurring_price_usd: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Billing Interval</Label>
                        <select
                          value={courseForm.recurring_interval}
                          onChange={(e) => setCourseForm({ ...courseForm, recurring_interval: e.target.value })}
                          className="w-full h-10 px-3 rounded-md bg-background border border-input"
                        >
                          <option value="month">Monthly</option>
                          <option value="year">Yearly</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={courseForm.is_free}
                      onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_free: checked })}
                    />
                    <Label>Free Course</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={courseForm.is_premium_only}
                      onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_premium_only: checked })}
                    />
                    <Label>Premium Members Only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={courseForm.has_certificate}
                      onCheckedChange={(checked) => setCourseForm({ ...courseForm, has_certificate: checked })}
                    />
                    <Label>Certificate on Completion</Label>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </form>
            </Card>

            {/* Courses List */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Existing Courses ({courses.length})
              </h2>

              {courses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No courses created yet</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => {
                    const langInfo = getLanguageInfo(course.language || 'en');
                    return (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedCourse?.id === course.id ? 'bg-primary/10 border-primary' : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{course.title}</h3>
                            <span className="text-lg" title={langInfo.name}>{langInfo.flag}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {course.category} • {course.difficulty_level} • {course.lesson_count} lessons • {course.enrollment_count} enrolled
                            {course.is_free && <span className="text-green-500 ml-2">FREE</span>}
                            {course.is_premium_only && <span className="text-primary ml-2">PREMIUM</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            ${course.price_usd}
                            {course.recurring_price_usd && (
                              <span className="text-primary ml-2">
                                + ${course.recurring_price_usd}/{course.recurring_interval}
                              </span>
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCourse(course);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCourse(course.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            {selectedCourse && (
              <>
                {/* Add Lesson Form */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Lesson to "{selectedCourse.title}"
                  </h2>

                  <form onSubmit={handleAddLesson} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Lesson Title</Label>
                        <Input
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                          placeholder="Introduction"
                          required
                        />
                      </div>
                      <div>
                        <Label>Content Type</Label>
                        <select
                          value={lessonForm.content_type}
                          onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                          className="w-full h-10 px-3 rounded-md bg-background border border-input"
                        >
                          <option value="video">Video</option>
                          <option value="audio">Audio</option>
                          <option value="text">Text/Article</option>
                          <option value="pdf">PDF</option>
                        </select>
                      </div>
                    </div>

                    {lessonForm.content_type === 'text' ? (
                      <div>
                        <Label>Text Content</Label>
                        <Textarea
                          value={lessonForm.text_content}
                          onChange={(e) => setLessonForm({ ...lessonForm, text_content: e.target.value })}
                          placeholder="Write your lesson content here..."
                          className="min-h-[200px]"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                            placeholder="Brief description of this lesson..."
                          />
                        </div>
                        <div>
                          <Label>Content URL</Label>
                          <Input
                            value={lessonForm.content_url}
                            onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={lessonForm.duration_minutes}
                          onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={lessonForm.is_preview}
                          onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_preview: checked })}
                        />
                        <Label>Free Preview</Label>
                      </div>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Lesson
                    </Button>
                  </form>
                </Card>

                {/* Lessons List */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Lessons ({lessons.length})
                  </h2>

                  {lessons.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No lessons yet</p>
                  ) : (
                    <div className="space-y-2">
                      {lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {lesson.content_type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                              {lesson.content_type === 'audio' && <Music className="w-4 h-4 text-purple-500" />}
                              {lesson.content_type === 'text' && <Type className="w-4 h-4 text-green-500" />}
                              {lesson.content_type === 'pdf' && <FileText className="w-4 h-4 text-red-500" />}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {lesson.duration_minutes} min
                                {lesson.is_preview && <span className="text-primary ml-2">• Preview</span>}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCourses;