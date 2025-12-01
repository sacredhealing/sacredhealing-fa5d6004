import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { courseId, paymentMethod } = await req.json();
    console.log("[ENROLL-COURSE] Course:", courseId, "Method:", paymentMethod);

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) throw new Error("Course not found");

    // Check if already enrolled
    const { data: existing } = await supabaseAdmin
      .from("course_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyEnrolled: true,
        message: "Already enrolled in this course"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle free courses
    if (course.is_free || (course.price_usd === 0 && course.price_shc === 0)) {
      await supabaseAdmin.from("course_enrollments").insert({
        user_id: user.id,
        course_id: courseId,
        payment_method: "free",
        amount_paid: 0,
      });

      // Increment enrollment count
      await supabaseAdmin
        .from("courses")
        .update({ enrollment_count: course.enrollment_count + 1 })
        .eq("id", courseId);

      return new Response(JSON.stringify({ 
        success: true,
        message: "Successfully enrolled!"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle SHC payment
    if (paymentMethod === "shc") {
      const { data: balance } = await supabaseAdmin
        .from("user_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!balance || balance.balance < course.price_shc) {
        throw new Error("Insufficient SHC balance");
      }

      // Deduct balance
      await supabaseAdmin
        .from("user_balances")
        .update({
          balance: balance.balance - course.price_shc,
          total_spent: balance.balance + course.price_shc,
        })
        .eq("user_id", user.id);

      // Record transaction
      await supabaseAdmin.from("shc_transactions").insert({
        user_id: user.id,
        type: "spent",
        amount: course.price_shc,
        description: `Enrolled in course: ${course.title}`,
        status: "completed",
      });

      // Create enrollment
      await supabaseAdmin.from("course_enrollments").insert({
        user_id: user.id,
        course_id: courseId,
        payment_method: "shc",
        shc_paid: course.price_shc,
      });

      // Increment enrollment count
      await supabaseAdmin
        .from("courses")
        .update({ enrollment_count: course.enrollment_count + 1 })
        .eq("id", courseId);

      // Process affiliate commission
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        await fetch(`${SUPABASE_URL}/functions/v1/process-affiliate-commission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            purchaseType: 'course',
            purchaseAmount: course.price_shc,
            purchaseId: courseId,
          }),
        });
        console.log('[ENROLL-COURSE] Affiliate commission processed');
      } catch (commissionError) {
        console.error('[ENROLL-COURSE] Affiliate commission error (non-blocking):', commissionError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: "Successfully enrolled!"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle Stripe payment
    if (paymentMethod === "stripe") {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }

      const origin = req.headers.get("origin") || "https://localhost:3000";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: course.title,
                description: course.description || "Online course",
              },
              unit_amount: Math.round(course.price_usd * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/courses?enrolled=${courseId}`,
        cancel_url: `${origin}/courses`,
        metadata: {
          user_id: user.id,
          course_id: courseId,
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid payment method");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ENROLL-COURSE] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
