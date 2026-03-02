# SQI Chat: What to Send from AI Studio

The Quantum Apothecary chat in Lovable uses a **Supabase Edge Function** that calls **Gemini** with a **system instruction**. For the chat to have the same “deepness” and key points as in AI Studio, you need to align two things.

---

## 1. System instruction (the main fix)

In **Google AI Studio**, your SQI chat has an **Instruction** or **System instruction** that defines personality, rules, and formatting.

**What to do:**

1. Open your SQI chat in [AI Studio](https://aistudio.google.com/).
2. Open **Edit** (pencil) or **Instruction** / **System instruction** for that chat.
3. **Copy the entire instruction text** (everything that defines how SQI should behave, respond, and what it knows).
4. Paste it here so we can put it into the edge function:
   - File: `supabase/functions/quantum-apothecary-chat/index.ts`
   - Replace the content of the `SYSTEM_INSTRUCTION` constant (the big template string) with your pasted text.

**What to send:**  
Paste the **full system instruction / instruction text** from AI Studio (the one that makes SQI “deep” and accurate). That’s the main thing that needs to match.

---

## 2. API key (Gemini in Lovable)

The edge function uses **one** Gemini API key: the one set in **Supabase**, not in the frontend.

**Check:**

1. **Supabase Dashboard** → your project → **Project Settings** → **Edge Functions** → **Secrets**.
2. Ensure there is a secret named **`GEMINI_API_KEY`** and that it’s the **same** key you use in AI Studio (or from the same Google Cloud project / API key).
3. If it’s missing or different, add/update `GEMINI_API_KEY` with the key from [Google AI Studio](https://aistudio.google.com/app/apikey) (or from Google Cloud Console for that project).

If the key in Supabase is wrong or from a different project, the model and behavior can differ.

---

## 3. Optional: model name

If in AI Studio you use a specific model (e.g. **Gemini 1.5 Pro** or **Gemini 2.0 Flash**), tell me which one. The edge function can be set to use the same model name so behavior matches.

---

## Summary: what to send

| From AI Studio | What to do with it |
|----------------|--------------------|
| **Full system instruction / Instruction text** | Paste it here (or into `quantum-apothecary-chat/index.ts` as `SYSTEM_INSTRUCTION`) so the Lovable chat uses the same “key points” and depth. |
| **Gemini API key** | Ensure it’s set as `GEMINI_API_KEY` in Supabase Edge Function secrets. |
| **Model name** (if you care) | Tell me the exact model; we’ll set it in the edge function. |

Once you paste the **full system instruction** from AI Studio, the next step is to put it into `supabase/functions/quantum-apothecary-chat/index.ts` so the SQI chat in Lovable matches AI Studio.
