'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ScheduleTestModalProps {
  testId: string;
  testTitle: string;
  onClose: () => void;
  onScheduled?: () => void;
}

export function ScheduleTestModal({ testId, testTitle, onClose, onScheduled }: ScheduleTestModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sendDayBefore, setSendDayBefore] = useState(true);
  const [sendHourBefore, setSendHourBefore] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setScheduledDate(today);
  }, []);

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/schedule-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          scheduledDate,
          scheduledTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          sendDayBeforeReminder: sendDayBefore,
          sendHourBeforeReminder: sendHourBefore,
          notes
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test scheduled successfully! Redirecting to dashboard...');
        onScheduled?.();
        onClose();
        
        // Navigate to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        toast.error(data.error || 'Failed to schedule test');
      }
    } catch (error) {
      console.error('Error scheduling test:', error);
      toast.error('Failed to schedule test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Test Title */}
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600 font-medium">{testTitle}</p>
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Select Date
            </label>
            <input
              id="schedule-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Time Picker */}
          <div>
            <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Select Time
            </label>
            <input
              id="schedule-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Reminder Options */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Email Reminders
            </p>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendDayBefore}
                onChange={(e) => setSendDayBefore(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Send reminder 1 day before</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendHourBefore}
                onChange={(e) => setSendHourBefore(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Send reminder 1 hour before</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="schedule-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="schedule-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add preparation notes..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={loading || !scheduledDate || !scheduledTime}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Scheduling...' : 'Schedule Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
