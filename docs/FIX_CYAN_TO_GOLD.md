# Fix: Kill All Cyan — One Prompt to Rule Them All

The cyan color (#00F2FE) is hardcoded in the Button component's variants.
This is why every button across the app is still cyan.
This single prompt fixes it app-wide.

---

## PROMPT (paste into Cursor):

```
CRITICAL DESIGN FIX: The entire app's button system is hardcoded to cyan (#00F2FE).
Change it to Sacred Gold (#D4AF37) everywhere.

File: src/components/ui/button.tsx

This is the ROOT CAUSE of all cyan buttons across the app. The buttonVariants 
uses #00F2FE as the primary color. Replace ALL instances:

1. DEFAULT variant:
   BEFORE: "bg-[#00F2FE] text-[#000000] font-extrabold hover:bg-[#00D4E0] shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] border-none"
   AFTER:  "bg-gradient-to-r from-[#D4AF37] to-[#C4943A] text-[#000000] font-extrabold hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] border-none"

2. SPIRITUAL variant:
   BEFORE: "bg-[#00F2FE] text-[#000000] font-extrabold hover:bg-[#00D4E0] shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] hover:scale-105 border-none"
   AFTER:  "bg-gradient-to-r from-[#D4AF37] to-[#C4943A] text-[#000000] font-extrabold hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] hover:scale-105 border-none"

3. OUTLINE variant shadow:
   BEFORE: "shadow-[0_0_10px_rgba(0,242,254,0.1)]"
   AFTER:  "shadow-[0_0_10px_rgba(212,175,55,0.1)]"

4. GHOST variant hover:
   BEFORE: "hover:shadow-[0_0_10px_rgba(0,242,254,0.15)]"
   AFTER:  "hover:shadow-[0_0_10px_rgba(212,175,55,0.15)]"

5. LINK variant:
   BEFORE: "text-[#00F2FE]"
   AFTER:  "text-[#D4AF37]"

6. GLASS variant shadows:
   BEFORE: "shadow-[0_0_15px_rgba(0,242,254,0.15)] hover:shadow-[0_0_20px_rgba(0,242,254,0.25)]"
   AFTER:  "shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]"

Also do a global search across the ENTIRE src/ directory for any remaining 
hardcoded #00F2FE, #00D4E0, rgba(0,242,254, or "00F2FE" and replace with 
the gold equivalent:
- #00F2FE → #D4AF37
- #00D4E0 → #C4943A  
- rgba(0,242,254 → rgba(212,175,55

Check these files specifically — they likely have inline cyan:
- src/index.css (CSS variables, any --primary or --accent using cyan)
- src/components/dashboard/JourneyTimeline.tsx
- src/components/dashboard/PositiveMeCard.tsx
- src/pages/healing/MySacredFlame.tsx ("Start a Soul Session" button)
- src/pages/PathDetail.tsx ("Complete Day 6" button)
- src/components/achievements/ShareableProgressCard.tsx (the purple card 
  background is fine to keep as a design accent, but change the "Share My 
  Progress" button from orange-500 to the gold gradient: 
  from-[#D4AF37] to-[#C4943A])

Also check tailwind.config.ts for any cyan theme colors defined there.

After this change, EVERY button in the app will be sacred gold. The only 
exception is the "gold" variant which already uses gold (keep it as-is).

DO NOT change any text colors to gold where they should remain white or 
muted. Only buttons, links, active states, and accent elements.
```

---

## Why This Is The Fix

The button.tsx file is the single source of truth for button styling across the entire app. 
Every component that uses `<Button>`, `<Button variant="spiritual">`, or `<Button variant="default">` 
gets the cyan color from here. By fixing this ONE file, you fix:

- "Claim 15 SHC" button (dashboard)
- "Continue Day 6" button (dashboard + path detail)
- "Complete Day 6" button (/paths/inner-peace)
- "Start a Soul Session" button (/healing/my-sacred-flame)
- "Continue your next step" button (Your Light section)
- "Share My Progress" button (achievements)
- Every other button in the entire app

You do NOT need to fix each component individually.
