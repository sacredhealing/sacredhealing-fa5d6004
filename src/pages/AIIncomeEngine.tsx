import React from 'react';
import { Bot, TrendingUp, Zap, Shield, DollarSign, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AIIncomeEngine: React.FC = () => {
  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Trading',
      description: 'Advanced algorithms analyze markets 24/7 to find optimal trading opportunities.',
    },
    {
      icon: TrendingUp,
      title: 'Passive Income',
      description: 'Let AI work for you while you focus on your spiritual journey.',
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Built-in safeguards and stop-loss mechanisms to protect your investment.',
    },
    {
      icon: Clock,
      title: '24/7 Automation',
      description: 'Never miss an opportunity - our AI monitors markets around the clock.',
    },
  ];

  const plans = [
    {
      name: 'Starter',
      amount: '$100',
      returns: '5-10%',
      period: 'Monthly',
      featured: false,
    },
    {
      name: 'Growth',
      amount: '$500',
      returns: '8-15%',
      period: 'Monthly',
      featured: true,
    },
    {
      name: 'Premium',
      amount: '$1,000+',
      returns: '10-20%',
      period: 'Monthly',
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-blue-500/30 border border-emerald-500/30 p-8 mb-8">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          
          <h1 className="text-3xl font-heading font-bold text-foreground mb-3">
            AI Income Engine
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Harness the power of artificial intelligence to generate passive income through automated trading strategies.
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$2.5M+</p>
                <p className="text-xs text-muted-foreground">Generated returns</p>
              </div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12.5%</p>
                <p className="text-xs text-muted-foreground">Avg. monthly return</p>
              </div>
            </div>
          </div>
          
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Get Started
          </Button>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-8">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">How It Works</h2>
        <div className="grid grid-cols-1 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="p-4 bg-muted/30 border-border/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Investment Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Investment Plans</h2>
        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-5 ${plan.featured 
                ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border-emerald-500/50' 
                : 'bg-muted/30 border-border/30'
              }`}
            >
              {plan.featured && (
                <Badge className="bg-emerald-500 text-white mb-3">Most Popular</Badge>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">Min. investment: {plan.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">{plan.returns}</p>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                </div>
              </div>
              <Button 
                variant={plan.featured ? "default" : "outline"} 
                className={`w-full ${plan.featured ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}
              >
                Choose Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="p-4 bg-amber-500/10 border-amber-500/30">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Investment Disclaimer</h4>
            <p className="text-xs text-muted-foreground">
              Past performance is not indicative of future results. All investments carry risk. 
              Only invest what you can afford to lose. Results may vary.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIIncomeEngine;
