import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString: () => string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
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
    const checkPhantomAndReconnect = async () => {
      const provider = window.solana;
      setIsPhantomInstalled(!!provider?.isPhantom);
      
      // If Phantom is already connected, use that address
      if (provider?.publicKey) {
        setWalletAddress(provider.publicKey.toString());
        return;
      }
      
      // Try to auto-reconnect from saved wallet
      if (provider?.isPhantom) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: savedWallet } = await supabase
              .from('user_wallets')
              .select('wallet_address')
              .eq('user_id', user.id)
              .eq('is_primary', true)
              .maybeSingle();
            
            if (savedWallet) {
              // Try silent reconnect (doesn't prompt user)
              try {
                const response = await provider.connect({ onlyIfTrusted: true });
                if (response.publicKey) {
                  setWalletAddress(response.publicKey.toString());
                }
              } catch {
                // Silent reconnect failed - user will need to manually connect
                // This is expected if the user revoked permission
              }
            }
          }
        } catch (error) {
          console.error('Error checking saved wallet:', error);
        }
      }
    };

    // Check immediately and after a short delay (Phantom may load after page)
    checkPhantomAndReconnect();
    const timeout = setTimeout(checkPhantomAndReconnect, 500);

    return () => clearTimeout(timeout);
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      const provider = window.solana;
      
      // If Phantom not detected
      if (!provider?.isPhantom) {
        if (isMobile()) {
          toast({
            title: "Opening Phantom App",
            description: "If Phantom doesn't open, please install it first from the app store."
          });
          
          // Try deep link to open in Phantom's browser
          const deepLink = getPhantomDeepLink();
          window.location.href = deepLink;
          setIsConnecting(false);
          return null;
        } else {
          // Desktop - show helpful message
          toast({
            title: "Install Phantom Wallet",
            description: "Please install the Phantom browser extension first, then refresh the page.",
            variant: "destructive"
          });
          setIsConnecting(false);
          return null;
        }
      }

      // Phantom is installed, try to connect
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);

      // Save to database (optional - don't fail if this errors)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // First, unset any existing primary wallets for this user
          await supabase
            .from('user_wallets')
            .update({ is_primary: false })
            .eq('user_id', user.id)
            .eq('is_primary', true);

          // Check if this wallet already exists for the user
          const { data: existingWallet } = await supabase
            .from('user_wallets')
            .select('id')
            .eq('user_id', user.id)
            .eq('wallet_address', address)
            .maybeSingle();

          if (existingWallet) {
            // Update existing wallet to be primary
            await supabase
              .from('user_wallets')
              .update({ is_primary: true })
              .eq('id', existingWallet.id);
          } else {
            // Insert new wallet
            await supabase
              .from('user_wallets')
              .insert({
                user_id: user.id,
                wallet_address: address,
                wallet_type: 'phantom',
                is_primary: true
              });
          }
        }
      } catch (dbError) {
        console.error('Error saving wallet to database:', dbError);
        // Don't fail the connection just because DB save failed
      }

      toast({
        title: "Wallet connected",
        description: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`
      });

      return address;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      // Handle user rejection specifically
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        toast({
          title: "Connection cancelled",
          description: "You cancelled the wallet connection request.",
        });
      } else {
        toast({
          title: "Connection failed",
          description: error.message || "Failed to connect wallet. Please try again.",
          variant: "destructive"
        });
      }
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
