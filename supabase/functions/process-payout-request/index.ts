/**
 * process-payout-request — SQI 2050 Sovereign Payout Flow
 *
 * Three modes:
 *   - { action: "list" }      — admin: list pending payout requests
 *   - { payoutRequestId }     — admin: approve & execute one specific request
 *   - { action: "auto_run" }  — CRON_SECRET only: find every affiliate with a
 *     connected + active Stripe account whose available balance (past the
 *     PAYOUT_HOLD_DAYS refund-hold window) is at least MIN_PAYOUT_EUR, create
 *     a payout request for them, and execute it automatically. Affiliates
 *     without a working Stripe Connect account are left untouched — their
 *     balance stays pending until they either connect Stripe or an admin
 *     processes their manual bank-details request by hand.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_UUID = "bd0b21c9-577a-450b-bb1e-21c9d0423f17";
const MIN_PAYOUT_EUR = 20; // Minimum €20 before processing
const PAYOUT_HOLD_DAYS = 14; // Must match the hold period shown in AffiliateDashboard.tsx

const log = (step: string, details?: unknown) =>
  console.log(`[PROCESS-PAYOUT] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);

// deno-lint-ignore no-explicit-any
async function executePayout(supabaseAdmin: any, stripe: Stripe, payoutRequestId: string) {
  const { data: payoutRequest, error: prError } = await supabaseAdmin
    .from("affiliate_payout_requests")
    .select("*")
    .eq("id", payoutRequestId)
    .single();

  if (prError || !payoutRequest) throw new Error("Payout request not found");
  if (payoutRequest.status !== "requested") throw new Error(`Payout is already ${payoutRequest.status}`);

  const amountEur = Number(payoutRequest.amount);
  const affiliateUserId = payoutRequest.affiliate_user_id;

  if (amountEur < MIN_PAYOUT_EUR) throw new Error(`Minimum payout is €${MIN_PAYOUT_EUR}`);

  log("Processing payout", { payoutRequestId, affiliateUserId, amountEur });

  const { data: affProfile } = await supabaseAdmin
    .from("affiliate_profiles")
    .select("pending_balance, paid_out, stripe_connect_id")
    .eq("user_id", affiliateUserId)
    .single();

  if (!affProfile) throw new Error("Affiliate profile not found");
  if (amountEur > Number(affProfile.pending_balance)) {
    throw new Error(`Insufficient balance. Available: €${affProfile.pending_balance}`);
  }

  await supabaseAdmin
    .from("affiliate_payout_requests")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", payoutRequestId);

  let transferId: string | null = null;
  let payoutMethod: "stripe_connect" | "manual_bank" = "manual_bank";

  if (affProfile.stripe_connect_id) {
    try {
      const connectAccount = await stripe.accounts.retrieve(affProfile.stripe_connect_id);
      if (connectAccount.payouts_enabled && connectAccount.details_submitted) {
        const transfer = await stripe.transfers.create({
          amount: Math.round(amountEur * 100),
          currency: payoutRequest.currency?.toLowerCase() || "eur",
          destination: affProfile.stripe_connect_id,
          description: `SQI Affiliate Payout — ${payoutRequestId}`,
          metadata: { affiliate_user_id: affiliateUserId, payout_request_id: payoutRequestId },
        });
        transferId = transfer.id;
        payoutMethod = "stripe_connect";
        log("Stripe Connect transfer created", { transferId, amountEur });
      } else {
        log("Stripe Connect account not active, falling back to manual", { accountId: affProfile.stripe_connect_id });
      }
    } catch (stripeErr) {
      log("Stripe Connect transfer failed, admin must handle manually", { error: String(stripeErr) });
    }
  } else {
    log("No Stripe Connect account — manual bank transfer required", { affiliateUserId, bankDetails: payoutRequest.bank_details });
  }

  const newPending = Math.max(0, Number(affProfile.pending_balance) - amountEur);
  const newPaidOut = Number(affProfile.paid_out || 0) + amountEur;

  await supabaseAdmin.from("affiliate_profiles").update({
    pending_balance: newPending,
    paid_out: newPaidOut,
    updated_at: new Date().toISOString(),
  }).eq("user_id", affiliateUserId);

  const finalStatus = payoutMethod === "stripe_connect" ? "completed" : "processing";
  await supabaseAdmin.from("affiliate_payout_requests").update({
    status: finalStatus,
    stripe_transfer_id: transferId,
    updated_at: new Date().toISOString(),
  }).eq("id", payoutRequestId);

  try {
    const { data: affUser } = await supabaseAdmin.auth.admin.getUserById(affiliateUserId);
    const affEmail = affUser?.user?.email;
    const affName = affUser?.user?.user_metadata?.full_name || "";

    if (affEmail) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);
        const firstName = affName.split(" ")[0] || "Sovereign";
        const isInstant = payoutMethod === "stripe_connect";

        await resend.emails.send({
          from: "Sacred Healing <hello@sacredhealing.app>",
          to: [affEmail],
          subject: `✦ Payout ${isInstant ? 'Transmitted' : 'Processing'} — €${amountEur.toFixed(2)} | Sacred Healing`,
          html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
<tr><td align="center" style="padding:40px 16px 60px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="text-align:center;padding:48px 0 32px;">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.7em;text-transform:uppercase;margin-bottom:12px;">SOVEREIGN TRANSMISSION NETWORK · SQI 2050</div>
    <div style="font-size:40px;margin-bottom:10px;">⟁</div>
    <div style="color:#D4AF37;font-size:26px;font-weight:900;letter-spacing:-0.03em;text-shadow:0 0 20px rgba(212,175,55,0.4);">
      ${isInstant ? "Quantum Dividend Transmitted" : "Payout Processing"}
    </div>
    <div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:8px;letter-spacing:0.2em;">
      ${isInstant ? "FUNDS ARE ON THEIR WAY" : "MANUAL TRANSFER IN PROGRESS"}
    </div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:20px;padding:28px 32px;">
      <p style="font-size:16px;color:rgba(255,255,255,0.85);margin:0 0 12px;line-height:1.7;">
        Namaste <strong style="color:#D4AF37;">${firstName}</strong>,
      </p>
      <p style="font-size:14px;color:rgba(255,255,255,0.55);margin:0;line-height:1.8;">
        ${isInstant
          ? `Your payout of <strong style="color:#D4AF37;">€${amountEur.toFixed(2)}</strong> has been transmitted to your connected bank account. Funds typically arrive within 2-3 business days depending on your bank.`
          : `Your payout request of <strong style="color:#D4AF37;">€${amountEur.toFixed(2)}</strong> has been approved and is being processed manually. Your IBAN transfer will arrive within 3-5 business days.`
        }
      </p>
    </div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.3);">AMOUNT</span><br>
          <span style="font-size:22px;font-weight:900;color:#D4AF37;margin-top:4px;display:block;">€${amountEur.toFixed(2)}</span>
        </td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.3);">METHOD</span><br>
          <span style="font-size:14px;font-weight:700;color:#fff;margin-top:4px;display:block;">${isInstant ? "Stripe Connect (Instant)" : "Bank Transfer (IBAN)"}</span>
        </td></tr>
        <tr><td style="padding:10px 0;">
          <span style="font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.3);">STATUS</span><br>
          <span style="display:inline-block;margin-top:6px;background:${isInstant ? "rgba(34,197,94,0.1)" : "rgba(212,175,55,0.1)"};border:1px solid ${isInstant ? "rgba(34,197,94,0.3)" : "rgba(212,175,55,0.3)"};border-radius:100px;padding:4px 14px;font-size:11px;font-weight:800;color:${isInstant ? "#22c55e" : "#D4AF37"};letter-spacing:0.1em;">${isInstant ? "✓ TRANSMITTED" : "⟳ PROCESSING"}</span>
        </td></tr>
      </table>
      ${!isInstant && payoutRequest.bank_details ? `<div style="margin-top:16px;padding:12px;background:rgba(255,255,255,0.02);border-radius:12px;"><p style="font-size:11px;color:rgba(255,255,255,0.3);margin:0;">Sending to: <strong style="color:rgba(255,255,255,0.5);">${payoutRequest.bank_details.iban || "your registered account"}</strong></p></div>` : ""}
    </div>
  </td></tr>
  <tr><td style="padding:0 0 32px;text-align:center;">
    <a href="https://siddhaquantumnexus.com/affiliate-dashboard" style="display:inline-block;padding:16px 40px;background:#D4AF37;color:#050505;border-radius:100px;font-size:12px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;box-shadow:0 0 24px rgba(212,175,55,0.4);">◈ View Abundance Dashboard</a>
  </td></tr>
  <tr><td style="text-align:center;padding:24px 0 0;border-top:1px solid rgba(255,255,255,0.05);">
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.8;">Sacred Healing · Siddha Quantum Intelligence<br><a href="https://siddhaquantumnexus.com" style="color:rgba(212,175,55,0.4);text-decoration:none;">siddhaquantumnexus.com</a></p>
  </td></tr>
</table></td></tr></table></body></html>`,
        });
        log("Payout confirmation email sent", { affEmail, amountEur });
      }
    }
  } catch (emailErr) {
    log("Payout email failed (non-blocking)", { error: String(emailErr) });
  }

  return { success: true, payoutRequestId, amountEur, transferId, payoutMethod, status: finalStatus };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();

    // ── Mode: AUTO RUN — CRON_SECRET only, no admin session involved ───────
    if (body.action === "auto_run") {
      const cronSecret = Deno.env.get("CRON_SECRET");
      const authHeader = req.headers.get("Authorization");
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-08-27.basil" });
      const holdCutoffIso = new Date(Date.now() - PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { data: candidates } = await supabaseAdmin
        .from("affiliate_profiles")
        .select("user_id, pending_balance, currency, stripe_connect_id")
        .not("stripe_connect_id", "is", null)
        .gt("pending_balance", 0);

      const results: unknown[] = [];

      for (const aff of candidates || []) {
        try {
          // Sum commissions still inside the hold window for this affiliate
          const { data: heldCommissions } = await supabaseAdmin
            .from("affiliate_commissions")
            .select("commission_amount")
            .eq("affiliate_user_id", aff.user_id)
            .gte("created_at", holdCutoffIso);

          const held = (heldCommissions || []).reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);
          const available = Math.max(0, Number(aff.pending_balance) - held);

          if (available < MIN_PAYOUT_EUR) {
            results.push({ user_id: aff.user_id, skipped: "below_min_or_all_held", available });
            continue;
          }

          // Confirm the Stripe account is actually live before creating a request for it
          const account = await stripe.accounts.retrieve(aff.stripe_connect_id);
          if (!account.payouts_enabled || !account.details_submitted) {
            results.push({ user_id: aff.user_id, skipped: "stripe_not_active" });
            continue;
          }

          const { data: newRequest, error: insertErr } = await supabaseAdmin
            .from("affiliate_payout_requests")
            .insert({
              affiliate_user_id: aff.user_id,
              amount: available,
              currency: aff.currency || "EUR",
              status: "requested",
            })
            .select("id")
            .single();

          if (insertErr || !newRequest) {
            results.push({ user_id: aff.user_id, error: insertErr?.message || "insert failed" });
            continue;
          }

          const outcome = await executePayout(supabaseAdmin, stripe, newRequest.id);
          results.push({ user_id: aff.user_id, ...outcome });
        } catch (err) {
          results.push({ user_id: aff.user_id, error: err instanceof Error ? err.message : String(err) });
        }
      }

      log("auto_run complete", { candidateCount: (candidates || []).length, resultCount: results.length });
      return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Auth: admin only (list / manual approve) ────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const caller = userData.user;
    if (!caller) throw new Error("Not authenticated");
    if (caller.id !== ADMIN_UUID) {
      const adminEmails = ["sacredhealingvibe@gmail.com", "laila.amrouche@gmail.com"];
      if (!caller.email || !adminEmails.includes(caller.email)) {
        throw new Error("Admin access required");
      }
    }
    log("Admin verified", { callerId: caller.id });

    // ── Mode: LIST pending requests ─────────────────────────────────────────
    if (body.action === "list") {
      const { data: requests } = await supabaseAdmin
        .from("affiliate_payout_requests")
        .select(`
          id,
          affiliate_user_id,
          amount,
          currency,
          bank_details,
          status,
          created_at,
          affiliate_profiles!affiliate_payout_requests_affiliate_user_id_fkey(
            affiliate_code,
            pending_balance,
            stripe_connect_id
          )
        `)
        .eq("status", "requested")
        .order("created_at", { ascending: true });

      const enriched = await Promise.all((requests || []).map(async (r) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.affiliate_user_id);
        return { ...r, email: u?.user?.email || "unknown", name: u?.user?.user_metadata?.full_name || "" };
      }));

      return new Response(JSON.stringify({ requests: enriched }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Mode: APPROVE & EXECUTE one payout ──────────────────────────────────
    const { payoutRequestId } = body as { payoutRequestId: string };
    if (!payoutRequestId) throw new Error("payoutRequestId required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-08-27.basil" });
    const outcome = await executePayout(supabaseAdmin, stripe, payoutRequestId);

    return new Response(JSON.stringify(outcome), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
