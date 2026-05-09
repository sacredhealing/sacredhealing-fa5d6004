// supabase/functions/ayurveda-chat/index.ts
      });
    }


    const language = (body.language as string) || "English";
    const profile = body.profile ?? null;
    const dosha = body.dosha ?? null;


    const systemText = [
      SYSTEM_TEXT,
      language !== "English" ? `Respond in: ${language}.` : "",
      dosha ? `Seeker's Dosha: ${JSON.stringify(dosha)}.` : "",
      profile?.prakriti ? `Prakriti: ${profile.prakriti}.` : "",
    ].filter(Boolean).join("\n");


    // Build Gemini contents
    const contents = incomingMessages.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: (m.content ?? "").trim() || " " }],
    }));


    const gemRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { maxOutputTokens: 1500, temperature: 0.8 },
      }),
    });


    if (!gemRes.ok) {
      const errText = await gemRes.text().catch(() => "");
      console.error("[ayurveda-chat] Gemini error", gemRes.status, errText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "gemini_error", status: gemRes.status, detail: errText.slice(0, 300) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const gemData = await gemRes.json();
    const text = gemData.candidates?.[0]?.content?.parts?.[0]?.text ?? "The transmission is momentarily veiled. Please try again.";


    // Stream as SSE
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseChunk(text)));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });


    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[ayurveda-chat] Unexpected", err);
    return new Response(
      JSON.stringify({ error: "Transmission interrupted", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
