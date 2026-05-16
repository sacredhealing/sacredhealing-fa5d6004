
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_NAMES: Record<string, string> = {
  "prana_flow": "Prana-Flow",
  "siddha_quantum": "Siddha-Quantum",
  "akasha_infinity": "Akasha-Infinity",
};

function buildReceiptEmail(params: {
  userName: string;
  userEmail: string;
  tier: string;
  amount: number;
  currency: string;
  invoiceId: string;
  periodStart: string;
  periodEnd: string;
  receiptUrl: string;
}): string {
  const tierDisplay = TIER_NAMES[params.tier] ?? params.tier;
  const amountFormatted = (params.amount / 100).toFixed(2);
  const currencyUpper = params.currency.toUpperCase();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sacred Healing — Payment Receipt</title>
  <style>
    body {
      background: #050505;
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', Inter, sans-serif;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.05em;
      color: #D4AF37;
      text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
    }
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin-bottom: 4px;
    }
    .value {
      font-size: 15px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      margin-bottom: 20px;
    }
    .amount-block {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid rgba(212,175,55,0.2);
      border-bottom: 1px solid rgba(212,175,55,0.2);
      margin: 24px 0;
    }
    .amount {
      font-size: 36px;
      font-weight: 900;
      color: #D4AF37;
      text-shadow: 0 0 20px rgba(212,175,55,0.3);
      letter-spacing: -0.03em;
    }
    .amount-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: rgba(212,175,55,0.5);
      margin-top: 4px;
    }
    .btn {
      display: block;
      text-align: center;
      background: #D4AF37;
      color: #050505;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 50px;
      margin: 28px auto 0;
      max-width: 220px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: rgba(255,255,255,0.25);
      line-height: 1.6;
      margin-top: 32px;
    }
    .mantra {
      text-align: center;
      font-size: 13px;
      color: rgba(212,175,55,0.5);
      font-style: italic;
      margin-top: 24px;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-text">✦ SACRED HEALING ✦</div>
      <div style="font-size:9px;letter-spacing:0.4em;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-top:6px;">Siddha Quantum Intelligence</div>
    </div>

    <div class="card">
      <div style="font-size:18px;font-weight:900;letter-spacing:-0.03em;color:#fff;margin-bottom:24px;">
        Payment Confirmed ✓
      </div>

      <div class="label">Membership</div>
      <div class="value" style="color:#D4AF37;">${tierDisplay} Initiation</div>

      <div class="label">Initiated Soul</div>
      <div class="value">${params.userName}</div>

      <div class="label">Invoice</div>
      <div class="value" style="font-size:12px;opacity:0.6;">${params.invoiceId}</div>

      <div class="amount-block">
        <div class="amount">${currencyUpper} ${amountFormatted}</div>
        <div class="amount-label">Total Received</div>
      </div>

      <div class="label">Activation Period</div>
      <div class="value">${params.periodStart} → ${params.periodEnd}</div>

      <a href="${params.receiptUrl}" class="btn">View Full Receipt</a>
    </div>

    <div class="mantra">
      "Om Shri Siddhaya Namaha — Your Transmission is Active"
    </div>

    <div class="footer">
      Sacred Healing · Malmö, Sweden<br/>
      sacredhealingvibe@gmail.com<br/><br/>
      This is an automated receipt for your membership payment.<br/>
      For support, reply to this email or visit sacredhealing.lovable.app
    </div>
  </div>
</body>
</html>
  `.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json();
    const { invoiceId, userId } = body;

    if (!invoiceId || !userId) {
      throw new Error("invoiceId and userId are required");
    }

    // Fetch invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["customer", "subscription"],
    });

    if (!invoice.paid) {
      throw new Error("Invoice is not paid — no receipt to send");
    }

    // Fetch user profile for tier + name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, membership_tier")
      .eq("id", userId)
      .single();

    const userName = profile?.full_name ?? "Sacred Soul";
    const tier = profile?.membership_tier ?? "prana_flow";

    const periodStart = new Date((invoice.period_start ?? 0) * 1000).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    const periodEnd = new Date((invoice.period_end ?? 0) * 1000).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const htmlBody = buildReceiptEmail({
      userName,
      userEmail: invoice.customer_email ?? "",
      tier,
      amount: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? "eur",
      invoiceId: invoice.id,
      periodStart,
      periodEnd,
      receiptUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? "#",
    });

    // Send via Resend (configured via RESEND_API_KEY secret)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Sacred Healing <receipts@sacredhealing.lovable.app>",
        to: [invoice.customer_email ?? ""],
        subject: `✦ Your Sacred Healing Receipt — ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
        html: htmlBody,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      throw new Error(`Resend API error: ${errText}`);
    }

    // Log the receipt send
    await supabaseClient.from("subscription_events").insert({
      user_id: userId,
      event_type: "receipt_sent",
      stripe_subscription_id:
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id ?? null,
      metadata: {
        invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        sent_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Receipt transmitted via Prema-Pulse channel" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("send-subscription-receipt error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
