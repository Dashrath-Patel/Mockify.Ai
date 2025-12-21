import { useState, useEffect, useCallback } from 'react';
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { StudyCalendar } from './StudyCalendar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, Target, Award, BookOpen, ArrowRight,
  Calendar, Clock, Zap, Trophy, Users, ChevronRight, Play,
  CheckCircle2, Flame, Brain, BarChart3
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// Types for dashboard data
interface DashboardStats {
  testsCompleted: number;
  testsThisWeek: number;
  averageScore: number;
  scoreImprovement: number;
  studyTimeHours: number;
  globalRank: number;
  rankChange: number;
}

interface PerformanceData {
  date: string;
  score: number;
  time: number;
}

interface SubjectData {
  name: string;
  value: number;
  color: string;
}

interface UpcomingTest {
  id: string;
  title: string;
  date: string;
  time: string;
  questions: number;
}

interface RecentActivity {
  id: string;
  action: string;
  score?: number;
  time: string;
  timestamp: Date;
  type: 'test' | 'upload' | 'practice';
}

interface WeeklyGoal {
  goal: string;
  current: number;
  total: number;
  color: string;
}

// Default fallback data
const defaultPerformanceData: PerformanceData[] = [
  { date: 'Mon', score: 0, time: 0 },
  { date: 'Tue', score: 0, time: 0 },
  { date: 'Wed', score: 0, time: 0 },
  { date: 'Thu', score: 0, time: 0 },
  { date: 'Fri', score: 0, time: 0 },
  { date: 'Sat', score: 0, time: 0 },
  { date: 'Sun', score: 0, time: 0 },
];

const topicColors = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#0ea5e9',
  '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Dashboard() {
  const [userName, setUserName] = useState<string>('User');
  const [examType, setExamType] = useState<string>('UPSC');
  const [studyStreak, setStudyStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Dashboard data states
  const [stats, setStats] = useState<DashboardStats>({
    testsCompleted: 0,
    testsThisWeek: 0,
    averageScore: 0,
    scoreImprovement: 0,
    studyTimeHours: 0,
    globalRank: 0,
    rankChange: 0
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>(defaultPerformanceData);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([
    { goal: 'Complete 5 Tests', current: 0, total: 5, color: 'violet' },
    { goal: 'Study 20 Hours', current: 0, total: 20, color: 'blue' },
    { goal: 'Review 10 Topics', current: 0, total: 10, color: 'emerald' },
  ]);
  
  const supabase = createClient();

  // Fetch dashboard stats (tests completed, average score, study time, rank)
  const fetchDashboardStats = useCallback(async (currentUserId: string) => {
    try {
      console.log('Fetching dashboard stats for user:', currentUserId);
      
      // Fetch completed tests count from mock_tests table
      const { data: completedTests, error: testsError } = await supabase
        .from('mock_tests')
        .select('id, created_at, status')
        .eq('user_id', currentUserId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      console.log('Completed tests from mock_tests:', { 
        count: completedTests?.length, 
        error: testsError,
        data: completedTests 
      });

      if (testsError) {
        console.error('Error fetching completed tests:', testsError);
        return;
      }

      // Also try to fetch test results for scores and time data
      const { data: testResults, error: resultsError } = await supabase
        .from('test_results')
        .select('score, time_spent, completed_at, test_id')
        .eq('user_id', currentUserId)
        .order('completed_at', { ascending: false });

      console.log('Test results data:', { 
        count: testResults?.length, 
        error: resultsError,
        data: testResults 
      });

      // Calculate stats
      const totalTests = completedTests?.length || 0;
      const now = new Date();
      const weekStart = new Date(now.getTime());
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const testsThisWeek = completedTests?.filter(t => 
        new Date(t.created_at) >= weekStart
      ).length || 0;

      // Calculate average score from test_results if available
      const avgScore = testResults && testResults.length > 0
        ? Math.round(testResults.reduce((acc, r) => acc + (r.score || 0), 0) / testResults.length)
        : 0;

      // Calculate score improvement (compare last 5 tests vs previous 5)
      let scoreImprovement = 0;
      if (testResults && testResults.length >= 10) {
        const recent5 = testResults.slice(0, 5).reduce((acc, r) => acc + (r.score || 0), 0) / 5;
        const prev5 = testResults.slice(5, 10).reduce((acc, r) => acc + (r.score || 0), 0) / 5;
        scoreImprovement = Math.round(recent5 - prev5);
      }

      // Calculate total study time (from time_spent in seconds)
      const totalStudyTimeSeconds = testResults?.reduce((acc, r) => acc + (r.time_spent || 0), 0) || 0;
      const studyTimeHours = Math.round(totalStudyTimeSeconds / 3600 * 10) / 10;

      // Get user's rank based on total_points
      const { data: userData } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', currentUserId)
        .single();

      const userPoints = userData?.total_points || 0;

      // Count users with more points to determine rank
      const { count: higherRankedCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', userPoints);

      const globalRank = (higherRankedCount || 0) + 1;

      setStats({
        testsCompleted: totalTests,
        testsThisWeek,
        averageScore: avgScore,
        scoreImprovement,
        studyTimeHours,
        globalRank,
        rankChange: 0 // Would need historical data to calculate
      });

      // Update weekly goals
      // For topics, we don't have topic_wise_score anymore, so just use a placeholder
      setWeeklyGoals([
        { goal: 'Complete 5 Tests', current: testsThisWeek, total: 5, color: 'violet' },
        { goal: 'Study 20 Hours', current: Math.min(Math.round(studyTimeHours), 20), total: 20, color: 'blue' },
        { goal: 'Review 10 Topics', current: Math.min(totalTests, 10), total: 10, color: 'emerald' },
      ]);

      console.log('Updated stats:', {
        testsCompleted: totalTests,
        testsThisWeek,
        averageScore: avgScore,
        scoreImprovement,
        studyTimeHours,
        globalRank
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [supabase]);

  // Fetch weekly performance data for chart
  const fetchPerformanceData = useCallback(async (currentUserId: string) => {
    try {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch from test_results table
      const { data: testResults, error } = await supabase
        .from('test_results')
        .select('score, time_spent, completed_at')
        .eq('user_id', currentUserId)
        .gte('completed_at', weekAgo.toISOString())
        .order('completed_at', { ascending: true });

      if (error) {
        console.error('Error fetching performance data:', error);
        return;
      }

      // Group by day of week
      const dailyData: { [key: string]: { scores: number[], time: number } } = {};
      days.forEach(day => {
        dailyData[day] = { scores: [], time: 0 };
      });

      testResults?.forEach(result => {
        const date = new Date(result.completed_at);
        const dayName = days[date.getDay()];
        dailyData[dayName].scores.push(result.score || 0);
        dailyData[dayName].time += (result.time_spent || 0) / 3600; // Convert to hours
      });

      // Create chart data starting from today and going back 7 days
      const chartData: PerformanceData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        const dayData = dailyData[dayName];
        const avgScore = dayData.scores.length > 0 
          ? Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length)
          : 0;
        
        chartData.push({
          date: dayName,
          score: avgScore,
          time: Math.round(dayData.time * 10) / 10
        });
      }

      setPerformanceData(chartData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  }, [supabase]);

  // Fetch topic distribution (focus areas)
  const fetchTopicDistribution = useCallback(async (currentUserId: string) => {
    try {
      // Get topics directly from mock_tests table
      const { data: mockTests, error: mockTestsError } = await supabase
        .from('mock_tests')
        .select('topic, title')
        .eq('user_id', currentUserId);

      if (mockTestsError) {
        console.error('Error fetching topic distribution:', mockTestsError);
        return;
      }

      // Aggregate topic data
      const topicCounts: { [key: string]: number } = {};
      
      mockTests?.forEach((test) => {
        if (test.topic) {
          // Handle comma-separated topics
          const topics = test.topic.split(',').map((t: string) => t.trim());
          topics.forEach((topic: string) => {
            if (topic) {
              topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            }
          });
        } else if (test.title) {
          // Fallback: Extract topic from title (format: "Topic - Test Name" or just "Topic")
          const titleParts = test.title.split('-').map((s: string) => s.trim());
          const topic = titleParts[0];
          if (topic && topic !== 'Mock Test') {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        }
      });

      // Convert to array and calculate percentages
      const total = Object.values(topicCounts).reduce((a, b) => a + b, 0) || 1;
      const topicArray = Object.entries(topicCounts)
        .map(([name, count], index) => ({
          name,
          value: Math.round((count / total) * 100),
          color: topicColors[index % topicColors.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      if (topicArray.length > 0) {
        setSubjectData(topicArray);
      }
    } catch (error) {
      console.error('Error fetching topic distribution:', error);
    }
  }, [supabase]);

  // Fetch upcoming tests (from scheduled_tests table, sorted by nearest date)
  const fetchUpcomingTests = useCallback(async (currentUserId: string) => {
    try {
      // Fetch scheduled tests that are in the future
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const { data: scheduledTests, error } = await supabase
        .from('scheduled_tests')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          test_id,
          mock_tests!inner(title, total_questions)
        `)
        .eq('user_id', currentUserId)
        .gte('scheduled_date', todayStr)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error fetching upcoming tests:', error);
        return;
      }

      const formattedTests: UpcomingTest[] = scheduledTests?.map(test => {
        const dateTime = new Date(`${test.scheduled_date}T${test.scheduled_time}`);
        const mockTest = Array.isArray(test.mock_tests) ? test.mock_tests[0] : test.mock_tests;
        return {
          id: test.id,
          title: mockTest?.title || 'Scheduled Test',
          date: dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: dateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          questions: mockTest?.total_questions || 0
        };
      }) || [];

      setUpcomingTests(formattedTests);
    } catch (error) {
      console.error('Error fetching upcoming tests:', error);
    }
  }, [supabase]);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async (currentUserId: string) => {
    try {
      const activities: RecentActivity[] = [];

      // Fetch recent test results from test_results table
      const { data: testResults, error: testError } = await supabase
        .from('test_results')
        .select('id, score, completed_at, test_id')
        .eq('user_id', currentUserId)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (testError) {
        console.error('Error fetching test results:', testError);
      }

      // Get test titles for the results
      if (testResults && testResults.length > 0) {
        const testIds = testResults.map(r => r.test_id).filter(Boolean);
        
        if (testIds.length > 0) {
          const { data: testsData } = await supabase
            .from('mock_tests')
            .select('id, title')
            .in('id', testIds);
          
          const testTitleMap: { [key: string]: string } = {};
          testsData?.forEach(t => {
            testTitleMap[t.id] = t.title;
          });

          testResults.forEach(result => {
            if (result.test_id && testTitleMap[result.test_id]) {
              const timestamp = new Date(result.completed_at);
              activities.push({
                id: result.id,
                action: `Completed ${testTitleMap[result.test_id]}`,
                score: result.score,
                time: formatRelativeTime(timestamp),
                timestamp: timestamp,
                type: 'test'
              });
            }
          });
        }
      }

      // Sort by most recent using actual timestamps
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setRecentActivity(activities.slice(0, 3));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }, [supabase]);

  // Calculate study streak
  const calculateStudyStreak = useCallback(async (currentUserId: string) => {
    try {
      // Get all test completion dates from test_results table
      const { data: testResults, error } = await supabase
        .from('test_results')
        .select('completed_at')
        .eq('user_id', currentUserId)
        .order('completed_at', { ascending: false });

      if (error || !testResults?.length) {
        setStudyStreak(0);
        return;
      }

      // Get unique dates
      const studyDates = new Set(
        testResults.map(r => new Date(r.completed_at).toDateString())
      );

      // Calculate streak from today going backwards
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        
        if (studyDates.has(checkDate.toDateString())) {
          streak++;
        } else if (i > 0) {
          // Allow one day gap (yesterday can be missing if checking today)
          break;
        }
      }

      setStudyStreak(streak);
    } catch (error) {
      console.error('Error calculating study streak:', error);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // Set default from auth immediately
          const defaultName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
          setUserName(defaultName);

          // Fetch user data including exam type
          const { data: userData } = await supabase
            .from('users')
            .select('name, exam_type, selected_exam')
            .eq('id', user.id)
            .single();
          
          let currentUserName = defaultName;
          
          if (userData) {
            // Update with database values
            if (userData.name) {
              setUserName(userData.name);
              currentUserName = userData.name;
            }
            
            // Set exam type (prioritize selected_exam, fallback to exam_type)
            const userExam = userData.selected_exam || userData.exam_type;
            if (userExam) {
              setExamType(userExam.toUpperCase());
            }
          }
          
          // Fetch all dashboard data in parallel
          await Promise.all([
            fetchDashboardStats(user.id),
            fetchPerformanceData(user.id),
            fetchTopicDistribution(user.id),
            fetchUpcomingTests(user.id),
            fetchRecentActivity(user.id),
            calculateStudyStreak(user.id)
          ]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [supabase, fetchDashboardStats, fetchPerformanceData, fetchTopicDistribution, fetchUpcomingTests, fetchRecentActivity, calculateStudyStreak]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 relative">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-gray-900 dark:text-white">Welcome back, </span>
            {isLoading ? (
              <span className="inline-block h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            ) : (
              <span className="bg-linear-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                {userName}
              </span>
            )}
            <span className="ml-2">👋</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">Here's your learning progress overview for today</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <>
              <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
              <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            </>
          ) : (
            <>
              <Badge className="bg-linear-to-r from-violet-600 to-purple-600 text-white px-4 py-2 border-0 shadow-lg">
                <Target className="h-3 w-3 mr-2" />
                {examType} 2025
              </Badge>
              <Badge className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 shadow-sm">
                <Flame className="h-3 w-3 mr-2 text-orange-500" />
                {studyStreak} Day Streak
              </Badge>
            </>
          )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { 
            title: "Tests Completed", 
            value: stats.testsCompleted.toString(), 
            change: `+${stats.testsThisWeek} this week`, 
            icon: Target, 
            iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
            iconColor: "text-white"
          },
          { 
            title: "Average Score", 
            value: `${stats.averageScore}%`, 
            change: `${stats.scoreImprovement >= 0 ? '+' : ''}${stats.scoreImprovement}% improvement`, 
            icon: TrendingUp, 
            iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
            iconColor: "text-white"
          },
          { 
            title: "Study Time", 
            value: `${stats.studyTimeHours}h`, 
            change: "This week", 
            icon: Clock, 
            iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
            iconColor: "text-white"
          },
          { 
            title: "Global Rank", 
            value: stats.globalRank > 0 ? `#${stats.globalRank}` : '-', 
            change: stats.rankChange !== 0 ? `${stats.rankChange > 0 ? '+' : ''}${stats.rankChange} positions` : 'Keep going!', 
            icon: Trophy, 
            iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",
            iconColor: "text-white"
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="neubrutalist-card group cursor-pointer"
              whileHover={{ 
                y: -4,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="relative rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-[#555555] dark:text-gray-400">{stat.title}</p>
                      <p className="text-black dark:text-white text-3xl font-bold tracking-tight">{stat.value}</p>
                      <p className="text-xs text-[#555555] dark:text-gray-500 font-medium">{stat.change}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.iconBg} border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Calendar & Upcoming */}
        <div className="lg:col-span-1 space-y-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="group cursor-pointer"
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 dark:from-amber-500 dark:via-orange-600 dark:to-red-600 border-b-[3px] border-black dark:border-white">
                <CardTitle className="text-black flex items-center gap-2 font-bold">
                  <Calendar className="h-5 w-5 text-black" />
                  Study Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <StudyCalendar />
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Tests */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="group cursor-pointer"
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-black dark:text-white flex items-center justify-between font-bold">
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-black dark:text-white" />
                    Upcoming Tests
                  </span>
                  <Button variant="ghost" size="sm" className="text-[#555555] dark:text-gray-400 h-8 font-medium">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTests.length > 0 ? upcomingTests.map((test, index) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-3 rounded-xl bg-white dark:bg-[#2a2a2a] border-[2px] border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-black dark:text-white text-sm font-bold mb-1">
                          {test.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-[#555555] dark:text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {test.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {test.time}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-gradient-to-r from-emerald-400 to-teal-500 border-[2px] border-black dark:border-white text-white text-xs font-bold shadow-lg">
                        {test.questions}Q
                      </Badge>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No upcoming tests</p>
                    <p className="text-xs">Create a new test to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Right Column - Recent Activity & Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group cursor-pointer"
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
                  <Clock className="h-5 w-5 text-black dark:text-white" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]"
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-rose-400 to-pink-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                          {activity.type === 'test' || activity.type === 'practice' ? (
                            <CheckCircle2 className="h-4 w-4 text-black" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-black" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-black dark:text-white text-sm font-bold">{activity.action}</p>
                          <p className="text-xs text-[#555555] dark:text-gray-400 font-medium">{activity.time}</p>
                        </div>
                        {activity.score !== undefined && (
                          <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 border-2 border-black dark:border-white text-white font-bold shadow-lg">
                            {activity.score}%
                          </Badge>
                        )}
                      </motion.div>
                    )) : (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No recent activity</p>
                        <p className="text-xs">Start learning to see your progress</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
          </motion.div>

        {/* Middle Column - Charts */}
        <div className="space-y-6">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group cursor-pointer"
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-black dark:text-white flex items-center gap-2 mb-1 font-bold">
                      <BarChart3 className="h-5 w-5 text-black dark:text-white" />
                      Weekly Performance
                    </CardTitle>
                    <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Your score and study time trends</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-gradient-to-r from-violet-400 to-purple-500 border-[2px] border-black dark:border-white text-white font-bold shadow-lg">
                      Score
                    </Badge>
                    <Badge variant="outline" className="bg-gradient-to-r from-amber-400 to-orange-500 border-[2px] border-black dark:border-white text-white font-bold shadow-lg">
                      Time
                    </Badge>
                  </div>
                </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={performanceData}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 2, stroke: '#1e293b' }}
                        activeDot={{ r: 8 }}
                        fill="url(#scoreGradient)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="time" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#1e293b' }}
                        activeDot={{ r: 8 }}
                        fill="url(#timeGradient)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
          </motion.div>

          {/* Subject Distribution & Study Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group cursor-pointer"
              whileHover={{ 
                y: -4,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 h-full">
                <CardHeader>
                  <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
                    <Brain className="h-5 w-5 text-black dark:text-white" />
                    Focus Areas
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                    {subjectData.length > 0 ? (
                      <>
                        <div className="flex items-center justify-center mb-4">
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={subjectData as any}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {subjectData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {subjectData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                              </div>
                              <span className="text-gray-600 dark:text-gray-400 font-semibold">{item.value}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No data yet</p>
                        <p className="text-xs">Complete tests to see your focus areas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
            </motion.div>

            {/* Study Goals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="group cursor-pointer"
              whileHover={{ 
                y: -4,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 h-full">
                <CardHeader>
                  <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
                    <Target className="h-5 w-5 text-black dark:text-white" />
                    Weekly Goals
                  </CardTitle>
                </CardHeader>
                  <CardContent className="space-y-4">
                    {weeklyGoals.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.goal}</span>
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">{item.current}/{item.total}</span>
                        </div>
                        <div className="relative h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((item.current / item.total) * 100, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className={`h-full bg-gradient-to-r from-${item.color}-600 to-${item.color}-400`}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
            </motion.div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
