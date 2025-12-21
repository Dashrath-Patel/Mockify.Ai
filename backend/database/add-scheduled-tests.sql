-- Create scheduled_tests table for test scheduling feature
CREATE TABLE IF NOT EXISTS public.scheduled_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
    
    -- Notification settings
    send_day_before_reminder BOOLEAN DEFAULT true,
    send_hour_before_reminder BOOLEAN DEFAULT true,
    day_before_reminder_sent BOOLEAN DEFAULT false,
    hour_before_reminder_sent BOOLEAN DEFAULT false,
    
    -- Tracking
    reminder_email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own scheduled tests" ON public.scheduled_tests;
CREATE POLICY "Users can view own scheduled tests" 
    ON public.scheduled_tests 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scheduled tests" ON public.scheduled_tests;
CREATE POLICY "Users can insert own scheduled tests" 
    ON public.scheduled_tests 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scheduled tests" ON public.scheduled_tests;
CREATE POLICY "Users can update own scheduled tests" 
    ON public.scheduled_tests 
    FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scheduled tests" ON public.scheduled_tests;
CREATE POLICY "Users can delete own scheduled tests" 
    ON public.scheduled_tests 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_user_id ON public.scheduled_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_test_id ON public.scheduled_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_scheduled_date ON public.scheduled_tests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_status ON public.scheduled_tests(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_scheduled_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scheduled_tests_updated_at ON public.scheduled_tests;
CREATE TRIGGER trigger_update_scheduled_tests_updated_at
    BEFORE UPDATE ON public.scheduled_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_tests_updated_at();

-- Function to get upcoming scheduled tests (next 7 days)
CREATE OR REPLACE FUNCTION get_upcoming_tests(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    test_id UUID,
    test_title TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    status TEXT,
    days_until INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id,
        st.test_id,
        mt.title as test_title,
        st.scheduled_date,
        st.scheduled_time,
        st.status,
        (st.scheduled_date - CURRENT_DATE) as days_until
    FROM scheduled_tests st
    JOIN mock_tests mt ON st.test_id = mt.id
    WHERE st.user_id = user_uuid
        AND st.status = 'scheduled'
        AND st.scheduled_date >= CURRENT_DATE
        AND st.scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
    ORDER BY st.scheduled_date, st.scheduled_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tests needing reminders (called by cron job)
CREATE OR REPLACE FUNCTION get_tests_needing_reminders()
RETURNS TABLE (
    scheduled_test_id UUID,
    user_id UUID,
    user_email TEXT,
    test_title TEXT,
    scheduled_datetime TIMESTAMP WITH TIME ZONE,
    reminder_type TEXT
) AS $$
BEGIN
    -- Get tests needing 1 day before reminder
    RETURN QUERY
    SELECT 
        st.id as scheduled_test_id,
        st.user_id,
        u.email as user_email,
        mt.title as test_title,
        (st.scheduled_date + st.scheduled_time) as scheduled_datetime,
        'day_before'::TEXT as reminder_type
    FROM scheduled_tests st
    JOIN users u ON st.user_id = u.id
    JOIN mock_tests mt ON st.test_id = mt.id
    WHERE st.status = 'scheduled'
        AND st.send_day_before_reminder = true
        AND st.day_before_reminder_sent = false
        AND (st.scheduled_date + st.scheduled_time) <= NOW() + INTERVAL '24 hours'
        AND (st.scheduled_date + st.scheduled_time) > NOW() + INTERVAL '23 hours';

    -- Get tests needing 1 hour before reminder
    RETURN QUERY
    SELECT 
        st.id as scheduled_test_id,
        st.user_id,
        u.email as user_email,
        mt.title as test_title,
        (st.scheduled_date + st.scheduled_time) as scheduled_datetime,
        'hour_before'::TEXT as reminder_type
    FROM scheduled_tests st
    JOIN users u ON st.user_id = u.id
    JOIN mock_tests mt ON st.test_id = mt.id
    WHERE st.status = 'scheduled'
        AND st.send_hour_before_reminder = true
        AND st.hour_before_reminder_sent = false
        AND (st.scheduled_date + st.scheduled_time) <= NOW() + INTERVAL '1 hour'
        AND (st.scheduled_date + st.scheduled_time) > NOW() + INTERVAL '59 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(
    test_id UUID,
    reminder_type TEXT
)
RETURNS VOID AS $$
BEGIN
    IF reminder_type = 'day_before' THEN
        UPDATE scheduled_tests
        SET day_before_reminder_sent = true
        WHERE id = test_id;
    ELSIF reminder_type = 'hour_before' THEN
        UPDATE scheduled_tests
        SET hour_before_reminder_sent = true
        WHERE id = test_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE scheduled_tests IS 'Stores scheduled test information with reminder settings';
