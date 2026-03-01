

# Fix: Simple Text Email Editor (No HTML Required)

## Problem
The current "Send Email" page asks for "Content (HTML)" and expects raw HTML code like `<h1>Hello</h1>`. You just want to paste plain text and send it.

## Solution
Replace the HTML textarea with a simple plain-text editor that automatically converts your text into a nicely formatted email behind the scenes.

### What Changes

**1. Rename the field**
- Change label from "Content (HTML) *" to "Message *"
- Update placeholder to just show normal text like "Hello {{name}}, your message here..."
- Remove the `font-mono` styling so it looks like a normal text box

**2. Auto-convert text to email HTML**
- When you type plain text, the system will automatically:
  - Wrap paragraphs in proper email formatting
  - Convert line breaks into spacing
  - Apply Sacred Healing branding (logo, colors, footer)
- You don't need to know any HTML

**3. Keep personalization simple**
- You can still use `{{name}}` and `{{email}}` in your text
- The hint text stays but is simplified

**4. Update the preview**
- Preview will show the final styled email exactly as subscribers will see it
- Includes the Sacred Healing header and footer automatically

**5. Update the edge function**
- The `send-bulk-email` function will accept plain text and wrap it in a branded email template server-side
- This ensures all emails look professional and consistent

### Technical Details

| File | Change |
|------|--------|
| `src/pages/AdminSendEmail.tsx` | Replace HTML textarea with plain text input; auto-wrap content in email template for preview; send plain text to edge function |
| `supabase/functions/send-bulk-email/index.ts` | Add email template wrapper that converts plain text into styled HTML email with Sacred Healing branding |

### Result
- You type or paste normal text
- The system handles all formatting automatically
- Every email arrives looking professional with your branding
