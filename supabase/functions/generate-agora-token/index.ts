import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agora token generation utilities
const VERSION = "007";
const VERSION_LENGTH = 3;

class ByteBuf {
  buffer: Uint8Array;
  position: number;

  constructor() {
    this.buffer = new Uint8Array(1024);
    this.position = 0;
  }

  pack(): Uint8Array {
    return this.buffer.slice(0, this.position);
  }

  putUint16(v: number) {
    this.buffer[this.position++] = v & 0xff;
    this.buffer[this.position++] = (v >> 8) & 0xff;
  }

  putUint32(v: number) {
    this.buffer[this.position++] = v & 0xff;
    this.buffer[this.position++] = (v >> 8) & 0xff;
    this.buffer[this.position++] = (v >> 16) & 0xff;
    this.buffer[this.position++] = (v >> 24) & 0xff;
  }

  putBytes(bytes: Uint8Array) {
    this.putUint16(bytes.length);
    this.buffer.set(bytes, this.position);
    this.position += bytes.length;
  }

  putString(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.putUint16(bytes.length);
    this.buffer.set(bytes, this.position);
    this.position += bytes.length;
  }

  putTreeMap(map: Map<number, string>) {
    this.putUint16(map.size);
    map.forEach((value, key) => {
      this.putUint16(key);
      this.putString(value);
    });
  }

  putTreeMapUint32(map: Map<number, number>) {
    this.putUint16(map.size);
    map.forEach((value, key) => {
      this.putUint16(key);
      this.putUint32(value);
    });
  }
}

async function hmacSign(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

function encodeBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

async function generateAccessToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  tokenExpireTs: number,
  privilegeExpireTs: number
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Build message
  const message = new ByteBuf();
  message.putUint32(Math.floor(Date.now() / 1000)); // salt
  message.putUint32(tokenExpireTs);
  
  const privileges = new Map<number, number>();
  privileges.set(1, privilegeExpireTs); // kJoinChannel
  if (role === 1) { // Publisher
    privileges.set(2, privilegeExpireTs); // kPublishAudioStream
    privileges.set(3, privilegeExpireTs); // kPublishVideoStream
    privileges.set(4, privilegeExpireTs); // kPublishDataStream
  }
  message.putTreeMapUint32(privileges);
  
  const messageBytes = message.pack();
  
  // Build signature
  const signKey = await hmacSign(
    encoder.encode(appCertificate),
    encoder.encode(appId)
  );
  const signContent = new Uint8Array([
    ...encoder.encode(appId),
    ...encoder.encode(channelName),
    ...encoder.encode(String(uid)),
    ...messageBytes
  ]);
  const signature = await hmacSign(signKey, signContent);
  
  // Build token
  const token = new ByteBuf();
  token.putString(appId);
  token.putBytes(signature);
  token.putBytes(messageBytes);
  
  return VERSION + encodeBase64(token.pack());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { channelName, role = 'subscriber', uid } = await req.json();

    if (!channelName) {
      throw new Error('Channel name is required');
    }

    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Check if user is admin for publisher role
    let actualRole = 2; // subscriber by default
    if (role === 'publisher') {
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (roleData) {
        actualRole = 1; // publisher
      }
    }

    // Generate token
    const expirationTimeInSeconds = 3600 * 24; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tokenExpireTs = currentTimestamp + expirationTimeInSeconds;
    const privilegeExpireTs = tokenExpireTs;

    const numericUid = uid || 0;
    
    const token = await generateAccessToken(
      appId,
      appCertificate,
      channelName,
      numericUid,
      actualRole,
      tokenExpireTs,
      privilegeExpireTs
    );

    console.log(`Generated token for channel: ${channelName}, role: ${actualRole === 1 ? 'publisher' : 'subscriber'}`);

    return new Response(JSON.stringify({ 
      token, 
      appId,
      uid: numericUid,
      channel: channelName,
      role: actualRole === 1 ? 'publisher' : 'subscriber'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating Agora token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
