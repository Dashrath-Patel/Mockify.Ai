import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { AlertCircle, Brain, Zap, Loader2, FileText, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { TestInstructionsScreen } from './TestInstructionsScreen';
import { MockTestInterface } from './MockTestInterface';
import { TestResultsScreen } from './TestResultsScreen';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

interface Material {
  id: string;
  file_url: string;
  topic: string;
  created_at: string;
}

interface SavedTest {
  id: string;
  name: string;
  exam_type: string;
  topic: string;
  questions: Question[];
  duration: number;
  created_at: string;
}

type TestScreen = 'setup' | 'instructions' | 'test' | 'results';

export function MockTests() {
  const [currentScreen, setCurrentScreen] = useState<TestScreen>('setup');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(25);
  const [testDuration, setTestDuration] = useState(30);
  const [questionInput, setQuestionInput] = useState('25');
  const [durationInput, setDurationInput] = useState('30');
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableExamTypes, setAvailableExamTypes] = useState<string[]>([]);
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [loadingSavedTests, setLoadingSavedTests] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [syllabusMaterials, setSyllabusMaterials] = useState<Material[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [syllabusTopics, setSyllabusTopics] = useState<string[]>([]);
  const [testName, setTestName] = useState('');
  
  const supabase = createClient();
  
  // Notify parent component when test screen changes (to hide/show sidebar)
  useEffect(() => {
    const shouldHideInterface = currentScreen === 'test' || currentScreen === 'instructions';
    const event = new CustomEvent('test-interface-change', {
      detail: { hideInterface: shouldHideInterface }
    });
    window.dispatchEvent(event);
  }, [currentScreen]);
  
  // Fetch user and materials on mount
  useEffect(() => {
    async function fetchUserAndMaterials() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchMaterials(user.id);
        await fetchUserExamType(user.id);
        await fetchSavedTests(user.id);
      }
    }
    fetchUserAndMaterials();
  }, []);
  
  // Auto-load topic when material is selected
  useEffect(() => {
    if (selectedMaterial) {
      const material = materials.find(m => m.id === selectedMaterial);
      if (material?.topic) {
        setSelectedTopics([material.topic]);
        console.log('✓ Auto-loaded topic:', material.topic);
      }
    }
  }, [selectedMaterial, materials]);
  
  // Extract topics when syllabus is selected
  useEffect(() => {
    if (selectedSyllabus) {
      const syllabus = syllabusMaterials.find(m => m.id === selectedSyllabus);
      if (syllabus) {
        const structuredContent = (syllabus as any).structured_content;
        if (structuredContent?.syllabus_data?.topics) {
          const topics = structuredContent.syllabus_data.topics;
          setSyllabusTopics(topics);
          console.log('✓ Extracted', topics.length, 'topics from syllabus');
          toast.success(`Found ${topics.length} topics in syllabus`);
        } else {
          setSyllabusTopics([]);
          console.log('⚠️ No topics found in syllabus structured_content');
        }
      }
    } else {
      setSyllabusTopics([]);
    }
  }, [selectedSyllabus, syllabusMaterials]);
  
  async function fetchUserExamType(uid: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('exam_type, selected_exam')
        .eq('id', uid)
        .single();
      
      if (error) {
        console.error('Error fetching user exam type:', error);
        return;
      }
      
      // Set the user's exam type as default
      if (data?.exam_type || data?.selected_exam) {
        const examType = data.exam_type || data.selected_exam;
        setSelectedExam(examType);
        console.log('✓ Set default exam type:', examType);
      }
    } catch (error) {
      console.error('Error fetching exam type:', error);
    }
  }
  
  async function fetchMaterials(uid: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('id, file_url, topic, created_at, material_type, structured_content')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Separate syllabus materials from regular materials
      const syllabus = (data || []).filter((m: any) => m.material_type === 'syllabus');
      const regular = (data || []).filter((m: any) => m.material_type !== 'syllabus');
      
      setMaterials(regular);
      setSyllabusMaterials(syllabus);
      
      console.log('✓ Found', syllabus.length, 'syllabus materials and', regular.length, 'regular materials');
      
      // Extract unique topics from materials
      const topics = [...new Set(data?.map((m: any) => m.topic).filter(Boolean))] as string[];
      
      // Set topics from materials (users can add custom topics by typing)
      if (topics.length > 0) {
        setAvailableTopics(topics);
        console.log('✓ Found topics:', topics);
      } else {
        setAvailableTopics([]);
        console.log('⚠️ No topics found in materials yet');
      }
      
      // Set common exam types as suggestions (users can type custom ones)
      setAvailableExamTypes(['NEET', 'JEE', 'UPSC', 'CAT', 'GATE', 'SSC', 'Banking', 'Railways']);
      
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateTest = async () => {
    if (!selectedMaterial || !selectedExam || selectedTopics.length === 0) {
      toast.error('Please select material, exam, and at least one topic');
      return;
    }
    
    setGeneratingQuestions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to generate tests');
        return;
      }
      
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          materialIds: [selectedMaterial],
          userId: userId,
          testConfig: {
            examType: selectedExam,
            difficulty: 'medium',
            questionCount: questionCount,
            topics: selectedTopics
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }
      
      const data = await response.json();
      
      if (!data.questions || data.questions.length === 0) {
        toast.error('No questions were generated. Please try again.');
        return;
      }
      
      setQuestions(data.questions);
      
      // Save the generated test
      await saveGeneratedTest(data.questions);
      
      toast.success(`Generated ${data.questions.length} questions!`, {
        description: `Using ${data.metadata.chunks_used} relevant chunks (${data.metadata.average_similarity} avg similarity)`
      });
      
      // Show instructions screen
      setCurrentScreen('instructions');
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Generate smart, SHORT test name
  const generateSmartTestName = (topics: string[]): string => {
    if (!topics || topics.length === 0) {
      return `${selectedExam} Mock Test`;
    }
    
    if (topics.includes('Full Syllabus') || topics.length >= 20) {
      return `${selectedExam} Full Syllabus Test`;
    }
    
    if (topics.length === 1) {
      // Single topic - use full name if short, otherwise truncate
      const topic = topics[0];
      if (topic.length > 40) {
        return `${selectedExam} - ${topic.substring(0, 37)}...`;
      }
      return `${selectedExam} - ${topic}`;
    }
    
    // Multiple topics - analyze and categorize by subject
    const subjectCount: Record<string, number> = {};
    topics.forEach(topic => {
      const subject = topic.split('-')[0]?.trim() || 'General';
      subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    });
    
    const subjects = Object.keys(subjectCount);
    
    // If all topics are from same subject
    if (subjects.length === 1) {
      return `${selectedExam} - ${subjects[0]} (${topics.length} Topics)`;
    }
    
    // Multiple subjects - create summary
    if (subjects.length === 2) {
      return `${selectedExam} - ${subjects[0]} & ${subjects[1]}`;
    }
    
    if (subjects.length === 3) {
      return `${selectedExam} - ${subjects.join(', ')}`;
    }
    
    // 4+ subjects - just mention count
    return `${selectedExam} - Mixed Topics (${topics.length})`;
  };

  // Save generated test to database + localStorage (hybrid approach)
  const saveGeneratedTest = async (generatedQuestions: Question[]) => {
    if (!userId) return;
    
    const testId = crypto.randomUUID();
    const topicString = selectedTopics.join(', ');
    const finalTestName = testName.trim() || generateSmartTestName(selectedTopics);
    const timestamp = new Date().toISOString();
    
    const newTest: SavedTest = {
      id: testId,
      name: finalTestName,
      exam_type: selectedExam,
      topic: topicString,
      questions: generatedQuestions,
      duration: testDuration,
      created_at: timestamp
    };
    
    // 1. Save to localStorage first (instant feedback)
    const savedTestsKey = `saved_tests_${userId}`;
    const existingTests = localStorage.getItem(savedTestsKey);
    const tests = existingTests ? JSON.parse(existingTests) : [];
    tests.unshift(newTest);
    
    if (tests.length > 50) { // Increased from 10 to 50 for better caching
      tests.length = 50;
    }
    
    localStorage.setItem(savedTestsKey, JSON.stringify(tests));
    setSavedTests(tests);
    
    // 2. Sync to database (background, non-blocking)
    setSyncStatus('syncing');
    try {
      // Map exam type to valid ENUM value
      const validExamTypes = ['UPSC', 'Banking', 'SSC', 'NEET', 'JEE', 'CAT', 'GATE'];
      const examTypeForDB = validExamTypes.includes(selectedExam) ? selectedExam : 'Other';
      
      // Save test metadata to mock_tests table
      const { data: testData, error: testError } = await supabase
        .from('mock_tests')
        .insert({
          id: testId,
          user_id: userId,
          exam_type: examTypeForDB,
          topic: topicString,
          title: finalTestName,
          description: `Generated test for ${topicString}`,
          is_ai_generated: true,
          test_type: 'topic_specific',
          difficulty: 'medium',
          total_questions: generatedQuestions.length,
          time_limit: testDuration * 60,
          status: 'draft'
        })
        .select()
        .single();
      
      if (testError) throw testError;
      
      // Save questions to test_questions table
      const questionsToInsert = generatedQuestions.map((q, index) => ({
        test_id: testId,
        question_number: index + 1,
        question_text: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        topic: q.topic,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        explanation: q.explanation,
        marks: 2,
        negative_marks: 0.66
      }));
      
      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert);
      
      if (questionsError) throw questionsError;
      
      setSyncStatus('synced');
      console.log('✓ Test saved to database:', testId);
      
    } catch (error) {
      setSyncStatus('offline');
      console.error('⚠️ Database save failed (data safe in localStorage):', error);
      // Don't show error to user - localStorage has the data
      // Silently log for debugging
    }
  };

  // Fetch saved tests from database with localStorage fallback (hybrid approach)
  const fetchSavedTests = async (uid: string) => {
    setLoadingSavedTests(true);
    const savedTestsKey = `saved_tests_${uid}`;
    
    try {
      // 1. Try loading from database (primary source)
      const { data: dbTests, error: dbError } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!dbError && dbTests && dbTests.length > 0) {
        // Convert database format to SavedTest format
        const formattedTests: SavedTest[] = dbTests.map(test => {
          // Extract original exam type from title (format: "ExamType - Topic")
          const examTypeFromTitle = test.title.split(' - ')[0] || test.exam_type;
          
          return {
            id: test.id,
            name: test.title,
            exam_type: examTypeFromTitle, // Use original exam type from title
            topic: test.topic || 'General',
            questions: (test.test_questions || []).map((q: any) => ({
              question: q.question_text,
              options: q.options,
              correctAnswer: q.correct_answer,
              explanation: q.explanation,
              topic: q.topic,
              difficulty: q.difficulty
            })),
            duration: Math.floor(test.time_limit / 60),
            created_at: test.created_at
          };
        });
        
        setSavedTests(formattedTests);
        setSyncStatus('synced');
        
        // Update localStorage cache with latest from DB
        localStorage.setItem(savedTestsKey, JSON.stringify(formattedTests));
        console.log('✓ Loaded', formattedTests.length, 'tests from database');
        setLoadingSavedTests(false);
        return;
      }
    } catch (error) {
      console.warn('⚠️ Database fetch failed, using localStorage:', error);
      setSyncStatus('offline');
    }
    
    // 2. Fallback to localStorage (offline mode or DB error)
    try {
      const existingTests = localStorage.getItem(savedTestsKey);
      if (existingTests) {
        const localTests = JSON.parse(existingTests);
        setSavedTests(localTests);
        console.log('✓ Loaded', localTests.length, 'tests from localStorage (offline mode)');
      } else {
        setSavedTests([]);
      }
    } catch (error) {
      console.error('Error fetching saved tests:', error);
      setSavedTests([]);
    } finally {
      setLoadingSavedTests(false);
    }
  };

  // Load a saved test
  const loadSavedTest = (test: SavedTest) => {
    setQuestions(test.questions);
    setSelectedExam(test.exam_type);
    setSelectedTopics(test.topic.split(', '));
    setTestDuration(test.duration);
    setCurrentScreen('instructions');
    toast.success(`Loaded test: ${test.name}`);
  };

  // Delete a saved test from both database and localStorage
  const deleteSavedTest = async (testId: string) => {
    if (!userId) return;
    
    // Find the test to show how many questions will be deleted
    const testToRemove = savedTests.find(t => t.id === testId);
    const questionCount = testToRemove?.questions.length || 0;
    
    // 1. Delete from localStorage immediately (instant feedback)
    const savedTestsKey = `saved_tests_${userId}`;
    const updatedTests = savedTests.filter(test => test.id !== testId);
    localStorage.setItem(savedTestsKey, JSON.stringify(updatedTests));
    setSavedTests(updatedTests);
    
    // Show deleting toast
    const deletingToast = toast.loading(
      `Deleting test and ${questionCount} questions...`
    );
    
    // 2. Sync deletion to database (background)
    try {
      const { error } = await supabase
        .from('mock_tests')
        .delete()
        .eq('id', testId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Success - questions automatically deleted via CASCADE
      toast.success(
        `Test deleted successfully!`,
        { 
          id: deletingToast
        }
      );
      console.log('✓ Test deleted from database:', testId);
      console.log(`✓ ${questionCount} questions auto-deleted via CASCADE`);
      
    } catch (error) {
      console.error('⚠️ Database deletion failed (test removed locally):', error);
      toast.warning(
        'Test removed locally',
        {
          id: deletingToast,
          description: 'Database sync failed, but data removed from this device'
        }
      );
      // Don't show error - already deleted from UI
    }
    
    // Close confirmation dialog
    setDeleteConfirmOpen(false);
    setTestToDelete(null);
  };
  
  // Handle delete button click (show confirmation)
  const handleDeleteClick = (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestToDelete(testId);
    setDeleteConfirmOpen(true);
  };
  
  // Confirm deletion
  const confirmDelete = () => {
    if (testToDelete) {
      deleteSavedTest(testToDelete);
    }
  };
  
  const handleStartTest = () => {
    if (questions.length === 0) {
      toast.error('No questions available');
      return;
    }
    
    setUserAnswers({});
    setTimeSpent(0);
    setCurrentScreen('test');
  };

  const handleSubmitTest = (answers: Record<number, string>, timeTaken: number) => {
    setUserAnswers(answers);
    setTimeSpent(timeTaken);
    setCurrentScreen('results');
  };

  const handleRetakeTest = () => {
    setUserAnswers({});
    setTimeSpent(0);
    setCurrentScreen('instructions');
  };

  const handleGoHome = () => {
    setCurrentScreen('setup');
    setQuestions([]);
    setUserAnswers({});
  };

  // Show Instructions Screen
  if (currentScreen === 'instructions') {
    const testTitle = testName.trim() || generateSmartTestName(selectedTopics);
    
    return (
      <TestInstructionsScreen
        testTitle={testTitle}
        duration={testDuration}
        totalQuestions={questions.length}
        totalMarks={questions.length * 2}
        marksPerQuestion={2}
        negativeMarking={0.66}
        onStartTest={handleStartTest}
        onGoBack={handleGoHome}
      />
    );
  }

  // Show Test Interface
  if (currentScreen === 'test') {
    const testTitle = testName.trim() || generateSmartTestName(selectedTopics);
    
    return (
      <MockTestInterface
        questions={questions}
        testTitle={testTitle}
        duration={testDuration}
        onSubmitTest={handleSubmitTest}
        onExitTest={handleGoHome}
      />
    );
  }

  // Show Results Screen
  if (currentScreen === 'results') {
    const testTitle = testName.trim() || generateSmartTestName(selectedTopics);
    
    return (
      <TestResultsScreen
        questions={questions}
        userAnswers={userAnswers}
        timeSpent={timeSpent}
        testTitle={testTitle}
        totalMarks={questions.length * 2}
        marksPerQuestion={2}
        negativeMarking={0.66}
        onRetakeTest={handleRetakeTest}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Mock Tests</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">Practice with AI-generated tests tailored to your needs</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="space-y-4">
          <div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
              <Card className="relative rounded-2xl bg-white dark:bg-black/40 border-2 border-gray-200 dark:border-slate-800/50 shadow-md hover:shadow-xl dark:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-black dark:text-white" />
                    Topic-wise Practice Test
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Focus on specific topics to strengthen your knowledge</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Select Material</label>
                      <Select value={selectedMaterial} onValueChange={setSelectedMaterial} disabled={loading}>
                        <SelectTrigger className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 hover:border-violet-400 dark:hover:border-violet-600 transition-colors">
                          <SelectValue placeholder={loading ? "Loading..." : materials.length === 0 ? "No materials uploaded" : "Choose material"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700">
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {material.file_url?.split('/').pop()?.substring(0, 30) || 'Unnamed'}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Syllabus Selection - Middle (Always visible) */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                        📋 Select Syllabus (Optional)
                      </label>
                      <Select value={selectedSyllabus} onValueChange={setSelectedSyllabus} disabled={loading}>
                        <SelectTrigger className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-violet-300 dark:border-violet-700 text-gray-900 dark:text-gray-200">
                          <SelectValue placeholder={
                            loading ? "Loading..." : 
                            syllabusMaterials.length === 0 ? "No syllabus uploaded" : 
                            "Choose syllabus to load topics"
                          } />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700">
                          {syllabusMaterials.length > 0 ? (
                            syllabusMaterials.map((syllabus) => (
                              <SelectItem key={syllabus.id} value={syllabus.id}>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-violet-600" />
                                  {syllabus.file_url?.split('/').pop()?.substring(0, 40) || 'Unnamed Syllabus'}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              <div className="text-gray-500 text-sm">Upload a syllabus first</div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedSyllabus && syllabusTopics.length > 0 && (
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                          ✓ {syllabusTopics.length} topics loaded
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Exam Type</label>
                      <Input
                        placeholder="Type exam (e.g., NEET, JEE, UPSC)..."
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
                      />
                    </div>

                    <div className="space-y-2 col-span-full">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                          Topics
                          {syllabusTopics.length > 0 && selectedTopics.length === syllabusTopics.length && (
                            <span className="ml-2 text-xs text-violet-600 dark:text-violet-400 font-normal">
                              (All {syllabusTopics.length} topics selected)
                            </span>
                          )}
                        </label>
                        {syllabusTopics.length > 0 && (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTopics(syllabusTopics)}
                              className="text-xs"
                            >
                              Full Syllabus
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTopics([])}
                              className="text-xs"
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>
                      {syllabusTopics.length > 0 ? (
                        <div className="border-2 border-violet-200 dark:border-violet-700 rounded-lg p-4 bg-white dark:bg-slate-800/50 max-h-[300px] overflow-y-auto space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {syllabusTopics.map((topic, index) => (
                              <label
                                key={index}
                                className="flex items-start gap-2 p-2 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTopics.includes(topic)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTopics([...selectedTopics, topic]);
                                    } else {
                                      setSelectedTopics(selectedTopics.filter(t => t !== topic));
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                              </label>
                            ))}
                          </div>
                          {selectedTopics.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-700">
                              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                                ✓ {selectedTopics.includes('Full Syllabus') ? 'Full Syllabus selected' : `${selectedTopics.length} topic(s) selected`}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder="Topic (auto-loaded from material)"
                          value={selectedTopics[0] || ''}
                          onChange={(e) => setSelectedTopics([e.target.value])}
                          className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
                        />
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {syllabusTopics.length > 0 ? 'Select one or more topics from syllabus' : 'Auto-loaded from material. Edit if needed.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                      Test Name <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    <Input
                      placeholder="e.g., Biology Chapter 1-3 Test, Physics Mechanics Mock"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {testName.trim() 
                        ? 'Custom name will be used' 
                        : `AI will generate: "${generateSmartTestName(selectedTopics)}"`
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Number of Questions</label>
                      <Input
                        type="text"
                        value={questionInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty or only numbers
                          if (val === '' || /^\d+$/.test(val)) {
                            setQuestionInput(val);
                            const num = parseInt(val);
                            if (!isNaN(num)) {
                              setQuestionCount(Math.min(50, Math.max(5, num)));
                            }
                          }
                        }}
                        onBlur={() => {
                          // On blur, ensure valid value
                          if (questionInput === '' || parseInt(questionInput) < 5) {
                            setQuestionInput('5');
                            setQuestionCount(5);
                          } else if (parseInt(questionInput) > 50) {
                            setQuestionInput('50');
                            setQuestionCount(50);
                          }
                        }}
                        className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Min: 5, Max: 50 questions</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Test Duration (minutes)</label>
                      <Input
                        type="text"
                        value={durationInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty or only numbers
                          if (val === '' || /^\d+$/.test(val)) {
                            setDurationInput(val);
                            const num = parseInt(val);
                            if (!isNaN(num)) {
                              setTestDuration(Math.min(180, Math.max(10, num)));
                            }
                          }
                        }}
                        onBlur={() => {
                          // On blur, ensure valid value
                          if (durationInput === '' || parseInt(durationInput) < 10) {
                            setDurationInput('10');
                            setTestDuration(10);
                          } else if (parseInt(durationInput) > 180) {
                            setDurationInput('180');
                            setTestDuration(180);
                          }
                        }}
                        className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Min: 10, Max: 180 minutes</p>
                    </div>
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-600/10 p-4 rounded-xl border-2 border-violet-200 dark:border-violet-500/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-black dark:text-white mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white font-semibold">Test Details</p>
                        <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                          • {questionCount} Questions<br />
                          • {testDuration} Minutes Duration<br />
                          • AI-Generated from your uploaded materials
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateTest}
                    disabled={!selectedMaterial || !selectedExam || selectedTopics.length === 0 || generatingQuestions}
                    className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 font-bold"
                  >
                    {generatingQuestions ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate & Start Test
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Saved Tests Section */}
      {savedTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-2xl bg-white dark:bg-black/40 border-2 border-gray-200 dark:border-slate-800/50 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-black dark:text-white" />
                    Recent Tests
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click on any test to start</p>
                </div>
                {/* Sync Status Indicator */}
                <div className="flex items-center gap-2">
                  {syncStatus === 'synced' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-600/30 border border-emerald-300 dark:border-emerald-700 rounded-full">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Synced</span>
                    </div>
                  )}
                  {syncStatus === 'syncing' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-full">
                      <Loader2 className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Syncing...</span>
                    </div>
                  )}
                  {syncStatus === 'offline' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Offline</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTests.map((test) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative group cursor-pointer"
                    onClick={() => loadSavedTest(test)}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#86EFAC] to-[#6EE7B7] rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                    <div className="relative p-4 bg-white dark:bg-slate-900 rounded-xl border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                            {test.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(test.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteClick(test.id, e)}
                          className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 transition-colors"
                          title="Delete test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-violet-400 to-purple-500 text-white rounded-md font-semibold shadow-lg">
                            <Brain className="h-3 w-3" />
                            {test.exam_type}
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-md font-medium">
                            {test.questions.length} Qs
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{test.duration} mins</span>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">
                            Topic: {test.topic}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Test?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              {testToDelete && (
                <>
                  This will permanently delete the test <span className="font-semibold text-gray-900 dark:text-white">"{savedTests.find(t => t.id === testToDelete)?.name}"</span> and all <span className="font-semibold text-gray-900 dark:text-white">{savedTests.find(t => t.id === testToDelete)?.questions.length || 0} questions</span> from both your local storage and database.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-gray-300 dark:border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white border-2 border-red-600"
            >
              Delete Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
