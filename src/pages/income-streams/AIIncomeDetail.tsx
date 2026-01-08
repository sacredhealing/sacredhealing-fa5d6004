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

// Bot dashboard URLs
const PRODUCTION_BOT_URL = 'https://sacredhealing-solana-copy-trading-bot-production.up.railway.app/dashboard';
const LOCAL_BOT_AUTH_URL = 'http://localhost:5174/auth'; // Local auth page
const LOCAL_BOT_DASHBOARD_URL = 'http://localhost:5174/dashboard'; // Local dashboard
const PRODUCTION_BOT_AUTH_URL = 'https://sacredhealing-solana-copy-trading-bot-production.up.railway.app/auth';

// Detect if we're in local development
const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''
);

// Use local server if in development, otherwise use production
const BOT_AUTH_URL = isLocalDev ? LOCAL_BOT_AUTH_URL : PRODUCTION_BOT_AUTH_URL;
const BOT_DASHBOARD_URL = isLocalDev ? LOCAL_BOT_DASHBOARD_URL : PRODUCTION_BOT_URL;

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

        {/* Bot Auth / Dashboard */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isLocalDev ? 'Bot Authentication' : 'Bot Dashboard'}
            </h2>
            {isLocalDev && (
              <Badge variant="outline" className="text-xs">
                🏠 Local Server (localhost:5174)
              </Badge>
            )}
          </div>
          
          {isLocalDev ? (
            // Local development: Show auth page in iframe
            <div className="w-full rounded-lg border border-border overflow-hidden" style={{ height: '600px' }}>
              <iframe
                src={BOT_AUTH_URL}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Copy Trading Bot Authentication"
                allow="clipboard-read; clipboard-write"
              />
            </div>
          ) : (
            // Production: Show dashboard
            <BotDashboardWrapper 
              botUrl={BOT_DASHBOARD_URL}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIIncomeDetail;
