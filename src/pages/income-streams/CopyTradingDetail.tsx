import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Check, ExternalLink, AlertTriangle, Percent, Zap, Users, CreditCard, MessageCircle } from 'lucide-react';
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
            <h1 className="text-2xl font-bold text-foreground">💹 Copy Trading</h1>
            <p className="text-sm text-muted-foreground">Automated Forex Income</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-3 text-center">
              <Percent className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="font-bold text-foreground text-sm">Up to 30%+</p>
              <p className="text-xs text-muted-foreground">monthly*</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-3 text-center">
              <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Effort</p>
              <p className="font-bold text-foreground text-sm">Fully</p>
              <p className="text-xs text-muted-foreground">Automated</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-3 text-center">
              <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="font-bold text-foreground text-sm">None</p>
              <p className="text-xs text-muted-foreground">needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              Earn from the forex market by automatically copying a professional trading system.
            </p>
          </CardContent>
        </Card>

        {/* Get Started Steps */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">🔗 Get Started in 3 Simple Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Create Your Trading Account</h4>
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => window.open('https://ultgo.com/yuE3Ub', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open an Ultima Markets Account
              </Button>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Open a Trading Account</h4>
                </div>
              </div>
              <div className="ml-11 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Under €2,000 → <span className="text-foreground font-medium">Cent Standard STP</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>€2,000+ → <span className="text-foreground font-medium">Standard STP</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Currency: <span className="text-foreground font-medium">USD</span></span>
                </div>
                <p className="text-xs text-muted-foreground italic mt-2">
                  (Account login details are sent to your email.)
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Join the Copy Trading System</h4>
                </div>
              </div>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={() => window.open('https://social.ultimamarkets.com/portal/registration/subscription/87738/ShreemBrzee', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Subscribe to Automated Copy Trading
              </Button>
              <div className="ml-11 space-y-2 text-sm">
                <p className="text-muted-foreground font-medium">Use these settings:</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Server: <span className="text-foreground font-medium">Ultima Markets Live 1</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Confirm Nickname: <span className="text-foreground font-medium">Shreem Brzee</span></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Split */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-lg">💰 Profit Split</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <span className="text-foreground font-medium">Your Profit</span>
              <Badge className="bg-green-500 text-white text-lg px-3">80%</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Sacred Healing (system provider)</span>
              <Badge variant="secondary" className="text-lg px-3">20%</Badge>
            </div>
            <div className="flex items-center gap-2 text-green-500 font-medium mt-2">
              <Check className="w-5 h-5" />
              <span>Free to join</span>
            </div>
          </CardContent>
        </Card>

        {/* Deposits & Withdrawals */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Deposits & Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-muted-foreground">
                  Minimum deposit: <span className="text-foreground font-medium">€50</span> (card or crypto)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-muted-foreground">Deposit & withdraw directly inside your Ultima Markets dashboard</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-muted-foreground">Built-in support chat available</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Risk Disclaimer */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium mb-1">⚠️ Trading involves risk. Results are not guaranteed.</p>
                <p className="text-sm text-muted-foreground">
                  Only invest what you can afford to lose.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/30">
          <CardContent className="p-4 text-center">
            <p className="text-foreground">
              ✨ Fully automated. Transparent. Scalable.
            </p>
            <p className="text-muted-foreground mt-2">
              Happy Trading,<br />
              <span className="font-semibold text-foreground">Shreem Brzee</span>
            </p>
          </CardContent>
        </Card>

        {/* Main CTA */}
        <Button 
          className="w-full bg-green-600 hover:bg-green-700" 
          size="lg" 
          onClick={() => window.open('https://ultgo.com/yuE3Ub', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Get Started Now
        </Button>
      </div>
    </div>
  );
};

export default CopyTradingDetail;
