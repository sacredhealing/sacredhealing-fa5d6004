import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bot, Check, ExternalLink, Sparkles, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AIIncomeDetail: React.FC = () => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Income Streams</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Income Engine</h1>
            <Badge variant="secondary" className="mt-1">New</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Overview */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              What is the AI Income Engine?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              The AI Income Engine teaches you how to leverage artificial intelligence tools to create 
              automated income streams. From content creation to digital products, AI can accelerate your path to financial freedom.
            </p>
            <p>
              No technical skills required—we guide you step by step.
            </p>
          </CardContent>
        </Card>

        {/* AI Income Ideas */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              AI-Powered Income Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                { title: 'AI Content Creation', desc: 'Use ChatGPT and Claude to write articles, social media posts, and marketing copy for clients.' },
                { title: 'AI Art & Design', desc: 'Create and sell AI-generated art, logos, and graphics using Midjourney or DALL-E.' },
                { title: 'AI Automation Services', desc: 'Help businesses automate tasks using tools like Zapier and Make with AI integrations.' },
                { title: 'AI-Powered Courses', desc: 'Create educational content using AI assistance and sell it online.' },
                { title: 'AI Chatbots', desc: 'Build and sell custom chatbots for businesses using no-code platforms.' },
              ].map((idea, index) => (
                <li key={index} className="p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium text-foreground mb-1">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground">{idea.desc}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                { step: 1, title: 'Choose Your Niche', desc: 'Pick an AI skill that interests you (writing, design, automation, etc.)' },
                { step: 2, title: 'Learn the Tools', desc: 'Master 1-2 AI tools relevant to your chosen niche.' },
                { step: 3, title: 'Build a Portfolio', desc: 'Create sample projects to showcase your AI-enhanced skills.' },
                { step: 4, title: 'Find Clients', desc: 'Use platforms like Fiverr, Upwork, or direct outreach to find clients.' },
                { step: 5, title: 'Scale with Systems', desc: 'Create templates and workflows to handle more clients efficiently.' },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center shrink-0 font-semibold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Recommended Tools */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recommended AI Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'ChatGPT', desc: 'Writing & content creation', url: 'https://chat.openai.com' },
              { name: 'Midjourney', desc: 'AI art generation', url: 'https://www.midjourney.com' },
              { name: 'Claude', desc: 'Advanced AI assistant', url: 'https://claude.ai' },
              { name: 'Canva AI', desc: 'Design with AI features', url: 'https://www.canva.com' },
            ].map((tool) => (
              <a 
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Button className="w-full" size="lg" asChild>
            <Link to="/ai-income">
              <Bot className="w-4 h-4 mr-2" />
              Explore AI Income Engine
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/courses">
              View AI Courses
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIIncomeDetail;
