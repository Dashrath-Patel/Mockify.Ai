import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';

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
  studyTime?: number;
  isToday?: boolean;
}

export function StudyCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());

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

    // Current month days with mock data
    const mockTestDays = [4, 8, 15, 22, 29];
    const completedDays = [1, 2, 3, 4];
    const studyDays = [1, 2, 3, 4, 5, 6, 7];
    
    const isCurrentMonthAndYear = 
      month === today.getMonth() && year === today.getFullYear();
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        hasTest: mockTestDays.includes(i),
        completed: completedDays.includes(i),
        studyTime: studyDays.includes(i) ? Math.floor(Math.random() * 4) + 1 : 0,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-500 py-2">
            {day}
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
          className="grid grid-cols-7 gap-1 md:gap-2"
        >
          {days.map((day, index) => {
            const isSelected = day.isCurrentMonth && selectedDate === day.date;
            const isToday = day.isToday;
            
            return (
              <motion.button
                key={`${index}-${day.date}`}
                whileHover={{ scale: day.isCurrentMonth ? 1.05 : 1 }}
                whileTap={{ scale: day.isCurrentMonth ? 0.95 : 1 }}
                onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                disabled={!day.isCurrentMonth}
                className={`
                  aspect-square p-1 rounded-xl text-sm relative transition-all font-medium
                  ${!day.isCurrentMonth 
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-40' 
                    : 'cursor-pointer'}
                  ${isSelected 
                    ? 'bg-linear-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-violet-400 dark:ring-violet-600' 
                    : isToday
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-2 ring-violet-300 dark:ring-violet-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'}
                  ${day.hasTest && !isSelected ? 'ring-2 ring-violet-300 dark:ring-violet-600/50' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full relative">
                  <span className="z-10">{day.date}</span>
                  
                  {/* Completed indicator */}
                  {day.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0.5 right-0.5"
                    >
                      <CheckCircle2 className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-green-500 dark:text-green-400'}`} />
                    </motion.div>
                  )}
                  
                  {/* Study time dots */}
                  {day.studyTime && day.studyTime > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {Array.from({ length: Math.min(day.studyTime, 4) }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`w-1 h-1 rounded-full ${
                            isSelected 
                              ? 'bg-white' 
                              : 'bg-violet-500 dark:bg-violet-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 md:gap-4 text-xs pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-violet-300 dark:border-violet-600/50 bg-violet-50 dark:bg-violet-900/20"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Test Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
          <span className="text-gray-600 dark:text-gray-400 font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <Circle className="h-2 w-2 fill-violet-500 dark:fill-violet-400 text-violet-500 dark:text-violet-400" />
            <Circle className="h-2 w-2 fill-violet-500 dark:fill-violet-400 text-violet-500 dark:text-violet-400" />
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Study Time</span>
        </div>
      </div>
    </div>
  );
}
