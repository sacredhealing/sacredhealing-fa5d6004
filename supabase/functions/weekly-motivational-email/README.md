# Weekly Motivational Email Function

## Overview
This Edge Function sends personalized motivational emails and DMs to users based on their weekly activity patterns. It uses behavioral segmentation to create authentic, guidance-focused messages (no sales pitches).

## Setup

1. **Environment Variables**
   - Ensure `RESEND_API_KEY` is set in Supabase Dashboard
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available

2. **Deploy the Function**
   ```bash
   supabase functions deploy weekly-motivational-email
   ```

3. **Schedule Execution**
   - Option A: Use Supabase Dashboard -> Edge Functions -> weekly-motivational-email -> Cron
     - Schedule: `0 9 * * 1` (Every Monday at 9 AM UTC)
   - Option B: Use pg_cron (if enabled)
     - Run the SQL migration: `20260218000000_weekly_motivational_email_schedule.sql`

4. **Manual Trigger** (for testing)
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/weekly-motivational-email \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

## Behavioral Segments

### Consistent Users
- **Criteria**: 3+ mantra completions this week
- **Message**: Acknowledges dedication and practice time
- **Tone**: Encouraging, recognizes their commitment

### Struggling Users
- **Criteria**: Haven't logged in for 5+ days
- **Message**: Gentle reminder, invitation to return
- **Tone**: Supportive, non-pushy

### Course Seekers
- **Criteria**: Active in mantras but not Stargate members
- **Message**: Soft invitation to Stargate based on their top category
- **Tone**: Invitational, not sales-focused

## Features

- ✅ Service role access (bypasses RLS safely)
- ✅ Practice time calculated in minutes
- ✅ Swedish/English language support
- ✅ Personalized content based on top mantra category
- ✅ Email + Telegram DM delivery
- ✅ Batch processing with error handling
- ✅ No "Buy Now" buttons - pure guidance

## Data Sources

- `mantra_completions` - Tracks mantra practice
- `daily_active_users` - Tracks login activity
- `stargate_community_members` - Checks Stargate membership
- `mantras` - Gets category and duration info
- `profiles` - User information and preferences

## Customization

Edit the `generateEmailContent()` and `generateDMContent()` functions to customize:
- Email templates
- Category-specific Stargate invitations
- Language preferences
- Message tone and style
