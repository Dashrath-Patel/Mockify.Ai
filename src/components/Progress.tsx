import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, Target, BookOpen, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';

const performanceData = [
  { test: 'Test 1', score: 65, accuracy: 60 },
  { test: 'Test 2', score: 70, accuracy: 65 },
  { test: 'Test 3', score: 68, accuracy: 64 },
  { test: 'Test 4', score: 75, accuracy: 70 },
  { test: 'Test 5', score: 78, accuracy: 74 },
  { test: 'Test 6', score: 82, accuracy: 78 },
  { test: 'Test 7', score: 85, accuracy: 80 },
  { test: 'Test 8', score: 88, accuracy: 83 },
];

const topicAnalysis = [
  { topic: 'History', strength: 85, weakness: 15, tests: 12 },
  { topic: 'Geography', strength: 78, weakness: 22, tests: 10 },
  { topic: 'Polity', strength: 65, weakness: 35, tests: 8 },
  { topic: 'Economy', strength: 72, weakness: 28, tests: 9 },
  { topic: 'Science', strength: 88, weakness: 12, tests: 15 },
  { topic: 'Environment', strength: 70, weakness: 30, tests: 7 },
];

const timeDistribution = [
  { name: 'History', value: 25, color: '#8b5cf6' },
  { name: 'Geography', value: 20, color: '#6366f1' },
  { name: 'Polity', value: 15, color: '#3b82f6' },
  { name: 'Economy', value: 20, color: '#06b6d4' },
  { name: 'Science', value: 20, color: '#0ea5e9' },
];

export function Progress() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Your Progress</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">Track your performance and improvement over time</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { title: "Current Average", value: "82.5%", change: "+12% from start", icon: TrendingUp, gradient: "from-violet-600 to-purple-600" },
          { title: "Best Score", value: "88%", change: "In Science & Tech", icon: Award, gradient: "from-blue-600 to-cyan-600" },
          { title: "Tests Completed", value: "47", change: "Across all topics", icon: Target, gradient: "from-emerald-600 to-teal-600" },
          { title: "Study Streak", value: "12 days", change: "Keep it up! 🔥", icon: BookOpen, gradient: "from-amber-600 to-orange-600" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="group cursor-pointer"
              whileHover={{ 
                y: -4,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-[#555555] dark:text-gray-400 font-bold">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black dark:text-white mb-1">{stat.value}</div>
                  <p className="text-xs text-black dark:text-white font-medium">{stat.change}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Performance Chart */}
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
        <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-black dark:text-white text-xl font-bold">Performance Over Time</CardTitle>
            <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Your score and accuracy trends across recent tests</p>
          </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="test" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#fff'
                    }} 
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 8 }}
                    name="Score (%)"
                    fill="url(#scoreGrad)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 8 }}
                    name="Accuracy (%)"
                    fill="url(#accuracyGrad)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic-wise Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 group cursor-pointer"
          whileHover={{ 
            y: -4,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-black dark:text-white font-bold">Topic-wise Analysis</CardTitle>
              <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Strengths vs areas for improvement</p>
            </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicAnalysis} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="topic" type="category" stroke="#64748b" width={100} fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Bar dataKey="strength" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Strength %" />
                    <Bar dataKey="weakness" fill="#ef4444" radius={[0, 4, 4, 0]} name="Weakness %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </motion.div>

        {/* Study Time Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="group cursor-pointer"
          whileHover={{ 
            y: -4,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-black dark:text-white font-bold">Study Distribution</CardTitle>
              <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Time spent per topic</p>
            </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={timeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {timeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {timeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-400">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </motion.div>
      </div>

      {/* AI Recommendations */}
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
        <Card className="rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 dark:from-amber-500/30 dark:via-orange-500/30 dark:to-rose-500/30 border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
              <Sparkles className="h-5 w-5 text-black dark:text-white" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#2a2a2a] rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 border-2 border-black dark:border-white text-white mt-1 font-bold shadow-lg">Strength</Badge>
                <p className="text-sm text-black dark:text-white font-medium">
                  Excellent progress in <strong className="text-black dark:text-white">Science & Technology</strong>! You're performing 15% above average.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#2a2a2a] rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                <Badge className="bg-gradient-to-r from-violet-400 to-purple-500 border-2 border-black dark:border-white text-white mt-1 font-bold shadow-lg">Focus</Badge>
                <p className="text-sm text-black dark:text-white font-medium">
                  Spend more time on <strong className="text-black dark:text-white">Polity</strong> - it needs attention. Try taking 2-3 topic tests this week.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#2a2a2a] rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-black dark:border-white text-white mt-1 font-bold shadow-lg">Insight</Badge>
                <p className="text-sm text-black dark:text-white font-medium">
                  Your accuracy is improving consistently. Maintain this momentum for optimal results!
                </p>
              </div>
            </CardContent>
          </Card>
      </motion.div>
    </div>
  );
}
