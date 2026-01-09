import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      throw new Error("User not authenticated");
    }

    const { text } = await req.json();

    if (!text || !text.trim()) {
      throw new Error("Missing text content");
    }

    // Check user has access to Creative Soul tool
    const { data: toolAccess } = await supabaseClient
      .from('user_creative_tools')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (!toolAccess || toolAccess.length === 0) {
      throw new Error("You don't have access to Creative Soul. Please purchase it first.");
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Title
    page.drawText("Creative Soul Document", {
      x: 50,
      y: height - 50,
      size: 24,
      font: timesRomanBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Date
    page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: height - 80,
      size: 10,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Content
    const lines = text.split('\n');
    let yPosition = height - 120;
    const fontSize = 12;
    const lineHeight = 15;
    const margin = 50;
    const maxWidth = width - (margin * 2);

    for (const line of lines) {
      if (yPosition < margin) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      // Simple text wrapping (basic implementation)
      const words = line.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > maxWidth && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: timesRomanFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
          currentLine = word;
          
          if (yPosition < margin) {
            const newPage = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= 5; // Extra spacing between paragraphs
    }

    // Footer
    const totalPages = pdfDoc.getPageCount();
    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      page.drawText(`Page ${i + 1} of ${totalPages}`, {
        x: width / 2 - 30,
        y: 30,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    console.log(`[CREATIVE-SOUL-PDF] Generated PDF for user: ${user.id}`);

    return new Response(
      JSON.stringify({ pdfBase64 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-SOUL-PDF] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

