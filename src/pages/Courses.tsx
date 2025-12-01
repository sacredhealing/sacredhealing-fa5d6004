import React from 'react';
import { Play, Lock, Award, Clock, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const courses = [
  {
    id: 1,
    title: 'Introduction to Meditation',
    description: 'Learn the basics of mindfulness and meditation practice',
    lessons: 5,
    duration: '45 min',
    reward: 30,
    progress: 100,
    locked: false,
    badge: '🧘'
  },
  {
    id: 2,
    title: 'Chakra Healing Fundamentals',
    description: 'Understand and balance your seven energy centers',
    lessons: 7,
    duration: '1.5 hr',
    reward: 100,
    progress: 60,
    locked: false,
    badge: '🌈'
  },
  {
    id: 3,
    title: 'Advanced Energy Work',
    description: 'Master advanced healing techniques and energy manipulation',
    lessons: 12,
    duration: '3 hr',
    reward: 200,
    progress: 0,
    locked: true,
    shcCost: 500,
    badge: '⚡'
  },
  {
    id: 4,
    title: 'Sacred Breathwork',
    description: 'Transform your life through powerful breathing exercises',
    lessons: 8,
    duration: '2 hr',
    reward: 150,
    progress: 0,
    locked: true,
    shcCost: 300,
    badge: '💨'
  },
  {
    id: 5,
    title: 'Manifestation Mastery',
    description: 'Learn to create your reality with intention and focus',
    lessons: 10,
    duration: '2.5 hr',
    reward: 200,
    progress: 0,
    locked: true,
    premium: true,
    badge: '✨'
  },
];

const Courses: React.FC = () => {
  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">Courses</h1>
        <p className="text-muted-foreground mt-1">Expand your consciousness</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <p className="text-2xl font-heading font-bold text-primary">1</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <p className="text-2xl font-heading font-bold text-secondary">1</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <p className="text-2xl font-heading font-bold text-accent">3</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {courses.map((course, index) => (
          <div
            key={course.id}
            className={`relative overflow-hidden rounded-2xl border p-5 animate-slide-up transition-all duration-300 ${
              course.locked
                ? 'bg-muted/20 border-border/30'
                : 'bg-gradient-card border-border/50 hover:scale-[1.02]'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Badge indicators */}
            <div className="absolute top-3 right-3 flex gap-2">
              {course.progress === 100 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-secondary/20 rounded-full">
                  <CheckCircle size={12} className="text-secondary" />
                  <span className="text-xs font-medium text-secondary">Done</span>
                </div>
              )}
              {course.premium && (
                <div className="px-2 py-1 bg-accent/20 rounded-full">
                  <span className="text-xs font-medium text-accent">Premium</span>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {/* Course icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                course.locked ? 'bg-muted/30' : 'bg-primary/20'
              }`}>
                {course.locked ? <Lock size={24} className="text-muted-foreground" /> : course.badge}
              </div>

              <div className="flex-1">
                <h3 className={`font-heading font-semibold ${
                  course.locked ? 'text-muted-foreground' : 'text-foreground'
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
                    {course.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={12} className="text-accent" />
                    +{course.reward} SHC
                  </span>
                </div>

                {/* Progress or unlock */}
                {!course.locked && course.progress > 0 && course.progress < 100 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-healing rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {course.locked && (
                  <div className="mt-3">
                    {course.premium ? (
                      <Button variant="gold" size="sm">
                        <Sparkles size={14} />
                        Unlock with Premium
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Sparkles size={14} className="text-accent" />
                        Unlock for {course.shcCost} SHC
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
