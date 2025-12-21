'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface ScheduledTest {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes?: string;
  mock_tests: {
    title: string;
    total_questions: number;
    time_limit: number;
    difficulty: string;
  };
}

export function ScheduledTestsList() {
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    fetchScheduledTests();
  }, []);

  const fetchScheduledTests = async () => {
    try {
      const response = await fetch('/api/schedule-test?status=scheduled');
      const data = await response.json();
      
      if (data.success) {
        setScheduledTests(data.scheduledTests);
      }
    } catch (error) {
      console.error('Error fetching scheduled tests:', error);
      toast.error('Failed to load scheduled tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Scheduled test cancelled');
      fetchScheduledTests();
    } catch (error) {
      console.error('Error deleting scheduled test:', error);
      toast.error('Failed to cancel test');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysUntil = (date: string) => {
    const scheduledDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduledDate.setHours(0, 0, 0, 0);
    
    const diffTime = scheduledDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Past';
    return `In ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (scheduledTests.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Tests</h3>
        <p className="text-gray-600">Schedule a test to receive reminders and stay on track!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Scheduled Tests</h2>
      
      {scheduledTests.map((test) => {
        const daysUntil = getDaysUntil(test.scheduled_date);
        const isPast = daysUntil === 'Past';
        
        return (
          <div 
            key={test.id} 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              isPast ? 'border-gray-300 opacity-60' : 'border-indigo-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {test.mock_tests.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    daysUntil === 'Today' 
                      ? 'bg-red-100 text-red-700'
                      : daysUntil === 'Tomorrow'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {daysUntil}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(test.scheduled_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(test.scheduled_time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {test.mock_tests.total_questions} Questions
                  </div>
                </div>

                {test.notes && (
                  <p className="text-sm text-gray-600 italic mt-2">
                    📝 {test.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDelete(test.id)}
                className="text-red-600 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                title="Cancel scheduled test"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
