# Test Scheduling Feature - Setup Guide

## Overview
This feature allows users to:
- Schedule tests for specific dates and times
- Receive email reminders (1 day before & 1 hour before)
- View and manage scheduled tests
- Get automated email notifications

## Setup Steps

### 1. Database Setup

Run the SQL migration in Supabase SQL Editor:

```bash
backend/database/add-scheduled-tests.sql
```

This creates:
- `scheduled_tests` table
- RLS policies
- Helper functions for reminders

### 2. Email Service Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret_string_here
```

4. Verify your domain (or use `onboarding@resend.dev` for testing)

### 3. Install Dependencies

```bash
npm install resend
```

### 4. Setup Cron Job (Vercel)

If deploying on Vercel:

1. Go to your project → Settings → Cron Jobs
2. Add a new cron job:
   - **Path**: `/api/cron/send-reminders`
   - **Schedule**: `0 * * * *` (every hour)
   - **Header**: `Authorization: Bearer YOUR_CRON_SECRET`

For local testing:
```bash
# Test the cron endpoint
curl -X GET http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 5. Alternative: Supabase Edge Function (Optional)

Instead of Vercel Cron, you can use Supabase Edge Functions:

```bash
# Create edge function
supabase functions new send-test-reminders

# Deploy
supabase functions deploy send-test-reminders
```

Then set up a pg_cron job in Supabase:

```sql
SELECT cron.schedule(
  'send-test-reminders',
  '0 * * * *', -- every hour
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-test-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## Usage

### Schedule a Test (in MockTests component)

```tsx
import { ScheduleTestModal } from '@/components/ScheduleTestModal';
import { useState } from 'react';

function YourComponent() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowScheduleModal(true)}>
        📅 Schedule Test
      </button>
      
      {showScheduleModal && (
        <ScheduleTestModal
          testId="test-uuid"
          testTitle="JEE - Chemistry Test"
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            // Refresh tests list
          }}
        />
      )}
    </>
  );
}
```

### View Scheduled Tests

```tsx
import { ScheduledTestsList } from '@/components/ScheduledTestsList';

function SchedulePage() {
  return (
    <div>
      <h1>My Scheduled Tests</h1>
      <ScheduledTestsList />
    </div>
  );
}
```

## Email Templates

The system sends HTML emails with:
- Test details (title, date, time)
- Preparation tips
- Direct link to start the test
- Beautiful responsive design

## Testing

### Test Scheduling
1. Generate a test
2. Click "Schedule Test"
3. Select future date/time
4. Check `scheduled_tests` table in Supabase

### Test Reminders
```sql
-- Manually trigger reminder check
SELECT * FROM get_tests_needing_reminders();

-- Mark a reminder as sent
SELECT mark_reminder_sent('test-uuid', 'day_before');
```

### Test Email Sending
```bash
curl -X GET http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Database Queries

```sql
-- View all scheduled tests
SELECT * FROM scheduled_tests WHERE user_id = 'your-user-id';

-- View upcoming tests (next 7 days)
SELECT * FROM get_upcoming_tests('your-user-id');

-- View tests needing reminders right now
SELECT * FROM get_tests_needing_reminders();

-- Cancel a scheduled test
UPDATE scheduled_tests 
SET status = 'cancelled' 
WHERE id = 'scheduled-test-id';
```

## Features

✅ Schedule tests for any future date/time
✅ Email reminders (1 day before, 1 hour before)
✅ Beautiful email templates
✅ Timezone support
✅ Notes/preparation reminders
✅ View all scheduled tests
✅ Cancel scheduled tests
✅ RLS security policies
✅ Automatic status updates

## Troubleshooting

**Emails not sending:**
- Check RESEND_API_KEY is set correctly
- Verify domain in Resend dashboard
- Check cron job is running (Vercel logs)
- Test with `onboarding@resend.dev` for development

**Reminders not sent:**
- Check cron job schedule
- Verify CRON_SECRET matches
- Run manual test: `SELECT * FROM get_tests_needing_reminders();`
- Check `day_before_reminder_sent` and `hour_before_reminder_sent` flags

**Timezone issues:**
- Ensure browser timezone is detected correctly
- Check scheduled_time in database uses correct timezone
- Verify server timezone settings

## Next Steps

1. Add calendar integration (Google Calendar, Outlook)
2. Add SMS reminders (using Twilio)
3. Add push notifications (using OneSignal)
4. Add recurring test schedules
5. Add study plan generator based on scheduled tests

## Support

For issues or questions, check:
- Supabase logs
- Vercel function logs
- Browser console
- Email delivery logs in Resend dashboard
