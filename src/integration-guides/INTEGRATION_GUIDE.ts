/**
 * INTEGRATION_GUIDE — SQI 2050 user chat memory (`useUserChatMemory`, `UserChatHistory`).
 *
 * Sacred Healing routes:
 * - Ayurveda → `/ayurveda`
 * - Jyotish → `/jyotish-vidya`
 * - Apothecary (SQI) → `/quantum-apothecary` — persists to `sqi_sessions` and mirrors to `user_chat_sessions`
 * - EOTIS (Temple Home) → `/temple-home`
 *
 * 1. Run SQL migration `20260506200000_user_chat_sessions.sql` in Supabase.
 * 2. Optional panels: `<UserChatHistory />` (all types) or `<UserChatHistory filterChatType="apothecary" />`.
 * 3. In a chat screen: `useSearchParams`, `resumeSessionId = searchParams.get('session')`,
 *    `useUserChatMemory({ chatType: '…', resumeLatest: !resumeSessionId })`, then on `resumeSessionId`
 *    call `loadSession(resumeSessionId)` in a `useEffect`.
 * 4. Append `getContextForPrompt()` to outbound AI prompts.
 * 5. Wire `startNewSession` to a “New session” control.
 */

export {};
