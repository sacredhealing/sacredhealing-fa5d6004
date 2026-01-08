import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bot, Wallet, TrendingUp, History, Settings, Play, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BotDashboardWrapper from '@/components/bot/BotDashboardWrapper';
import GifDisplay from '@/components/ui/GifDisplay';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Maha Lakshmi GIF URL - Update this with the actual GIF URL
const MAHA_LAKSHMI_GIF = 'https://i.imgur.com/maha-lakshmi.gif'; // Replace with actual GIF URL

// Bot dashboard URL from Railway
const BOT_DASHBOARD_URL = 'https://sacredhealing-solana-copy-trading-bot-production.up.railway.app/dashboard';

const AIIncomeDetail: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'actions'>('dashboard');

  const handleStartBot = () => {
    // Scroll to dashboard or trigger bot start
    setActiveTab('dashboard');
    // The bot dashboard will handle the actual start logic
  };

  const handleDeposit = async () => {
    if (!user) {
      toast.error('Please sign in to deposit');
      return;
    }

    setIsLoadingPayment(true);
    try {
      // Create Stripe checkout for bot deposit
      const { data, error } = await supabase.functions.invoke('create-bot-checkout', {
        body: {
          type: 'deposit',
          amount: null, // Let user choose in bot dashboard
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to open deposit. Please try again.');
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleWithdraw = () => {
    // Navigate to withdraw section in bot dashboard
    setActiveTab('dashboard');
    // Bot dashboard handles withdrawal logic
  };

  const handleTradeHistory = () => {
    // Navigate to history section in bot dashboard
    setActiveTab('dashboard');
    // Bot dashboard handles history display
  };

  const handleSettings = () => {
    // Navigate to settings section in bot dashboard
    setActiveTab('dashboard');
    // Bot dashboard handles settings
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 bg-gradient-to-br from-violet-500/10 to-purple-600/5 border-b border-border/50">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('common.back', 'Back to Income Streams')}</span>
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shreem Brzee Freedom Bot</h1>
            <Badge variant="secondary" className="mt-1">AI Trading Bot</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 pt-4">
        {/* Maha Lakshmi GIF */}
        <GifDisplay 
          src={MAHA_LAKSHMI_GIF}
          alt="Maha Lakshmi - Goddess of Wealth and Prosperity"
          className="rounded-lg"
        />

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleStartBot}
            className="w-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Bot
          </Button>
          
          <Button
            onClick={handleDeposit}
            variant="outline"
            className="w-full"
            size="lg"
            disabled={isLoadingPayment}
          >
            {isLoadingPayment ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4 mr-2" />
            )}
            Deposit
          </Button>

          <Button
            onClick={handleWithdraw}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Withdraw
          </Button>

          <Button
            onClick={handleTradeHistory}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>

        {/* Settings Button */}
        <Button
          onClick={handleSettings}
          variant="ghost"
          className="w-full"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>

        {/* Bot Dashboard */}
        <div className="pt-2">
          <h2 className="text-lg font-semibold text-foreground mb-3">Bot Dashboard</h2>
          <BotDashboardWrapper 
            botUrl={BOT_DASHBOARD_URL}
            onPaymentRequired={handleDeposit}
          />
        </div>

        {/* Help Text */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong className="text-foreground">Tip:</strong> Use the buttons above to quickly access bot features. 
              The dashboard below gives you full control over your trading bot.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIIncomeDetail;
