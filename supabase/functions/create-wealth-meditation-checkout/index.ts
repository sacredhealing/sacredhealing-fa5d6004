import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEALTH-MEDITATION-CHECKOUT] ${step}${detailsStr}`);
};

const PRICE_AMOUNT = 4700; // €47 in cents
const DISCOUNTED_PRICE_AMOUNT = 2700; // €27 in cents (€20 discount for course bundle)

const AFFIRMATIONS = `108 RIKEDOMS-AFFIRMATIONER

MINDSET & IDENTITET (1–20)

1. Jag är magnetisk för rikedom.
2. Jag är värdig all den framgång jag önskar.
3. Jag är skaparen av min ekonomiska verklighet.
4. Jag är i harmoni med universums överflöd.
5. Jag tänker som en rik person.
6. Jag väljer tankar som skapar rikedom.
7. Jag fokuserar på möjligheter, inte hinder.
8. Jag är alltid på rätt plats vid rätt tid.
9. Jag är tacksam för mitt växande överflöd.
10. Jag är lugn, stabil och trygg i min ekonomi.
11. Jag känner mig hemma i rikedomen.
12. Jag expanderar ständigt min ekonomiska intelligens.
13. Jag litade på min förmåga att skapa och ta emot.
14. Jag väljer att tänka stort.
15. Jag tillåter mig själv att ta emot mer.
16. Jag är öppen för nya inkomstflöden.
17. Jag uppskattar mina gåvor och talanger.
18. Jag förtjänar rikedom bara genom att vara jag.
19. Jag är en energikanal för överflöd.
20. Jag är mästare över mina tankar och känslor.

MONEY MINDSET (21–40)

21. Pengar flödar till mig lätt och naturligt.
22. Jag välkomnar nya finansiella möjligheter.
23. Mina inkomster ökar ständigt.
24. Jag tar emot oväntade pengar med tacksamhet.
25. Jag använder pengar på ett medvetet och kärleksfullt sätt.
26. Pengar arbetar för mig dygnet runt.
27. Jag njuter av att skapa ekonomisk frihet.
28. Mina investeringar växer dag för dag.
29. Jag fattar kloka ekonomiska beslut.
30. Jag känner glädje när jag tänker på pengar.
31. Jag är fri från alla begränsande pengar-tankar.
32. Mitt förhållande till pengar är harmoniskt.
33. Jag är redo för min nästa ekonomiska nivå.
34. Jag har fler än tillräckligt med pengar.
35. Jag attraherar rikedomen jag visualiserar.
36. Varje dag blir jag rikare på alla sätt.
37. Jag kan tjäna pengar på alla sätt jag önskar.
38. Jag tjänar mer än jag spenderar.
39. Jag lockar pengar genom min energi.
40. Jag är tacksam för varje krona som kommer till mig.

INRE TRYGGHET & MOTTAGANDE (41–60)

41. Det är säkert för mig att bli rik.
42. Det är säkert att äga och behålla mycket pengar.
43. Jag tillåter mig att ta emot enormt överflöd.
44. Jag släpper all rädsla kring pengar.
45. Jag förlåter mig själv för tidigare ekonomiska misstag.
46. Jag väljer att se pengar som ett verktyg för gott.
47. Jag ger och tar emot med kärlek.
48. Jag känner mig trygg i min ekonomiska framtid.
49. Jag litar på universums stöd.
50. Jag accepterar rikedom som en naturlig del av mitt liv.
51. Jag är i alignment med överflödets energi.
52. Jag känner mig värdig att äga mycket.
53. Jag tar emot mer än jag någonsin önskat.
54. Jag är redo att ta emot nu.
55. Jag känner mig trygg i att ta stora steg.
56. Jag expanderar min kapacitet att ta emot pengar.
57. Jag tillåter allt gott att nå mig.
58. Jag är mottaglig för rikedom i alla former.
59. Jag känner glädje när jag tar emot pengar.
60. Jag är tillräcklig, mer än tillräcklig.

HANDLING & MANIFESTATION (61–80)

61. Jag agerar inspirerat varje dag.
62. Jag tar smarta beslut som leder till rikedom.
63. Jag är effektiv och fokuserad.
64. Jag arbetar med glädje och passion.
65. Jag skapar värde som världen vill betala för.
66. Jag tar steg som leder till ekonomisk expansion.
67. Jag gör plats i mitt liv för mer.
68. Jag är disciplinerad och konsekvent.
69. Jag avslutar det jag påbörjar.
70. Jag följer min intuition och den leder mig rätt.
71. Jag låter mina idéer bli verklighet.
72. Jag handlar även när jag känner mig osäker.
73. Jag tar ansvar för min ekonomi.
74. Jag skapar strukturer som gynnar mitt överflöd.
75. Jag bygger långsiktig rikedom.
76. Jag är modig när det gäller pengar.
77. Jag vågar be om mer.
78. Jag lär mig av varje erfarenhet.
79. Jag tar emot vägledning när jag behöver det.
80. Jag gör det som krävs för min vision.

RIKEDOM & ÖVERFLÖD (81–108)

81. Jag lever i min mest välmående verklighet.
82. Jag är en naturlig rikedomsskapare.
83. Jag är alltid stöttad av universum.
84. Mina pengar växer medan jag sover.
85. Jag är redo för overflow.
86. Jag tillåter stora summor att nå mig.
87. Jag är en kanal för oändligt överflöd.
88. Jag väljer att vara rik nu.
89. Jag älskar känslan av att vara ekonomiskt fri.
90. Jag tackar för allt som redan är mitt.
91. Jag är uppgraderad på alla nivåer.
92. Jag välkomnar min rika framtid nu.
93. Jag är rik, jag känner mig rik, jag lever rikedom.
94. Överflöd är mitt naturliga tillstånd.
95. Jag attraherar rikedom som en magnet.
96. Mitt liv är fyllt av möjligheter.
97. Jag är i perfekt synk med universums överflöd.
98. Varje dag öppnas nya dörrar för mig.
99. Jag är tacksam för min resa mot rikedom.
100. Jag förtjänar att leva i överflöd.
101. Min framtid är ljus och full av möjligheter.
102. Jag är en kraftfull skapare av mitt liv.
103. Rikedom flödar till mig från alla håll.
104. Jag är öppen för mirakel.
105. Jag lever mitt rikaste liv nu.
106. Jag är en välsignelse för mig själv och andra.
107. Min rikedom hjälper mig att göra gott i världen.
108. Jag är evig överflöd.`;

const sendAffirmationsEmail = async (email: string, bookingId: string) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    logStep("RESEND_API_KEY not configured");
    return false;
  }

  const resend = new Resend(resendApiKey);
  
  try {
    const { error } = await resend.emails.send({
      from: "Sacred Healing <onboarding@resend.dev>",
      to: [email],
      subject: "✨ Your 108 Wealth Affirmations - Record & Transform Your Life",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #fefefe; }
            h1 { color: #d4af37; text-align: center; }
            h2 { color: #8B7355; margin-top: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
            .instructions { background: linear-gradient(135deg, #f9f6f0, #fff8e7); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #d4af37; }
            .instructions h3 { color: #d4af37; margin-top: 0; }
            .instructions ol { margin-left: 20px; }
            .instructions li { margin-bottom: 12px; }
            .affirmation-section { background: #fff; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #d4af37; color: #666; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .email-box { background: #d4af37; color: #000; padding: 15px 25px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>✨ Your 108 Wealth Reprogramming Affirmations</h1>
          
          <p style="text-align: center; font-size: 18px;">Thank you for your purchase! Your transformation journey begins now.</p>
          
          <div class="instructions">
            <h3>📝 Next Steps to Receive Your Personalized Meditation:</h3>
            <ol>
              <li><strong>Read through all 108 affirmations below</strong> - Feel each one as you read it</li>
              <li><strong>Record yourself reading ALL 108 affirmations aloud</strong> - Use your phone's voice recorder in a quiet space</li>
              <li><strong>Speak slowly, clearly, and with feeling</strong> - Your authentic voice is what matters, not perfection!</li>
              <li><strong>Send your audio file to the email below</strong> (MP3, WAV, or M4A)</li>
              <li><strong>Receive your personalized wealth meditation</strong> within 5-7 business days</li>
            </ol>
            <p><em>💡 Tip: Don't worry about audio quality — I'll transform your recording into professional, studio-quality sound with 528/639 Hz frequencies!</em></p>
          </div>

          <div class="highlight">
            <strong>🎯 Send your voice recording to:</strong>
            <div class="email-box">sacredhealingvibe@gmail.com</div>
            <p style="margin-top: 10px; font-size: 14px;">Please include your name and "108 Wealth Meditation" in the subject line.</p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 3px solid #d4af37;">

          <div class="affirmation-section">
            <pre style="white-space: pre-wrap; font-family: Georgia, serif; font-size: 15px; line-height: 2.2; color: #444;">
${AFFIRMATIONS}
            </pre>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 3px solid #d4af37;">

          <div class="footer">
            <p><strong>Ready?</strong> Record yourself reading all 108 affirmations and send your audio file to <strong>sacredhealingvibe@gmail.com</strong></p>
            <p>Your personalized wealth meditation will be created and sent to you within 5-7 business days.</p>
            <p style="margin-top: 30px;">With love and abundance,<br><strong>Sacred Healing Team</strong> ✨</p>
            <p style="font-size: 12px; color: #999;">Booking Reference: ${bookingId}</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logStep("Email send error", { error });
      return false;
    }
    
    logStep("Email sent successfully", { email });
    return true;
  } catch (err) {
    logStep("Email sending failed", { error: err });
    return false;
  }
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

    const { email, discounted } = await req.json();
    
    const priceAmount = discounted ? DISCOUNTED_PRICE_AMOUNT : PRICE_AMOUNT;
    const priceInEur = priceAmount / 100;
    
    logStep("Request data", { email, discounted, priceAmount });

    if (!email) {
      throw new Error("Email address is required");
    }

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
        package_type: discounted ? "wealth_108_discounted" : "wealth_108",
        amount_paid: priceInEur,
        status: "pending",
        notes: discounted 
          ? "108 Wealth Reprogramming Meditation (Course Bundle Discount) - Awaiting payment" 
          : "108 Wealth Reprogramming Meditation - Awaiting payment",
        contact_email: email,
        service_type: "wealth_meditation",
        custom_description: "Awaiting voice recording after payment",
      })
      .select()
      .single();

    if (bookingError) {
      logStep("Booking creation failed", { error: bookingError.message });
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }
    logStep("Booking created", { bookingId: booking.id });

    // Create checkout session with price_data
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: discounted 
                ? "108 Wealth Reprogramming Meditation (Bundle Discount)" 
                : "108 Wealth Reprogramming Meditation",
              description: "Your personalized wealth activation meditation with 528/639 Hz frequencies",
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/meditations?wealth_success=true&booking=${booking.id}`,
      cancel_url: `${req.headers.get("origin")}/meditations?cancelled=true`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id,
        service_type: "wealth_meditation",
        delivery_email: email,
        discounted: discounted ? "true" : "false",
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Send affirmations email immediately after checkout creation
    // User pays -> gets email with affirmations -> records and replies
    const emailSent = await sendAffirmationsEmail(email, booking.id);
    
    // Update booking to mark email as sent
    if (emailSent) {
      await supabaseClient
        .from('custom_meditation_bookings')
        .update({ 
          notes: "108 Wealth Reprogramming Meditation - Affirmations email sent, awaiting voice recording" 
        })
        .eq('id', booking.id);
    }
    
    return new Response(JSON.stringify({ 
      url: session.url, 
      bookingId: booking.id,
    }), {
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
