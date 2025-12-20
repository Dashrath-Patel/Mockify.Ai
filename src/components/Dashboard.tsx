import { useState, useEffect } from 'react';
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { StudyCalendar } from './StudyCalendar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, Target, Award, BookOpen, ArrowRight, Sparkles, 
  Calendar, Clock, Zap, Trophy, Users, ChevronRight, Play,
  CheckCircle2, Flame, Brain, BarChart3
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

const performanceData = [
  { date: 'Mon', score: 65, time: 2 },
  { date: 'Tue', score: 70, time: 3 },
  { date: 'Wed', score: 68, time: 2.5 },
  { date: 'Thu', score: 75, time: 4 },
  { date: 'Fri', score: 78, time: 3.5 },
  { date: 'Sat', score: 82, time: 5 },
  { date: 'Sun', score: 85, time: 4 },
];

const subjectData = [
  { name: 'History', value: 25, color: '#8b5cf6' },
  { name: 'Geography', value: 20, color: '#6366f1' },
  { name: 'Polity', value: 18, color: '#3b82f6' },
  { name: 'Economy', value: 22, color: '#06b6d4' },
  { name: 'Science', value: 15, color: '#0ea5e9' },
];

const upcomingTests = [
  { id: 1, title: 'UPSC Prelims Mock Test #12', date: 'Nov 4, 2025', time: '10:00 AM', questions: 100 },
  { id: 2, title: 'Indian Polity Quiz', date: 'Nov 6, 2025', time: '2:00 PM', questions: 25 },
  { id: 3, title: 'Current Affairs Weekly', date: 'Nov 8, 2025', time: '4:00 PM', questions: 50 },
];

const recentActivity = [
  { id: 1, action: 'Completed Economy Test', score: 85, time: '2 hours ago' },
  { id: 2, action: 'Uploaded Geography Notes', time: '5 hours ago' },
  { id: 3, action: 'Started History Mock Test', score: 78, time: '1 day ago' },
];

const leaderboard = [
  { rank: 1, name: 'Priya Sharma', score: 2450, avatar: 'PS', change: '+2' },
  { rank: 2, name: 'Rahul Verma', score: 2380, avatar: 'RV', change: '-1' },
  { rank: 3, name: 'You', score: 2340, avatar: 'D', change: '+1', isYou: true },
  { rank: 4, name: 'Anjali Desai', score: 2290, avatar: 'AD', change: '0' },
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

export function Dashboard() {
  const [userName, setUserName] = useState<string>('User');
  const [examType, setExamType] = useState<string>('UPSC');
  const [studyStreak, setStudyStreak] = useState<number>(12);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Set default from auth immediately
          const defaultName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
          setUserName(defaultName);

          // Fetch user data including exam type
          const { data: userData } = await supabase
            .from('users')
            .select('name, exam_type, selected_exam')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            // Update with database values
            if (userData.name) {
              setUserName(userData.name);
            }
            
            // Set exam type (prioritize selected_exam, fallback to exam_type)
            const userExam = userData.selected_exam || userData.exam_type;
            if (userExam) {
              setExamType(userExam.toUpperCase());
            }
          }
          
          // TODO: Fetch actual study streak from database
          setStudyStreak(12);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

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
            value: "47", 
            change: "+3 this week", 
            icon: Target, 
            iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
            iconColor: "text-white"
          },
          { 
            title: "Average Score", 
            value: "82%", 
            change: "+5% improvement", 
            icon: TrendingUp, 
            iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
            iconColor: "text-white"
          },
          { 
            title: "Study Time", 
            value: "24.5h", 
            change: "This week", 
            icon: Clock, 
            iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
            iconColor: "text-white"
          },
          { 
            title: "Global Rank", 
            value: "#342", 
            change: "+28 positions", 
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
                {upcomingTests.map((test, index) => (
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
                ))}
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Middle Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
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
                    <div className="flex items-center justify-center mb-4">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={subjectData}
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
                    {[
                      { goal: 'Complete 5 Tests', current: 3, total: 5, color: 'violet' },
                      { goal: 'Study 20 Hours', current: 15, total: 20, color: 'blue' },
                      { goal: 'Review 10 Topics', current: 7, total: 10, color: 'emerald' },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.goal}</span>
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">{item.current}/{item.total}</span>
                        </div>
                        <div className="relative h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.current / item.total) * 100}%` }}
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 group cursor-pointer"
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
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-r from-rose-400 to-pink-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                        {activity.score ? (
                          <CheckCircle2 className="h-4 w-4 text-black" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-black" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-black dark:text-white text-sm font-bold">{activity.action}</p>
                        <p className="text-xs text-[#555555] dark:text-gray-400 font-medium">{activity.time}</p>
                      </div>
                      {activity.score && (
                        <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 border-2 border-black dark:border-white text-white font-bold shadow-lg">
                          {activity.score}%
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="group cursor-pointer"
          whileHover={{ 
            y: -4,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
                <Trophy className="h-5 w-5 text-black dark:text-white" />
                Leaderboard
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-3">
                {leaderboard.map((user, index) => (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] ${
                      user.isYou 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold' 
                        : 'bg-white dark:bg-[#2a2a2a]'
                    }`}
                  >
                    <div className={`text-sm w-6 text-center font-bold ${
                      user.isYou ? 'text-black' : 'text-black dark:text-white'
                    }`}>
                      #{user.rank}
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-black dark:border-white">
                      <AvatarFallback className="text-xs font-bold bg-white dark:bg-[#2a2a2a] text-black dark:text-white">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-black dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-[#555555] dark:text-gray-400 font-bold">{user.score} pts</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-bold bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white">
                      {user.change}
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
        </motion.div>
      </div>

      {/* AI Insight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="group cursor-pointer"
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-violet-400 to-purple-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                <Sparkles className="h-6 w-6 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-black dark:text-white mb-2 flex items-center gap-2 font-bold">
                  AI-Powered Insights
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 border-[2px] border-black dark:border-white text-white text-xs font-bold shadow-lg">
                    NEW
                  </Badge>
                </h3>
                <p className="text-[#555555] dark:text-gray-300 leading-relaxed mb-4 font-medium">
                  Excellent progress this week! Your consistency in <span className="text-black dark:text-white font-bold">History</span> and <span className="text-black dark:text-white font-bold">Geography</span> is paying off. 
                  Consider spending 30 more minutes daily on <span className="text-black dark:text-white font-bold">Indian Polity</span> to reach your 85% target by next week.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button className="bg-gradient-to-r from-violet-400 to-purple-500 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl border-[2px] border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] font-bold">
                    <Play className="h-4 w-4 mr-2" />
                    Start Recommended Test
                  </Button>
                  <Button variant="outline" className="rounded-xl bg-white dark:bg-[#2a2a2a] border-[2px] border-black dark:border-white text-black dark:text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                    View Study Plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
