import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MEDITATION-CREATION-CHECKOUT] ${step}${detailsStr}`);
};

// Price IDs for custom meditation creation service
const PRICE_IDS = {
  single: "price_1SZpgAAPsnbrivP0WY8m7XhH", // €97 - Single meditation
  triple: "price_1SZpgMAPsnbrivP0psjMXLME", // €197 - 3 pack
  voiceAddon: "price_1SZpgZAPsnbrivP0efDL9bGO", // €37 - Voice addon
};

const AMOUNTS = {
  single: 97,
  triple: 197,
  voiceAddon: 37,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      packageType, 
      frequency, 
      soundType, 
      customDescription, 
      includeVoiceAddon,
      voiceFileUrl,
      contractSigned 
    } = await req.json();
    
    logStep("Request data", { packageType, frequency, soundType, includeVoiceAddon, contractSigned });

    if (!packageType || !PRICE_IDS[packageType as keyof typeof PRICE_IDS]) {
      throw new Error("Invalid package type. Must be 'single' or 'triple'");
    }

    if (!contractSigned) {
      throw new Error("You must agree to the ownership contract before proceeding");
    }

    if (!frequency || !soundType) {
      throw new Error("Frequency and sound type are required");
    }

    const baseAmount = AMOUNTS[packageType as keyof typeof AMOUNTS];
    const voiceAddonAmount = includeVoiceAddon ? AMOUNTS.voiceAddon : 0;
    const totalAmount = baseAmount + voiceAddonAmount;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    logStep("Customer lookup", { customerId: customerId || "new customer" });

    // Create a booking record first
    const { data: booking, error: bookingError } = await supabaseClient
      .from("custom_meditation_bookings")
      .insert({
        user_id: user.id,
        package_type: packageType,
        amount_paid: totalAmount,
        status: "pending",
        notes: customDescription || null,
        contact_email: user.email,
        service_type: "creation",
        frequency: frequency,
        sound_type: soundType,
        custom_description: customDescription || null,
        include_voice_addon: includeVoiceAddon || false,
        voice_file_url: voiceFileUrl || null,
        contract_signed: true,
      })
      .select()
      .single();

    if (bookingError) {
      logStep("Booking creation failed", { error: bookingError.message });
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }
    logStep("Booking created", { bookingId: booking.id });

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: PRICE_IDS[packageType as keyof typeof PRICE_IDS],
        quantity: 1,
      },
    ];

    if (includeVoiceAddon) {
      lineItems.push({
        price: PRICE_IDS.voiceAddon,
        quantity: 1,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/meditations?success=true&booking=${booking.id}`,
      cancel_url: `${req.headers.get("origin")}/meditations?cancelled=true`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id,
        package_type: packageType,
        service_type: "creation",
        frequency: frequency,
        sound_type: soundType,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url, bookingId: booking.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
