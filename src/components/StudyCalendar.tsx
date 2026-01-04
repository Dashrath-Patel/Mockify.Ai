import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CheckCircle2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { createClient } from '@/lib/supabase';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  hasTest?: boolean;
  completed?: boolean;
  studyMinutes?: number;
  scheduledCount?: number;
  isToday?: boolean;
}

interface DayData {
  scheduledTestCount: number;
  completedTests: number;
  studyMinutes: number;
}

export function StudyCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Map<string, DayData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  // Fetch calendar data for the current month
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Format dates for SQL
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        // Fetch scheduled tests for the month
        const { data: scheduledTests } = await supabase
          .from('scheduled_tests')
          .select('scheduled_date')
          .eq('user_id', user.id)
          .gte('scheduled_date', startDate)
          .lte('scheduled_date', endDate);

        // Fetch completed tests for the month
        const { data: completedTests } = await supabase
          .from('test_results')
          .select('completed_at, time_spent')
          .eq('user_id', user.id)
          .gte('completed_at', startDate)
          .lte('completed_at', endDate);

        // Build calendar data map
        const dataMap = new Map<string, DayData>();

        // Process scheduled tests and count them
        scheduledTests?.forEach((test) => {
          const dateStr = test.scheduled_date;
          if (!dataMap.has(dateStr)) {
            dataMap.set(dateStr, { scheduledTestCount: 0, completedTests: 0, studyMinutes: 0 });
          }
          const data = dataMap.get(dateStr)!;
          data.scheduledTestCount += 1;
        });

        // Process completed tests
        completedTests?.forEach((test) => {
          const dateStr = test.completed_at.split('T')[0];
          if (!dataMap.has(dateStr)) {
            dataMap.set(dateStr, { scheduledTestCount: 0, completedTests: 0, studyMinutes: 0 });
          }
          const data = dataMap.get(dateStr)!;
          data.completedTests += 1;
          data.studyMinutes += test.time_spent || 0;
        });

        setCalendarData(dataMap);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, [currentDate, supabase]);

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
      });
    }

    // Current month days with real data from database
    const isCurrentMonthAndYear = 
      month === today.getMonth() && year === today.getFullYear();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = calendarData.get(dateStr);
      
      days.push({
        date: i,
        isCurrentMonth: true,
        hasTest: (dayData?.scheduledTestCount || 0) > 0,
        completed: (dayData?.completedTests || 0) > 0,
        studyMinutes: dayData?.studyMinutes || 0,
        scheduledCount: dayData?.scheduledTestCount || 0,
        isToday: isCurrentMonthAndYear && i === today.getDate(),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
        </div>
        <div className="flex gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-500 py-1 sm:py-2">
            {day.slice(0, 1)}<span className="hidden sm:inline">{day.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2"
        >
          {days.map((day, index) => {
            const isToday = day.isToday;
            
            return (
              <motion.div
                key={`${index}-${day.date}`}
                className={`
                  aspect-square p-0.5 sm:p-1 rounded-lg sm:rounded-xl text-xs sm:text-sm relative transition-all font-bold min-h-[40px] sm:min-h-[65px] flex flex-col
                  ${!day.isCurrentMonth 
                    ? 'text-gray-300 dark:text-gray-700 opacity-40' 
                    : ''}
                  ${isToday
                    ? 'bg-yellow-400 dark:bg-yellow-400 text-black ring-1 sm:ring-2 ring-yellow-500 dark:ring-yellow-500'
                    : 'text-gray-700 dark:text-gray-300'}
                `}
              >
                {/* Date number */}
                <div className="text-center mb-auto pt-0.5 sm:pt-1">
                  <span className="text-xs sm:text-base font-bold">{day.date}</span>
                </div>
                
                {/* Indicators container - Horizontal Layout */}
                <div className="flex items-center justify-center gap-0.5 pb-0.5 sm:pb-1 flex-wrap">
                  {/* Scheduled Test Count - Only show if count > 0 */}
                  {day.scheduledCount && day.scheduledCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      title={`${day.scheduledCount} Test${day.scheduledCount > 1 ? 's' : ''} Scheduled`}
                      className="px-1 py-0.5 rounded text-[8px] sm:text-xs font-bold bg-blue-500 text-white"
                    >
                      {day.scheduledCount}
                    </motion.div>
                  )}
                  
                  {/* Completed Icon */}
                  {day.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      title="Test Completed"
                      className="p-0.5 rounded bg-green-500 dark:bg-green-600 hidden sm:block"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-black" />
                    </motion.div>
                  )}
                  
                  {/* Study Time - Hidden on mobile, too small */}
                  {day.studyMinutes && day.studyMinutes > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      title={`Study Time: ${day.studyMinutes} minutes`}
                      className="hidden sm:flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500 dark:bg-amber-600 text-black"
                    >
                      <Clock className="h-2.5 w-2.5" />
                      <span>{day.studyMinutes}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend - Hidden on mobile */}
      <div className="hidden sm:flex flex-wrap gap-4 text-xs pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-xs font-bold">
            2
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Tests Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-green-500 dark:bg-green-600">
            <CheckCircle2 className="h-3 w-3 text-black" />
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded bg-amber-500 dark:bg-amber-600">
            <Clock className="h-3 w-3 text-black" />
            <span className="text-black text-[9px] font-bold">45</span>
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Study Time (minutes)</span>
        </div>
      </div>
    </div>
  );
}
