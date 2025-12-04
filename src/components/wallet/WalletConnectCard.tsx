import React, { useState } from 'react';
import { Wallet, ExternalLink, Smartphone, Monitor, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useTranslation } from 'react-i18next';

const WalletConnectCard: React.FC = () => {
  const { t } = useTranslation();
  const { walletAddress, isConnecting, isPhantomInstalled, connectWallet, disconnectWallet } = usePhantomWallet();
  const [showInstructions, setShowInstructions] = useState(false);
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (walletAddress) {
    return (
      <div className="bg-secondary/10 rounded-xl p-4 mb-4 border border-secondary/30 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <CheckCircle className="text-secondary" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('wallet.walletConnected')}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={disconnectWallet}>
            {t('wallet.disconnect')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-xl p-4 mb-4 border border-border/30 animate-slide-up">
      {/* Main Connect Section */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Wallet className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{t('wallet.connectPhantom')}</p>
            <p className="text-xs text-muted-foreground">{t('wallet.requiredToWithdraw')}</p>
          </div>
        </div>
        <Button 
          variant="spiritual" 
          size="sm" 
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? t('wallet.connecting') : t('wallet.connect')}
        </Button>
      </div>

      {/* Instructions Toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showInstructions ? t('wallet.hideInstructions') : t('wallet.needHelp')}
      </button>

      {/* Expandable Instructions */}
      {showInstructions && (
        <div className="mt-3 pt-3 border-t border-border/30 space-y-4 animate-fade-in">
          {/* What is Phantom */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">{t('wallet.whatIsPhantom')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('wallet.phantomDescription')}
            </p>
          </div>

          {/* Device-specific instructions */}
          {isMobile ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Smartphone size={12} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('wallet.mobileSetup')}</p>
                  <ol className="text-xs text-muted-foreground mt-1 space-y-1.5 list-decimal list-inside">
                    <li>{t('wallet.mobileStep1')}</li>
                    <li>{t('wallet.mobileStep2')}</li>
                    <li>{t('wallet.mobileStep3')}</li>
                    <li>{t('wallet.mobileStep4')}</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex gap-2">
                <a
                  href="https://apps.apple.com/app/phantom-solana-wallet/id1598432977"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <ExternalLink size={12} />
                    App Store
                  </Button>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=app.phantom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <ExternalLink size={12} />
                    Play Store
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Monitor size={12} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('wallet.desktopSetup')}</p>
                  <ol className="text-xs text-muted-foreground mt-1 space-y-1.5 list-decimal list-inside">
                    <li>{t('wallet.desktopStep1')}</li>
                    <li>{t('wallet.desktopStep2')}</li>
                    <li>{t('wallet.desktopStep3')}</li>
                    <li>{t('wallet.desktopStep4')}</li>
                  </ol>
                </div>
              </div>
              
              <a
                href="https://phantom.app/download"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <ExternalLink size={12} />
                  {t('wallet.getPhantomExtension')}
                </Button>
              </a>
            </div>
          )}

          {/* Status indicator */}
          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
            isPhantomInstalled 
              ? 'bg-secondary/10 text-secondary' 
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isPhantomInstalled ? 'bg-secondary' : 'bg-muted-foreground'
            }`} />
            {isPhantomInstalled 
              ? t('wallet.phantomDetected')
              : t('wallet.phantomNotDetected')}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnectCard;
