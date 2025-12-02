import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Smartphone, Share, Plus, MoreVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto pt-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>

          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Already Installed!</h1>
            <p className="text-muted-foreground">
              Sacred Healing is installed on your device. Look for it on your home screen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Install Sacred Healing</h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {/* Benefits */}
        <Card className="p-6 mb-8 bg-card border-border">
          <h2 className="font-semibold text-foreground mb-4">Why Install?</h2>
          <ul className="space-y-3">
            {[
              'Instant access from your home screen',
              'Works offline for meditations',
              'Faster loading & better performance',
              'Push notifications for daily reminders',
              'Full-screen immersive experience'
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-muted-foreground">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </Card>

        {/* Installation Instructions */}
        {isIOS ? (
          <Card className="p-6 bg-card border-border">
            <h2 className="font-semibold text-foreground mb-4">Install on iOS</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <p className="text-foreground">Tap the Share button</p>
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg w-fit">
                    <Share className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">in Safari toolbar</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <div>
                  <p className="text-foreground">Scroll and tap "Add to Home Screen"</p>
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg w-fit">
                    <Plus className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Add to Home Screen</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <p className="text-foreground">Tap "Add" to confirm</p>
              </div>
            </div>
          </Card>
        ) : deferredPrompt ? (
          <Button 
            onClick={handleInstall}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="w-5 h-5 mr-2" />
            Install Now
          </Button>
        ) : (
          <Card className="p-6 bg-card border-border">
            <h2 className="font-semibold text-foreground mb-4">Install on Android</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <p className="text-foreground">Tap the menu button</p>
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg w-fit">
                    <MoreVertical className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">in Chrome</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <div>
                  <p className="text-foreground">Tap "Install app" or "Add to Home screen"</p>
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg w-fit">
                    <Download className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Install app</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <p className="text-foreground">Confirm installation</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Install;
