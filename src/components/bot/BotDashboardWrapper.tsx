import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BotDashboardWrapperProps {
  botUrl: string;
  onPaymentRequired?: () => void;
}

const BotDashboardWrapper: React.FC<BotDashboardWrapperProps> = ({ 
  botUrl, 
  onPaymentRequired 
}) => {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Reset loading state when user changes
    if (user && session) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [user, session]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
  };

  // Build iframe URL with authentication token if available
  const getIframeUrl = () => {
    if (!botUrl) return '';
    
    const url = new URL(botUrl);
    if (session?.access_token) {
      // Pass auth token as query param (bot should validate this)
      url.searchParams.set('token', session.access_token);
      url.searchParams.set('userId', user?.id || '');
      url.searchParams.set('email', user?.email || '');
    }
    return url.toString();
  };

  if (!user) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Please sign in to access the bot dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading bot dashboard...</p>
          </div>
        </div>
      )}

      {hasError && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Failed to load bot dashboard. Please try again.
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasError && (
        <div className="w-full rounded-lg overflow-hidden border border-border/50 bg-card">
          <iframe
            key={iframeKey}
            src={getIframeUrl()}
            className="w-full"
            style={{ 
              minHeight: '600px',
              height: 'calc(100vh - 300px)',
              border: 'none'
            }}
            title="Shreem Brzee Freedom Bot Dashboard"
            allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture; autoplay"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
          />
        </div>
      )}
    </div>
  );
};

export default BotDashboardWrapper;

