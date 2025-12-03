import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString: () => string } | null;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  off: (event: string, callback: (args: any) => void) => void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isIOS = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const getPhantomDeepLink = () => {
  // Use Phantom's connect deep link which properly handles the wallet connection flow
  const currentUrl = window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  // phantom://browse opens the URL in Phantom's in-app browser
  return `https://phantom.app/ul/browse/${encodedUrl}`;
};

const getAppStoreLink = () => {
  if (isIOS()) {
    return 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977';
  }
  return 'https://play.google.com/store/apps/details?id=app.phantom';
};

// Check if we're inside Phantom's in-app browser
const isInPhantomBrowser = () => {
  return typeof window !== 'undefined' && window.solana?.isPhantom;
};

export const usePhantomWallet = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkPhantom = () => {
      const provider = window.solana;
      setIsPhantomInstalled(!!provider?.isPhantom);
      
      if (provider?.publicKey) {
        setWalletAddress(provider.publicKey.toString());
      }
    };

    // Check immediately and after a short delay (Phantom may load after page)
    checkPhantom();
    const timeout = setTimeout(checkPhantom, 500);

    return () => clearTimeout(timeout);
  }, []);

  const connectWallet = useCallback(async () => {
    const provider = window.solana;
    
    // If on mobile and Phantom not detected
    if (!provider?.isPhantom) {
      if (isMobile()) {
        toast({
          title: "Opening Phantom App",
          description: "If Phantom doesn't open, please install it first from the app store."
        });
        
        // Try deep link to open in Phantom's browser
        const deepLink = getPhantomDeepLink();
        
        // Create a hidden link and click it for better mobile support
        const link = document.createElement('a');
        link.href = deepLink;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return null;
      } else {
        // Desktop - show helpful message
        toast({
          title: "Install Phantom Wallet",
          description: "Click the help link below for installation instructions.",
          variant: "destructive"
        });
        return null;
      }
    }

    setIsConnecting(true);
    
    try {
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // First check if wallet already exists
        const { data: existingWallet } = await supabase
          .from('user_wallets')
          .select('id')
          .eq('user_id', user.id)
          .eq('wallet_address', address)
          .single();

        if (!existingWallet) {
          // Insert new wallet
          const { error } = await supabase
            .from('user_wallets')
            .insert({
              user_id: user.id,
              wallet_address: address,
              wallet_type: 'phantom',
              is_primary: true
            });

          if (error) {
            console.error('Error saving wallet:', error);
          }
        }
      }

      toast({
        title: "Wallet connected",
        description: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`
      });

      return address;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnectWallet = useCallback(async () => {
    const provider = window.solana;
    
    try {
      await provider?.disconnect();
      setWalletAddress(null);
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected"
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [toast]);

  return {
    walletAddress,
    isConnecting,
    isPhantomInstalled,
    connectWallet,
    disconnectWallet
  };
};
