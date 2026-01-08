import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BotDashboardWrapper from '@/components/bot/BotDashboardWrapper';
import GifDisplay from '@/components/ui/GifDisplay';

// Maha Lakshmi GIF URL - Update this with the actual GIF URL
// Common hosting options: Imgur, Giphy, or upload to your own CDN
const MAHA_LAKSHMI_GIF = 'https://i.imgur.com/your-gif-id.gif'; // Replace with actual GIF URL

// Bot dashboard URL from Railway
const BOT_DASHBOARD_URL = 'https://sacredhealing-solana-copy-trading-bot-production.up.railway.app/dashboard';

const AIIncomeDetail: React.FC = () => {
  const { t } = useTranslation();

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

        {/* Bot Dashboard */}
        <div className="pt-2">
          <h2 className="text-lg font-semibold text-foreground mb-3">Bot Dashboard</h2>
          <BotDashboardWrapper 
            botUrl={BOT_DASHBOARD_URL}
          />
        </div>
      </div>
    </div>
  );
};

export default AIIncomeDetail;
