import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseReleaseRequest {
  courseId: string;
  courseTitle: string;
  courseDescription?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-course-release: Starting request handling");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { courseId, courseTitle, courseDescription }: CourseReleaseRequest = await req.json();

    console.log(`notify-course-release: Processing course ${courseId} - ${courseTitle}`);

    // 1. Get all active email subscribers
    const { data: subscribers, error: subscriberError } = await supabase
      .from("email_subscribers")
      .select("email, name")
      .eq("is_active", true);

    if (subscriberError) {
      console.error("Error fetching subscribers:", subscriberError);
      throw new Error("Failed to fetch subscribers");
    }

    console.log(`notify-course-release: Found ${subscribers?.length || 0} subscribers`);

    // 2. Get all user profiles for in-app notifications
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name");

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
    }

    console.log(`notify-course-release: Found ${profiles?.length || 0} profiles for in-app notifications`);

    // 3. Create in-app announcements for all users
    const { error: announcementError } = await supabase
      .from("announcements")
      .insert({
        title: `🎉 New Course Available: ${courseTitle}`,
        message: courseDescription || `A new course "${courseTitle}" is now available! Start your learning journey today.`,
        type: "info",
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
        link_url: `/courses`
      });

    if (announcementError) {
      console.error("Error creating announcement:", announcementError);
    } else {
      console.log("notify-course-release: In-app announcement created successfully");
    }

    // 4. Send emails to all subscribers
    let emailsSent = 0;
    const emailErrors: string[] = [];

    if (resendApiKey && subscribers && subscribers.length > 0) {
      const resend = new Resend(resendApiKey);

      // Send emails in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);

        for (const subscriber of batch) {
          try {
            const personalizedName = subscriber.name || "Sacred Soul";

            await resend.emails.send({
              from: "Kritagya Das <noreply@siddhaquantumnexus.com>",
              to: [subscriber.email],
              subject: `🎓 New Course Released: ${courseTitle}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
                  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎓 New Course Available!</h1>
                    </div>
                    <div style="padding: 30px;">
                      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        Hello ${personalizedName},
                      </p>
                      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        We're excited to announce that a new course is now available on Sacred Healing!
                      </p>
                      <div style="background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <h2 style="color: #667eea; margin: 0 0 10px 0; font-size: 22px;">${courseTitle}</h2>
                        ${courseDescription ? `<p style="color: #b0b0b0; margin: 0; font-size: 14px; line-height: 1.5;">${courseDescription}</p>` : ''}
                      </div>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://sacredhealing.app/courses" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 25px; font-weight: 600; font-size: 16px;">
                          Start Learning Now
                        </a>
                      </div>
                      <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                        With love and light,<br>
                        The Sacred Healing Team
                      </p>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid #333;">
                      <p style="color: #666; font-size: 12px; margin: 0;">
                        © 2025 Sacred Healing. All rights reserved.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });

            emailsSent++;
          } catch (emailError: any) {
            console.error(`Failed to send email to ${subscriber.email}:`, emailError);
            emailErrors.push(subscriber.email);
          }
        }

        // Small delay between batches to respect rate limits
        if (i + batchSize < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } else if (!resendApiKey) {
      console.warn("notify-course-release: RESEND_API_KEY not configured, skipping email notifications");
    }

    console.log(`notify-course-release: Completed. Emails sent: ${emailsSent}, Errors: ${emailErrors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        emailErrors: emailErrors.length,
        announcementCreated: !announcementError,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("notify-course-release: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
