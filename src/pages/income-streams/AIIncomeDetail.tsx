import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bot, ExternalLink, Settings, Play, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BotDashboardWrapper from '@/components/bot/BotDashboardWrapper';
import BotConnectionsManager from '@/components/bot/BotConnectionsManager';
import StrategySubscriptions from '@/components/bot/StrategySubscriptions';
import TradingDashboard from '@/components/bot/TradingDashboard';
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
  const [showDashboard, setShowDashboard] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for postMessage from iframe (when bot auth succeeds)
  useEffect(() => {
    if (!isLocalDev) return;

    const handleMessage = (event: MessageEvent) => {
      // Verify message is from the bot origin
      const botOrigin = isLocalDev ? 'http://localhost:5174' : 'https://sacredhealing-solana-copy-trading-bot-production.up.railway.app';
      if (event.origin !== botOrigin) return;

      // Handle auth success message
      if (event.data?.type === 'BOT_AUTH_SUCCESS' || event.data?.type === 'BOT_LOGIN_SUCCESS') {
        setShowDashboard(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isLocalDev]);

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

        {/* Tabs for different sections */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Connections</span>
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Strategies</span>
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Trades</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
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
                // Local development: Show auth page or dashboard in iframe
                <div className="w-full rounded-lg border border-border overflow-hidden bg-card" style={{ minHeight: '600px', height: 'calc(100vh - 300px)' }}>
                  {showDashboard ? (
                    <>
                      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                        <p className="text-sm text-muted-foreground">Bot Dashboard</p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDashboard(false)}
                            className="text-xs"
                          >
                            Back to Auth
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(BOT_DASHBOARD_URL, '_blank')}
                            className="text-xs"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                      <iframe
                        ref={iframeRef}
                        src={BOT_DASHBOARD_URL}
                        style={{ width: '100%', height: 'calc(100% - 48px)', border: 'none' }}
                        title="Copy Trading Bot Dashboard"
                        allow="clipboard-read; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                        <p className="text-sm text-muted-foreground">Bot Authentication</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDashboard(true)}
                          className="text-xs"
                        >
                          Already logged in? Go to Dashboard
                        </Button>
                      </div>
                      <iframe
                        ref={iframeRef}
                        src={BOT_AUTH_URL}
                        style={{ width: '100%', height: 'calc(100% - 48px)', border: 'none' }}
                        title="Copy Trading Bot Authentication"
                        allow="clipboard-read; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
                      />
                    </>
                  )}
                </div>
              ) : (
                // Production: Show dashboard
                <BotDashboardWrapper 
                  botUrl={BOT_DASHBOARD_URL}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="connections" className="mt-4">
            <BotConnectionsManager />
          </TabsContent>

          <TabsContent value="strategies" className="mt-4">
            <StrategySubscriptions />
          </TabsContent>

          <TabsContent value="trades" className="mt-4">
            <TradingDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIIncomeDetail;
