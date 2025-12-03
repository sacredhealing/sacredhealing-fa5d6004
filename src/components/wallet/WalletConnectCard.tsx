import React, { useState } from 'react';
import { Wallet, ExternalLink, Smartphone, Monitor, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';

const WalletConnectCard: React.FC = () => {
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
              <p className="text-sm font-medium text-foreground">Wallet Connected</p>
              <p className="text-xs text-muted-foreground font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={disconnectWallet}>
            Disconnect
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
            <p className="text-sm font-medium text-foreground">Connect Phantom Wallet</p>
            <p className="text-xs text-muted-foreground">Required to withdraw SHC tokens</p>
          </div>
        </div>
        <Button 
          variant="spiritual" 
          size="sm" 
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      </div>

      {/* Instructions Toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showInstructions ? 'Hide instructions' : 'Need help? View setup instructions'}
      </button>

      {/* Expandable Instructions */}
      {showInstructions && (
        <div className="mt-3 pt-3 border-t border-border/30 space-y-4 animate-fade-in">
          {/* What is Phantom */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">What is Phantom?</h4>
            <p className="text-xs text-muted-foreground">
              Phantom is a secure crypto wallet for Solana. You need it to receive and store your SHC tokens.
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
                  <p className="text-sm font-medium text-foreground">Mobile Setup</p>
                  <ol className="text-xs text-muted-foreground mt-1 space-y-1.5 list-decimal list-inside">
                    <li>Download the Phantom app from your app store</li>
                    <li>Create a new wallet or import existing</li>
                    <li>Return here and tap "Connect"</li>
                    <li>Approve the connection in Phantom</li>
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
                  <p className="text-sm font-medium text-foreground">Desktop Setup</p>
                  <ol className="text-xs text-muted-foreground mt-1 space-y-1.5 list-decimal list-inside">
                    <li>Install the Phantom browser extension</li>
                    <li>Create a new wallet or import existing</li>
                    <li>Click "Connect" above</li>
                    <li>Approve the connection in the popup</li>
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
                  Get Phantom Extension
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
              ? 'Phantom detected - ready to connect!' 
              : 'Phantom not detected yet'}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnectCard;
