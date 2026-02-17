import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface UserSegment {
  userId: string;
  email: string;
  fullName: string | null;
  language: 'sv' | 'en';
  segment: 'consistent' | 'struggling' | 'course_seeker';
  mantraCount: number;
  practiceMinutes: number;
  daysInactive: number;
  topCategory: string | null;
  isStargateMember: boolean;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEEKLY-MOTIVATIONAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role to bypass RLS
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting weekly motivational email scan");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Get all users with profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, full_name, email, preferred_language');

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Get emails from auth.users for profiles without email
    const profilesWithEmail = await Promise.all(
      (profiles || []).map(async (profile) => {
        let email = profile.email;
        if (!email) {
          // Try to get email from auth.users (requires service role)
          const { data: authUser } = await supabaseClient.auth.admin.getUserById(profile.user_id);
          email = authUser?.user?.email || null;
        }
        return {
          ...profile,
          email,
          language: (profile.preferred_language === 'sv' ? 'sv' : 'en') as 'sv' | 'en'
        };
      })
    );

    const validProfiles = profilesWithEmail.filter(p => p.email);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    logStep(`Found ${validProfiles.length} users with emails`);

    // Get Stargate members
    const { data: stargateMembers } = await supabaseClient
      .from('stargate_community_members')
      .select('user_id');

    const stargateMemberIds = new Set(stargateMembers?.map(m => m.user_id) || []);

    // Get mantra completions from last week
    const { data: mantraCompletions } = await supabaseClient
      .from('mantra_completions')
      .select('user_id, mantra_id, completed_at')
      .gte('completed_at', oneWeekAgo.toISOString());

    // Get mantra categories
    const { data: mantras } = await supabaseClient
      .from('mantras')
      .select('id, category, planet_type, duration_seconds');

    const mantraMap = new Map(mantras?.map(m => [m.id, m]) || []);

    // Calculate user segments
    const userSegments: UserSegment[] = [];
    const userMantraCounts = new Map<string, number>();
    const userPracticeMinutes = new Map<string, number>();
    const userTopCategories = new Map<string, Map<string, number>>();
    const userLastActivity = new Map<string, Date>();

    // Count mantras per user
    mantraCompletions?.forEach(completion => {
      const userId = completion.user_id;
      const count = userMantraCounts.get(userId) || 0;
      userMantraCounts.set(userId, count + 1);

      const mantra = mantraMap.get(completion.mantra_id);
      if (mantra) {
        const minutes = (mantra.duration_seconds || 180) / 60;
        const currentMinutes = userPracticeMinutes.get(userId) || 0;
        userPracticeMinutes.set(userId, currentMinutes + minutes);

        const category = mantra.category || mantra.planet_type || 'general';
        if (!userTopCategories.has(userId)) {
          userTopCategories.set(userId, new Map());
        }
        const categoryMap = userTopCategories.get(userId)!;
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);

        const completedAt = new Date(completion.completed_at);
        const lastActivity = userLastActivity.get(userId);
        if (!lastActivity || completedAt > lastActivity) {
          userLastActivity.set(userId, completedAt);
        }
      }
    });

    // Get last login from daily_active_users
    const { data: dailyActivities } = await supabaseClient
      .from('daily_active_users')
      .select('user_id, activity_date')
      .order('activity_date', { ascending: false });

    dailyActivities?.forEach(activity => {
      const userId = activity.user_id;
      const activityDate = new Date(activity.activity_date);
      const lastActivity = userLastActivity.get(userId);
      if (!lastActivity || activityDate > lastActivity) {
        userLastActivity.set(userId, activityDate);
      }
    });

    // Segment users
    validProfiles.forEach(profile => {
      const userId = profile.user_id;
      const mantraCount = userMantraCounts.get(userId) || 0;
      const practiceMinutes = Math.round(userPracticeMinutes.get(userId) || 0);
      const lastActivity = userLastActivity.get(userId);
      const daysInactive = lastActivity 
        ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const categoryMap = userTopCategories.get(userId);
      const topCategory = categoryMap 
        ? Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
        : null;

      const isStargateMember = stargateMemberIds.has(userId);
      
      let segment: 'consistent' | 'struggling' | 'course_seeker' = 'consistent';
      
      if (mantraCount >= 3) {
        segment = 'consistent';
      } else if (daysInactive >= 5) {
        segment = 'struggling';
      } else if (topCategory && !isStargateMember) {
        // Check if they've viewed Stargate content (simplified - could check content_analytics)
        segment = 'course_seeker';
      }

      userSegments.push({
        userId,
        email: profile.email,
        fullName: profile.full_name,
        language: (profile.language === 'sv' ? 'sv' : 'en') as 'sv' | 'en',
        segment,
        mantraCount,
        practiceMinutes,
        daysInactive,
        topCategory,
        isStargateMember
      });
    });

    logStep(`Segmented ${userSegments.length} users`);

    // Generate and send emails + DMs
    let sentEmails = 0;
    let sentDMs = 0;
    let errors = 0;

    // Get admin user ID for sending DMs
    const { data: adminRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1);

    const adminUserId = adminRoles?.[0]?.user_id;

    for (const userSegment of userSegments) {
      try {
        const emailContent = generateEmailContent(userSegment);
        const dmContent = generateDMContent(userSegment);

        // Send email
        await resend.emails.send({
          from: "Sacred Healing <onboarding@resend.dev>",
          to: [userSegment.email],
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        sentEmails++;

        // Send DM if admin exists
        if (adminUserId && dmContent) {
          await supabaseClient
            .from('private_messages')
            .insert({
              sender_id: adminUserId,
              receiver_id: userSegment.userId,
              content: dmContent,
              message_type: 'text',
              status: 'sent'
            });
          sentDMs++;
        }

        logStep(`Sent to ${userSegment.email}`, { segment: userSegment.segment });
      } catch (error) {
        errors++;
        console.error(`Error sending to ${userSegment.email}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        usersScanned: userSegments.length,
        emailsSent: sentEmails,
        dmsSent: sentDMs,
        errors
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in weekly-motivational-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

function generateEmailContent(segment: UserSegment): { subject: string; html: string; text: string } {
  const name = segment.fullName || 'Friend';
  const isSwedish = segment.language === 'sv';

  let subject: string;
  let body: string;

  if (segment.segment === 'consistent') {
    subject = isSwedish 
      ? `Din dedikation denna vecka är inspirerande 🌟`
      : `Your dedication this week is inspiring 🌟`;
    
    body = isSwedish
      ? `<p>Hej ${name},</p>
         <p>Jag märkte att du har chanterat ${segment.mantraCount} mantras denna vecka med totalt ${segment.practiceMinutes} minuters praktik. Din konsekvens skapar verklig transformation.</p>
         ${segment.topCategory ? `<p>Din fokus på ${getCategoryName(segment.topCategory, isSwedish)} mantras visar en djup förståelse. Fortsätt att följa denna väg.</p>` : ''}
         <p>Håll dig i ljuset,<br>Sacred Healing</p>`
      : `<p>Hello ${name},</p>
         <p>I noticed you've chanted ${segment.mantraCount} mantras this week with a total of ${segment.practiceMinutes} minutes of practice. Your consistency is creating real transformation.</p>
         ${segment.topCategory ? `<p>Your focus on ${getCategoryName(segment.topCategory, isSwedish)} mantras shows deep understanding. Continue following this path.</p>` : ''}
         <p>Stay in the light,<br>Sacred Healing</p>`;
  } else if (segment.segment === 'struggling') {
    subject = isSwedish
      ? `Sanctuaryt saknar din närvaro 💫`
      : `The sanctuary misses your presence 💫`;
    
    body = isSwedish
      ? `<p>Hej ${name},</p>
         <p>Sanctuaryt känns tyst utan dig. Ibland är allt vi behöver en 3-minuters Peace & Calm mantra för att återansluta.</p>
         <p>Din praktik väntar på dig när du är redo.</p>
         <p>Med kärlek,<br>Sacred Healing</p>`
      : `<p>Hello ${name},</p>
         <p>The sanctuary feels quiet without you. Sometimes all we need is a 3-minute Peace & Calm mantra to reconnect.</p>
         <p>Your practice is waiting for you when you're ready.</p>
         <p>With love,<br>Sacred Healing</p>`;
  } else {
    // Course seeker
    subject = isSwedish
      ? `En helig inbjudan till Stargate-resan ⭐`
      : `A sacred invitation to the Stargate journey ⭐`;
    
    const categoryName = getCategoryName(segment.topCategory || 'general', isSwedish);
    const stargateLesson = getStargateLessonForCategory(segment.topCategory || 'general', isSwedish);
    
    body = isSwedish
      ? `<p>Hej ${name},</p>
         <p>Jag märkte din dedikation till ${categoryName} mantras. Stargate-resan har en djupare frekvens för denna kategori som kan resonera med din nuvarande väg.</p>
         ${stargateLesson ? `<p>${stargateLesson}</p>` : ''}
         <p>Detta är en inbjudan, inte en försäljning. Om det känns rätt, vet du var du hittar oss.</p>
         <p>I ljuset,<br>Sacred Healing</p>`
      : `<p>Hello ${name},</p>
         <p>I noticed your dedication to ${categoryName} mantras. The Stargate journey has a deeper frequency for this category that might resonate with your current path.</p>
         ${stargateLesson ? `<p>${stargateLesson}</p>` : ''}
         <p>This is an invitation, not a sale. If it feels right, you know where to find us.</p>
         <p>In the light,<br>Sacred Healing</p>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sacred Healing</h1>
        </div>
        <div class="content">
          ${body}
        </div>
        <div class="footer">
          <p>This is guidance, not marketing. You are always free to unsubscribe.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = body.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n');

  return { subject, html, text };
}

function generateDMContent(segment: UserSegment): string | null {
  const name = segment.fullName || 'Friend';
  const isSwedish = segment.language === 'sv';

  if (segment.segment === 'consistent') {
    return isSwedish
      ? `Hej ${name}! 🌟 Jag märkte din dedikation denna vecka - ${segment.mantraCount} mantras och ${segment.practiceMinutes} minuters praktik. Fortsätt i ljuset!`
      : `Hello ${name}! 🌟 I noticed your dedication this week - ${segment.mantraCount} mantras and ${segment.practiceMinutes} minutes of practice. Continue in the light!`;
  } else if (segment.segment === 'struggling') {
    return isSwedish
      ? `Hej ${name} 💫 Sanctuaryt saknar din närvaro. En kort Peace & Calm mantra kan vara precis vad du behöver idag.`
      : `Hello ${name} 💫 The sanctuary misses your presence. A short Peace & Calm mantra might be just what you need today.`;
  } else {
    const categoryName = getCategoryName(segment.topCategory || 'general', isSwedish);
    return isSwedish
      ? `Hej ${name} ⭐ Din fokus på ${categoryName} mantras är inspirerande. Stargate-resan har djupare frekvenser för denna kategori. Om det känns rätt, vet du var du hittar oss.`
      : `Hello ${name} ⭐ Your focus on ${categoryName} mantras is inspiring. The Stargate journey has deeper frequencies for this category. If it feels right, you know where to find us.`;
  }
}

function getCategoryName(category: string, isSwedish: boolean): string {
  const categories: Record<string, { en: string; sv: string }> = {
    'planets': { en: 'Planet', sv: 'Planet' },
    'jupiter': { en: 'Jupiter', sv: 'Jupiter' },
    'mars': { en: 'Mars', sv: 'Mars' },
    'venus': { en: 'Venus', sv: 'Venus' },
    'wealth': { en: 'Wealth & Abundance', sv: 'Rikedom & Överflöd' },
    'peace': { en: 'Peace & Calm', sv: 'Fred & Lugn' },
    'general': { en: 'General', sv: 'Allmän' }
  };

  const cat = categories[category.toLowerCase()] || categories['general'];
  return isSwedish ? cat.sv : cat.en;
}

function getStargateLessonForCategory(category: string, isSwedish: boolean): string | null {
  const lessons: Record<string, { en: string; sv: string }> = {
    'jupiter': {
      en: 'The Stargate Journey includes a deeper frequency for Jupiter that aligns with expansion and wisdom.',
      sv: 'Stargate-resan inkluderar en djupare frekvens för Jupiter som stämmer överens med expansion och visdom.'
    },
    'mars': {
      en: 'The Stargate module for Mars explores courage and action at a deeper level.',
      sv: 'Stargate-modulen för Mars utforskar mod och handling på en djupare nivå.'
    },
    'wealth': {
      en: 'The Stargate prosperity module goes deeper into abundance consciousness.',
      sv: 'Stargate-prosperitetsmodulen går djupare in i överflödsmedvetande.'
    }
  };

  const lesson = lessons[category.toLowerCase()];
  return lesson ? (isSwedish ? lesson.sv : lesson.en) : null;
}
