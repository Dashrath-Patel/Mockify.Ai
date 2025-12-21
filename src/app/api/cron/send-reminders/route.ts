import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Use service role key for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tests needing reminders
    const { data: testsNeedingReminders, error } = await supabase
      .rpc('get_tests_needing_reminders');

    if (error) {
      console.error('Error getting tests needing reminders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Found ${testsNeedingReminders?.length || 0} tests needing reminders`);

    const sentReminders: any[] = [];

    // Send reminders
    for (const test of testsNeedingReminders || []) {
      try {
        const scheduledDate = new Date(test.scheduled_datetime);
        const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = scheduledDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const reminderText = test.reminder_type === 'day_before'
          ? '1 day'
          : '1 hour';

        // Send email using Resend
        await resend.emails.send({
          from: 'ExamSensei <noreply@examsensei.com>',
          to: test.user_email,
          subject: `Reminder: Your test "${test.test_title}" is scheduled in ${reminderText}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .test-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 Test Reminder</h1>
                </div>
                <div class="content">
                  <h2>Your test is coming up!</h2>
                  <p>Hi there! This is a friendly reminder that your scheduled test is approaching.</p>
                  
                  <div class="test-details">
                    <h3>${test.test_title}</h3>
                    <div class="detail-row">
                      <span><strong>📅 Date:</strong></span>
                      <span>${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                      <span><strong>🕐 Time:</strong></span>
                      <span>${formattedTime}</span>
                    </div>
                    <div class="detail-row">
                      <span><strong>⏰ Reminder:</strong></span>
                      <span>${reminderText} before test</span>
                    </div>
                  </div>

                  <p><strong>Preparation Tips:</strong></p>
                  <ul>
                    <li>Review your study materials</li>
                    <li>Get a good night's sleep</li>
                    <li>Prepare your workspace</li>
                    <li>Keep water and snacks ready</li>
                  </ul>

                  <center>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/test" class="button">
                      Start Test
                    </a>
                  </center>

                  <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Good luck! We believe in you! 💪
                  </p>
                </div>
                <div class="footer">
                  <p>This is an automated reminder from ExamSensei</p>
                  <p>To manage your test schedule, visit your dashboard</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        // Mark reminder as sent
        await supabase.rpc('mark_reminder_sent', {
          test_id: test.scheduled_test_id,
          reminder_type: test.reminder_type
        });

        sentReminders.push({
          testId: test.scheduled_test_id,
          email: test.user_email,
          type: test.reminder_type
        });

        console.log(`✓ Sent ${test.reminder_type} reminder for test: ${test.test_title}`);

      } catch (emailError) {
        console.error(`Failed to send reminder for test ${test.scheduled_test_id}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: sentReminders.length,
      details: sentReminders
    });

  } catch (error) {
    console.error('Error in send-reminders cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
