import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuestionnaireNotificationRequest {
  userEmail: string;
  userName: string;
  packageType: string;
  goals: string;
  challenges: string;
  intentions: string;
  additionalNotes?: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[QUESTIONNAIRE-NOTIFICATION] ${step}:`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { userEmail, userName, packageType, goals, challenges, intentions, additionalNotes }: QuestionnaireNotificationRequest = await req.json();

    logStep("Request received", { userEmail, packageType });

    const packageName = packageType === 'ultimate' 
      ? 'The Ultimate Soulwave Activation Package' 
      : 'Personalized Affirmation Soundtrack';

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Sacred Healing <onboarding@resend.dev>",
      to: ["sacredhealingvibe@gmail.com"],
      subject: `New Affirmation Questionnaire - ${packageName}`,
      html: `
        <h1>New Questionnaire Submission</h1>
        <p><strong>Package:</strong> ${packageName}</p>
        <p><strong>Customer:</strong> ${userName || 'N/A'}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        
        <h2>Goals & Dreams</h2>
        <p>${goals}</p>
        
        <h2>Challenges & Blocks</h2>
        <p>${challenges}</p>
        
        <h2>Intentions</h2>
        <p>${intentions}</p>
        
        ${additionalNotes ? `<h2>Additional Notes</h2><p>${additionalNotes}</p>` : ''}
        
        <hr>
        <p style="color: #666; font-size: 12px;">This questionnaire was submitted via Sacred Healing App</p>
      `,
    });

    logStep("Admin notification sent", { adminEmailResponse });

    // Send confirmation to user
    const userEmailResponse = await resend.emails.send({
      from: "Sacred Healing <onboarding@resend.dev>",
      to: [userEmail],
      subject: `Your ${packageName} - Questionnaire Received`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B5CF6;">Thank You for Your Submission!</h1>
          
          <p>Dear ${userName || 'Sacred Soul'},</p>
          
          <p>We have received your questionnaire for the <strong>${packageName}</strong>.</p>
          
          <p>Our team will now begin crafting your personalized affirmation soundtrack based on your unique goals, challenges, and intentions. This sacred creation process typically takes 5-7 days.</p>
          
          <h2 style="color: #8B5CF6;">What Happens Next?</h2>
          <ol>
            <li>We review your responses with care and intention</li>
            <li>Your custom affirmations are channeled and written</li>
            <li>Sacred sounds and healing frequencies are selected</li>
            <li>Your personalized soundtrack is created and mixed</li>
            <li>You receive your meditation via email</li>
          </ol>
          
          <p>If you have any questions, feel free to reply to this email.</p>
          
          <p style="margin-top: 30px;">With love and light,<br><strong>The Sacred Healing Team</strong></p>
          
          <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Sacred Healing Vibration</p>
        </div>
      `,
    });

    logStep("User confirmation sent", { userEmailResponse });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
