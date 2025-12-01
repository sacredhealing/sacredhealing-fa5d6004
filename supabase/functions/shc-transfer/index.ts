import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Connection, Keypair, PublicKey, Transaction } from "https://esm.sh/@solana/web3.js@1.98.0";
import { getAssociatedTokenAddress, createTransferInstruction, getAccount, createAssociatedTokenAccountInstruction } from "https://esm.sh/@solana/spl-token@0.4.9?deps=@solana/web3.js@1.98.0";
import { decode as decodeBase58 } from "https://deno.land/std@0.190.0/encoding/base58.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHC_MINT = Deno.env.get('SHC_TOKEN_MINT')!;
const TREASURY_PRIVATE_KEY = Deno.env.get('SOLANA_TREASURY_PRIVATE_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Solana mainnet RPC
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, amount, walletAddress } = await req.json();

    console.log(`SHC Transfer - Action: ${action}, Amount: ${amount}, User: ${user.id}`);

    if (action === 'withdraw') {
      // Check user balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError) throw balanceError;
      if (!balanceData || Number(balanceData.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // Get user's connected wallet
      let targetWallet = walletAddress;
      if (!targetWallet) {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('wallet_address')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();
        
        if (!wallet) {
          throw new Error('No wallet connected');
        }
        targetWallet = wallet.wallet_address;
      }

      // Create pending transaction
      const { data: tx, error: txError } = await supabase
        .from('shc_transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          description: `Withdrawal to ${targetWallet.slice(0, 8)}...`,
          wallet_address: targetWallet,
          status: 'pending'
        })
        .select()
        .single();

      if (txError) throw txError;

      let txSignature = '';
      
      try {
        // Initialize Solana connection
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        
        // Decode treasury private key (base58 encoded)
        const treasuryKeypair = Keypair.fromSecretKey(decodeBase58(TREASURY_PRIVATE_KEY));
        const mintPubkey = new PublicKey(SHC_MINT);
        const recipientPubkey = new PublicKey(targetWallet);
        
        console.log(`Treasury: ${treasuryKeypair.publicKey.toString()}`);
        console.log(`Recipient: ${recipientPubkey.toString()}`);
        console.log(`Mint: ${mintPubkey.toString()}`);

        // Get associated token accounts
        const treasuryATA = await getAssociatedTokenAddress(mintPubkey, treasuryKeypair.publicKey);
        const recipientATA = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

        console.log(`Treasury ATA: ${treasuryATA.toString()}`);
        console.log(`Recipient ATA: ${recipientATA.toString()}`);

        // Build transaction
        const transaction = new Transaction();

        // Check if recipient has an ATA, if not create it
        try {
          await getAccount(connection, recipientATA);
          console.log('Recipient ATA exists');
        } catch {
          console.log('Creating recipient ATA');
          transaction.add(
            createAssociatedTokenAccountInstruction(
              treasuryKeypair.publicKey,
              recipientATA,
              recipientPubkey,
              mintPubkey
            )
          );
        }

        // SHC has 9 decimals typically - adjust based on your token
        const TOKEN_DECIMALS = 9;
        const transferAmount = BigInt(Math.floor(amount * Math.pow(10, TOKEN_DECIMALS)));

        console.log(`Transfer amount (raw): ${transferAmount}`);

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            treasuryATA,
            recipientATA,
            treasuryKeypair.publicKey,
            transferAmount
          )
        );

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = treasuryKeypair.publicKey;

        // Sign and send transaction
        transaction.sign(treasuryKeypair);
        txSignature = await connection.sendRawTransaction(transaction.serialize());
        
        console.log(`Transaction sent: ${txSignature}`);

        // Wait for confirmation
        await connection.confirmTransaction(txSignature, 'confirmed');
        console.log(`Transaction confirmed: ${txSignature}`);

      } catch (solanaError: unknown) {
        const errorMessage = solanaError instanceof Error ? solanaError.message : 'Unknown Solana error';
        console.error('Solana transfer error:', errorMessage);
        
        // Mark transaction as failed
        await supabase
          .from('shc_transactions')
          .update({ status: 'failed' })
          .eq('id', tx.id);
        
        throw new Error(`Transfer failed: ${errorMessage}`);
      }

      // Update balance
      const newBalance = Number(balanceData.balance) - amount;
      await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          total_spent: Number(balanceData.balance) + amount 
        })
        .eq('user_id', user.id);

      // Mark transaction as completed
      await supabase
        .from('shc_transactions')
        .update({ 
          status: 'completed',
          tx_signature: txSignature
        })
        .eq('id', tx.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Withdrawal processed',
          txSignature,
          newBalance 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'earn') {
      // Add SHC to user's in-app balance
      const { data: existingBalance } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingBalance) {
        await supabase
          .from('user_balances')
          .update({ 
            balance: Number(existingBalance.balance) + amount,
            total_earned: Number(existingBalance.total_earned) + amount 
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_balances')
          .insert({ 
            user_id: user.id, 
            balance: amount,
            total_earned: amount 
          });
      }

      // Record transaction
      await supabase
        .from('shc_transactions')
        .insert({
          user_id: user.id,
          type: 'earned',
          amount: amount,
          description: 'SHC Reward',
          status: 'completed'
        });

      return new Response(
        JSON.stringify({ success: true, message: 'SHC earned' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SHC Transfer Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
