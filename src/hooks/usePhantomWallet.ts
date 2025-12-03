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
  const currentUrl = encodeURIComponent(window.location.href);
  return `https://phantom.app/ul/browse/${currentUrl}?ref=${currentUrl}`;
};

const getAppStoreLink = () => {
  if (isIOS()) {
    return 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977';
  }
  return 'https://play.google.com/store/apps/details?id=app.phantom';
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
    
    // If on mobile and Phantom not detected, use deep link
    if (!provider?.isPhantom) {
      if (isMobile()) {
        toast({
          title: "Opening Phantom",
          description: "Redirecting to Phantom app..."
        });
        // Try deep link first, which opens Phantom if installed
        window.location.href = getPhantomDeepLink();
        
        // Fallback to app store after short delay if deep link doesn't work
        setTimeout(() => {
          toast({
            title: "Phantom not installed?",
            description: "Download Phantom from the app store",
          });
          window.open(getAppStoreLink(), '_blank');
        }, 2500);
        return null;
      } else {
        // Desktop - open Phantom website
        toast({
          title: "Phantom not found",
          description: "Please install Phantom wallet extension",
          variant: "destructive"
        });
        window.open('https://phantom.app/', '_blank');
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
