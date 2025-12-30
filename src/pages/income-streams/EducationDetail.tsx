import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Check, BookOpen, Video, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EducationDetail: React.FC = () => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Income Streams</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Education Hub</h1>
            <Badge variant="secondary" className="mt-1">Learn</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Overview */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Learn to Earn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Knowledge is the foundation of all income streams. Our education hub provides you with 
              courses, guides, and resources to master trading, investing, and building online income.
            </p>
            <p>
              Learn at your own pace and apply your knowledge to any of our other income streams.
            </p>
          </CardContent>
        </Card>

        {/* What You'll Learn */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">What You'll Learn</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'Cryptocurrency fundamentals and trading',
                'Forex trading basics and strategies',
                'Building passive income streams',
                'Affiliate marketing mastery',
                'Financial planning and wealth building',
                'AI tools for productivity and income',
              ].map((topic, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-500 shrink-0" />
                  <span className="text-muted-foreground">{topic}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Learning Paths */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Learning Paths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Beginner Investor', desc: 'Start from zero and learn the fundamentals', duration: '4 weeks' },
              { name: 'Crypto Trader', desc: 'Master cryptocurrency trading strategies', duration: '6 weeks' },
              { name: 'Passive Income Builder', desc: 'Create multiple income streams', duration: '8 weeks' },
            ].map((path) => (
              <div 
                key={path.name}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground">{path.name}</h4>
                  <Badge variant="outline" className="text-xs">{path.duration}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{path.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Community */}
        <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-primary" />
              <h4 className="font-medium text-foreground">Join the Learning Community</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Connect with fellow learners, share insights, and get support from our community of aspiring investors and traders.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/community">
                Join Community
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Button className="w-full" size="lg" asChild>
            <Link to="/courses">
              <GraduationCap className="w-4 h-4 mr-2" />
              Browse All Courses
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/spiritual-education">
              Spiritual Education
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EducationDetail;
