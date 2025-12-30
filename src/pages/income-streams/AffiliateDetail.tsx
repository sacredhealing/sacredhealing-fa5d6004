import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Check, ExternalLink, DollarSign, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AffiliateDetail: React.FC = () => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Income Streams</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Affiliate Program</h1>
            <Badge variant="secondary" className="mt-1">Popular</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Overview */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              What is it?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Our affiliate program allows you to earn commissions by referring new users to the platform. 
              When someone signs up using your unique referral link and makes a purchase, you earn a percentage of their transaction.
            </p>
            <p>
              This is a great way to earn passive income while helping others discover our spiritual wellness platform.
            </p>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                { step: 1, title: 'Get Your Link', desc: 'Go to the Promote page and copy your unique referral link.' },
                { step: 2, title: 'Share It', desc: 'Share your link with friends, on social media, or your website.' },
                { step: 3, title: 'Earn Commissions', desc: 'When someone signs up and makes a purchase, you earn a commission.' },
                { step: 4, title: 'Get Paid', desc: 'Withdraw your earnings via bank transfer or crypto wallet.' },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
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

        {/* Benefits */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'Competitive commission rates',
                'Real-time tracking dashboard',
                'Multiple payout options (bank, crypto)',
                'No limit on earnings',
                'Lifetime referral tracking',
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Button className="w-full" size="lg" asChild>
            <Link to="/promote">
              <Share2 className="w-4 h-4 mr-2" />
              Get Started with Affiliate Program
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/wallet">
              View Your Earnings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDetail;
