import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Check, ExternalLink, AlertTriangle, BarChart3, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CopyTradingDetail: React.FC = () => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Income Streams</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Copy Trading</h1>
            <Badge variant="secondary" className="mt-1">Passive Income</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Overview */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              What is Copy Trading?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Copy trading allows you to automatically replicate the trades of professional forex and crypto traders. 
              When they trade, your account trades too—hands-free.
            </p>
            <p>
              This is ideal for beginners who want exposure to trading without needing to learn complex strategies.
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
                { step: 1, title: 'Choose a Platform', desc: 'Sign up with a copy trading platform like eToro, ZuluTrade, or NAGA.' },
                { step: 2, title: 'Fund Your Account', desc: 'Deposit funds into your trading account (minimum varies by platform).' },
                { step: 3, title: 'Select Traders', desc: 'Browse and select professional traders based on their track record.' },
                { step: 4, title: 'Start Copying', desc: 'Allocate funds to your chosen traders and let the automation begin.' },
                { step: 5, title: 'Monitor & Adjust', desc: 'Track performance and adjust your portfolio as needed.' },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 font-semibold text-sm">
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'No trading experience required',
                'Fully automated—set and forget',
                'Diversify across multiple traders',
                'Access professional strategies',
                'Start with small amounts',
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommended Platforms */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recommended Platforms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'eToro', desc: 'Beginner-friendly, social trading', url: 'https://www.etoro.com' },
              { name: 'ZuluTrade', desc: 'Wide selection of traders', url: 'https://www.zulutrade.com' },
              { name: 'NAGA', desc: 'Stocks, crypto & forex', url: 'https://www.naga.com' },
            ].map((platform) => (
              <a 
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">{platform.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Risk Disclaimer */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Risk Disclaimer</h4>
                <p className="text-sm text-muted-foreground">
                  Trading involves substantial risk of loss. Past performance of traders does not guarantee future results. 
                  Only trade with money you can afford to lose. Consider seeking advice from a financial advisor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button className="w-full" size="lg" onClick={() => window.open('https://www.etoro.com', '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Explore eToro Copy Trading
        </Button>
      </div>
    </div>
  );
};

export default CopyTradingDetail;
