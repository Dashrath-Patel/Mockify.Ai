"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { FileText, Trash2, Search, Clock, Brain, Calendar, Filter, Loader2, Play, ChevronRight, Trophy, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { navigationEvents } from '@/lib/navigation-events';

interface SavedTest {
  id: string;
  name: string;
  topic: string;
  exam_type: string;
  questions: any[];
  duration: number;
  created_at: string;
}

export function TestHistory() {
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<SavedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchSavedTests(user.id);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Filter tests based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTests(savedTests);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTests(savedTests.filter(test => 
        test.name.toLowerCase().includes(query) ||
        test.topic.toLowerCase().includes(query) ||
        test.exam_type.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, savedTests]);

  const fetchSavedTests = async (uid: string) => {
    try {
      // Fetch from mock_tests table with questions
      const { data: dbTests, error } = await supabase
        .from('mock_tests')
        .select(`
          id,
          title,
          exam_type,
          topic,
          total_questions,
          time_limit,
          created_at,
          test_questions (
            question_number,
            question_text,
            options,
            correct_answer,
            topic,
            difficulty,
            explanation
          )
        `)
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (dbTests && dbTests.length > 0) {
        const formattedTests: SavedTest[] = dbTests.map(test => {
          // Extract original exam type from title (format: "ExamType - Topic")
          const examTypeFromTitle = test.title.split(' - ')[0] || test.exam_type;
          
          return {
            id: test.id,
            name: test.title,
            exam_type: examTypeFromTitle,
            topic: test.topic || 'General',
            questions: (test.test_questions || []).map((q: any) => ({
              question: q.question_text,
              options: q.options,
              correctAnswer: q.correct_answer,
              explanation: q.explanation,
              topic: q.topic,
              difficulty: q.difficulty
            })),
            duration: Math.floor((test.time_limit || 1800) / 60),
            created_at: test.created_at
          };
        });
        setSavedTests(formattedTests);
        
        // Update localStorage cache
        const savedTestsKey = `saved_tests_${uid}`;
        localStorage.setItem(savedTestsKey, JSON.stringify(formattedTests));
      } else {
        // Fallback to localStorage
        const savedTestsKey = `saved_tests_${uid}`;
        const existingTests = localStorage.getItem(savedTestsKey);
        if (existingTests) {
          setSavedTests(JSON.parse(existingTests));
        }
      }
    } catch (error) {
      console.error('Error fetching saved tests:', error);
      // Try localStorage as fallback
      const savedTestsKey = `saved_tests_${uid}`;
      const existingTests = localStorage.getItem(savedTestsKey);
      if (existingTests) {
        setSavedTests(JSON.parse(existingTests));
      }
    }
  };

  const handleDeleteClick = (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestToDelete(testId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!testToDelete || !userId) return;

    try {
      // Delete from mock_tests table (test_questions deleted via CASCADE)
      const { error } = await supabase
        .from('mock_tests')
        .delete()
        .eq('id', testToDelete)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setSavedTests(prev => prev.filter(t => t.id !== testToDelete));
      
      // Update localStorage
      const savedTestsKey = `saved_tests_${userId}`;
      const updatedTests = savedTests.filter(t => t.id !== testToDelete);
      localStorage.setItem(savedTestsKey, JSON.stringify(updatedTests));

      toast.success('Test deleted successfully');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    } finally {
      setDeleteConfirmOpen(false);
      setTestToDelete(null);
    }
  };

  const handleStartTest = (test: SavedTest) => {
    // Store test in sessionStorage and redirect to tests page
    sessionStorage.setItem('loadTest', JSON.stringify(test));
    // Trigger navigation loading
    navigationEvents.start('/dashboard/tests');
    router.push('/dashboard/tests');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Test History</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">View and manage your saved tests</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{savedTests.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {savedTests.reduce((acc, t) => acc + t.questions.length, 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {savedTests.reduce((acc, t) => acc + t.duration, 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search tests by name, topic, or exam type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-base rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        </div>
      </motion.div>

      {/* Tests Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredTests.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No tests found' : 'No saved tests yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Generate your first test to see it here'
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/dashboard/tests')}
                  className="bg-[#030213] hover:bg-[#0a0a2e] dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Test
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="h-full"
              >
                <Card className="group h-full flex flex-col hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-[#030213] dark:hover:border-purple-500 overflow-hidden">
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm h-10 line-clamp-2 mb-1">
                            {test.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatDate(test.created_at)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteClick(test.id, e)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-2 min-h-[60px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 h-fit bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium rounded-full">
                          <Brain className="h-3 w-3" />
                          {test.exam_type}
                        </span>
                        {test.name.includes('Weak Topics') && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 h-fit bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
                            <Target className="h-3 w-3" />
                            Weak Topics
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 h-fit bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                          {test.questions.length} Questions
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 h-fit bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                          <Clock className="h-3 w-3" />
                          {test.duration} min
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-3">
                        <span className="font-medium">Topic:</span> {test.topic}
                      </p>
                      
                      <div className="mt-auto pt-3">
                        <Button
                          onClick={() => handleStartTest(test)}
                          className="w-full bg-[#030213] hover:bg-[#0a0a2e] dark:bg-purple-600 dark:hover:bg-purple-700 text-white group-hover:shadow-md transition-shadow"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Test
                          <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Test?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              This will permanently delete this test and all its questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
