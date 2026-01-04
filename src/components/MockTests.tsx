import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, Brain, Zap, Loader2, FileText, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { TestInstructionsScreen } from './TestInstructionsScreen';
import { MockTestInterface } from './MockTestInterface';
import { TestResultsScreen } from './TestResultsScreen';
import { ScheduleTestModal } from './ScheduleTestModal';

interface Question {
  id?: string;
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
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(25);
  const [testDuration, setTestDuration] = useState(30);
  const [positiveMarking, setPositiveMarking] = useState(2);
  const [negativeMarking, setNegativeMarking] = useState(0.66);
  const [questionInput, setQuestionInput] = useState('25');
  const [durationInput, setDurationInput] = useState('30');
  const [positiveMarkingInput, setPositiveMarkingInput] = useState('2');
  const [negativeMarkingInput, setNegativeMarkingInput] = useState('0.66');
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableExamTypes, setAvailableExamTypes] = useState<string[]>([]);
  const [syllabusMaterials, setSyllabusMaterials] = useState<Material[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [syllabusTopics, setSyllabusTopics] = useState<string[]>([]);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [testName, setTestName] = useState('');
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
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
      }
    }
    fetchUserAndMaterials();
  }, []);
  
  // Check for loaded test from Test History page
  useEffect(() => {
    const loadedTest = sessionStorage.getItem('loadTest');
    if (loadedTest) {
      try {
        const test = JSON.parse(loadedTest);
        setQuestions(test.questions || []);
        setSelectedExam(test.exam_type || '');
        setSelectedTopics(test.topic ? test.topic.split(', ') : []);
        setTestDuration(test.duration || 30);
        setTestName(test.name || '');
        sessionStorage.removeItem('loadTest');
        toast.success(`Loaded test: ${test.name}`);
        // Show instructions screen
        setCurrentScreen('instructions');
      } catch (error) {
        console.error('Error loading test from session:', error);
        sessionStorage.removeItem('loadTest');
      }
    }
  }, []);
  
  // Auto-load topics when materials are selected (combine topics from all selected materials)
  useEffect(() => {
    if (selectedMaterials.length > 0) {
      const topics = new Set<string>();
      selectedMaterials.forEach(materialId => {
        const material = materials.find(m => m.id === materialId);
        if (material?.topic) {
          topics.add(material.topic);
        }
      });
      if (topics.size > 0) {
        setSelectedTopics(Array.from(topics));
        console.log('✓ Auto-loaded topics from selected materials:', Array.from(topics));
      }
    }
  }, [selectedMaterials, materials]);
  
  // Word dictionary for fixing PDF extraction issues
  const WORD_DICTIONARY = new Set([
    // Common English words
    'the', 'of', 'and', 'in', 'to', 'for', 'with', 'by', 'on', 'at', 'from', 'as', 'is', 'are',
    'a', 'an', 'or', 'not', 'but', 'be', 'can', 'has', 'have', 'had', 'do', 'does', 'did', 'will',
    'this', 'that', 'these', 'those', 'their', 'its', 'using', 'between', 'into', 'through', 'during',
    
    // Physics terms
    'physics', 'measurement', 'motion', 'force', 'forces', 'energy', 'work', 'power', 'momentum',
    'rotational', 'gravitation', 'gravity', 'properties', 'matter', 'thermodynamics', 'kinetic',
    'theory', 'gases', 'oscillations', 'waves', 'electrostatics', 'current', 'electricity',
    'magnetic', 'magnetism', 'electromagnetic', 'induction', 'alternating', 'optics', 'ray',
    'wave', 'dual', 'nature', 'radiation', 'atoms', 'nuclei', 'electronic', 'devices',
    'semiconductor', 'communication', 'systems', 'units', 'dimensions', 'kinematics', 'dynamics',
    'conservation', 'collision', 'elasticity', 'surface', 'tension', 'viscosity', 'fluid',
    'thermal', 'expansion', 'calorimetry', 'heat', 'transfer', 'specific', 'capacity', 'latent',
    'laws', 'entropy', 'simple', 'harmonic', 'pendulum', 'resonance', 'sound', 'doppler', 'effect',
    'superposition', 'standing', 'beats', 'electric', 'field', 'potential', 'capacitance',
    'dielectrics', 'resistance', 'ohms', 'law', 'cells', 'kirchhoffs', 'wheatstone', 'bridge',
    'potentiometer', 'biot', 'savart', 'amperes', 'circuital', 'solenoid', 'toroid', 'faradays',
    'reflection', 'refraction', 'total', 'internal', 'mirrors', 'lenses', 'magnification',
    'microscope', 'telescope', 'interference', 'diffraction', 'polarization', 'photoelectric',
    'integral', 'derivative', 'anti', 'conservative', 'non', 'parallel', 'carrying', 'conductors',
    'centre', 'mass', 'two', 'three', 'particle', 'vernier', 'calipers', 'screw', 'gauge',
    'external', 'diameter', 'meter', 'temperature', 'room', 'speed', 'air', 'dissipation',
    'plotting', 'acceleration', 'due', 'coefficient', 'restitution', 'measuring', 'liquid',
    'capillary', 'rise', 'focal', 'length', 'angle', 'incidence', 'deviation',
    
    // Chemistry terms
    'chemistry', 'chemical', 'atomic', 'structure', 'periodic', 'table', 'classification',
    'bonding', 'molecular', 'states', 'equilibrium', 'ionic', 'solutions', 'redox', 'reactions',
    'electrochemistry', 'concentration', 'dilute', 'electrochemical', 'different', 'methods',
    
    // Biology terms  
    'biology', 'living', 'world', 'plant', 'kingdom', 'animal', 'cell', 'unit', 'biomolecules',
    'division', 'transport', 'plants', 'mineral', 'nutrition', 'photosynthesis', 'respiration',
    
    // Common scientific words
    'given', 'method', 'principle', 'characteristics', 'determination', 'experiment', 'practical',
    'study', 'verification', 'identification', 'collection', 'mixed', 'resistor', 'LED', 'plot',
    'graph', 'curve', 'curves', 'finding', 'reverse', 'breakdown', 'zener', 'carbon'
  ]);

  // Fix broken words (words incorrectly split like "Integr al" → "Integral")
  const fixBrokenWords = (text: string): string => {
    if (!text) return text;
    
    const parts = text.split(/\s+/);
    const fixedParts: string[] = [];
    
    let i = 0;
    while (i < parts.length) {
      let merged = false;
      for (let j = 1; j <= 3 && i + j < parts.length; j++) {
        const candidateParts = parts.slice(i, i + j + 1);
        const candidate = candidateParts.join('').toLowerCase();
        
        if (WORD_DICTIONARY.has(candidate)) {
          const firstPart = parts[i];
          const isUpperCase = firstPart === firstPart.toUpperCase() && firstPart.length > 1;
          const isCapitalized = firstPart[0] === firstPart[0].toUpperCase();
          
          if (isUpperCase) {
            fixedParts.push(candidate.toUpperCase());
          } else if (isCapitalized) {
            fixedParts.push(candidate.charAt(0).toUpperCase() + candidate.slice(1));
          } else {
            fixedParts.push(candidate);
          }
          i += j + 1;
          merged = true;
          break;
        }
      }
      
      if (!merged) {
        fixedParts.push(parts[i]);
        i++;
      }
    }
    
    return fixedParts.join(' ');
  };
  
  // Fix concatenated words (stuck together like "Specificheat" → "Specific heat")
  const fixConcatenatedWords = (text: string): string => {
    if (!text || text.length < 10) return text;
    
    const spaceCount = (text.match(/\s/g) || []).length;
    const wordEstimate = text.length / 6;
    if (spaceCount > wordEstimate * 0.5) return text;
    
    let result = text;
    result = result.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    const sortedWords = Array.from(WORD_DICTIONARY).sort((a, b) => b.length - a.length);
    for (const word of sortedWords) {
      if (word.length < 3) continue;
      const pattern = new RegExp(`([a-zA-Z])(?=${word})`, 'gi');
      result = result.replace(pattern, '$1 ');
    }
    
    return result.replace(/\s+/g, ' ').trim();
  };
  
  // Fix all PDF text issues
  const fixPDFTextIssues = (text: string): string => {
    if (!text || text.length < 3) return text;
    let result = fixBrokenWords(text);
    result = fixConcatenatedWords(result);
    return result;
  };
  
  // Extract topics when syllabus is selected
  useEffect(() => {
    if (selectedSyllabus) {
      const syllabus = syllabusMaterials.find(m => m.id === selectedSyllabus);
      if (syllabus) {
        const structuredContent = (syllabus as any).structured_content;
        if (structuredContent?.syllabus_data?.topics) {
          // Filter out invalid topics (empty, too short, or containing junk text)
          const rawTopics = structuredContent.syllabus_data.topics;
          const invalidPatterns = [
            /^the\s+(detailed|same|above|following)/i,
            /^(has|have)\s+been/i,
            /uploaded|website|nmc|notification/i,
            /www\.|http|@|\.com/i,
          ];
          
          const topics = rawTopics
            .filter((t: string) => {
              if (!t || typeof t !== 'string') return false;
              const trimmed = t.trim();
              // Must be between 3-150 chars and have letters
              if (trimmed.length < 3 || trimmed.length > 150) return false;
              if (!/[a-zA-Z]/.test(trimmed)) return false;
              // Must not match invalid patterns
              for (const pattern of invalidPatterns) {
                if (pattern.test(trimmed)) return false;
              }
              return true;
            })
            .map((t: string) => fixPDFTextIssues(t.trim())); // Fix broken and concatenated words
          
          setSyllabusTopics(topics);
          console.log('✓ Extracted', topics.length, 'valid topics from syllabus (filtered from', rawTopics.length, ')');
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
    if (selectedMaterials.length === 0 || !selectedExam || selectedTopics.length === 0) {
      toast.error('Please select at least one material, exam type, and at least one topic');
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
          materialIds: selectedMaterials,
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
    setCurrentTestId(testId); // Store test ID in state
    
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
    
    // 2. Sync to database (background, non-blocking)
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
      
      // Save questions to test_questions table and get back the IDs
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
        negative_marks: negativeMarking
      }));
      
      const { data: insertedQuestions, error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert)
        .select('id, question_number');
      
      if (questionsError) throw questionsError;
      
      // Update the questions array with IDs from the database
      if (insertedQuestions && insertedQuestions.length === generatedQuestions.length) {
        insertedQuestions.forEach((dbQuestion) => {
          const index = dbQuestion.question_number - 1;
          if (generatedQuestions[index]) {
            generatedQuestions[index].id = dbQuestion.id;
          }
        });
      }
      
      console.log('✓ Test saved to database:', testId);
      
    } catch (error) {
      console.error('⚠️ Database save failed (data safe in localStorage):', error);
      // Don't show error to user - localStorage has the data
      // Silently log for debugging
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

  const handleSubmitTest = async (answers: Record<number, string>, timeTaken: number) => {
    setUserAnswers(answers);
    setTimeSpent(timeTaken);
    setCurrentScreen('results');

    // Save test results to database for analytics
    if (userId && questions.length > 0 && currentTestId) {
      try {
        // Calculate topic-wise performance
        const topicStats: Record<string, { correct: number; total: number }> = {};
        
        questions.forEach((q, index) => {
          const topic = q.topic || 'General';
          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0 };
          }
          topicStats[topic].total++;
          
          const userAnswer = answers[index];
          if (userAnswer) {
            const userAnswerLetter = userAnswer.charAt(0).toUpperCase();
            if (userAnswerLetter === q.correctAnswer.toUpperCase()) {
              topicStats[topic].correct++;
            }
          }
        });

        const topicWisePerformance = Object.entries(topicStats).map(([topic, stats]) => ({
          topic,
          correct: stats.correct,
          total: stats.total,
          percentage: Math.round((stats.correct / stats.total) * 100)
        }));

        // Identify strengths and weaknesses
        const strengths = topicWisePerformance
          .filter(t => t.percentage >= 70)
          .map(t => t.topic);
        const weaknesses = topicWisePerformance
          .filter(t => t.percentage < 70)
          .map(t => t.topic);

        // Calculate overall score
        let correctCount = 0;
        questions.forEach((q, index) => {
          const userAnswer = answers[index];
          if (userAnswer) {
            const userAnswerLetter = userAnswer.charAt(0).toUpperCase();
            if (userAnswerLetter === q.correctAnswer.toUpperCase()) {
              correctCount++;
            }
          }
        });

        const analytics = {
          topicWisePerformance,
          strengths,
          weaknesses,
          recommendations: weaknesses.length > 0 
            ? [`Focus on improving: ${weaknesses.join(', ')}`]
            : ['Great job! Keep practicing to maintain your performance.']
        };

        // Convert answers from index-based to ID-based for the API
        // Only include answered questions, skip empty/undefined answers
        const answersById: Record<string, string> = {};
        Object.entries(answers).forEach(([index, answer]) => {
          if (!answer) return; // Skip unanswered questions
          const questionIndex = parseInt(index);
          const question = questions[questionIndex];
          if (question && question.id) {
            answersById[question.id] = answer;
          }
        });
        
        console.log('Submitting test:', { 
          testId: currentTestId, 
          answeredCount: Object.keys(answersById).length,
          totalQuestions: questions.length,
          timeTaken 
        });

        // Save test results to test_results table via submit-test API
        const response = await fetch('/api/submit-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: currentTestId,
            answers: answersById,
            timeTaken: timeTaken
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Test results saved successfully:', data);
        } else {
          const errorData = await response.json();
          console.error('Failed to save test results:', errorData.error);
        }
      } catch (error) {
        console.error('Failed to save test results:', error);
        // Don't block the UI, just log the error
      }
    } else if (!currentTestId) {
      console.warn('Test ID not available, skipping database save. Results will still be shown.');
    }
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

  // Handle starting a weak topics test from adaptive practice
  const handleStartWeakTopicsTest = async (config: { topics: string[]; questionCount: number; difficulty: string }) => {
    setGeneratingQuestions(true);
    setSelectedTopics(config.topics);
    setQuestionCount(config.questionCount);
    
    // Generate test name
    const topicNames = config.topics.length > 2 
      ? `${config.topics.slice(0, 2).join(', ')} +${config.topics.length - 2} more`
      : config.topics.join(', ');
    setTestName(`Weak Topics Practice - ${topicNames}`);

    try {
      // Fetch user's materials
      const { data: userMaterials } = await supabase
        .from('study_materials')
        .select('id')
        .eq('user_id', userId)
        .eq('processing_status', 'completed');

      const materialIds = userMaterials?.map(m => m.id) || [];

      // Generate questions for weak topics
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          materialIds: materialIds.length > 0 ? materialIds : [],
          testConfig: {
            examType: selectedExam || 'NEET',
            topics: config.topics,
            questionCount: config.questionCount,
            difficulty: config.difficulty === 'mixed' ? 'medium' : config.difficulty,
            testName: `Weak Topics Practice - ${config.topics.slice(0, 2).join(', ')}${config.topics.length > 2 ? ` +${config.topics.length - 2} more` : ''}`
          }
        })
      });

      const data = await response.json();

      if (data.questions && data.questions.length > 0) {
        const generatedQuestions = data.questions;
        const duration = Math.ceil(config.questionCount * 1.5); // 1.5 min per question
        const finalTestName = `Weak Topics Practice - ${topicNames}`;
        
        setQuestions(generatedQuestions);
        setTestDuration(duration);
        setTestName(finalTestName);
        
        // Save weak topics test to database
        await saveWeakTopicsTest(generatedQuestions, finalTestName, config.topics, duration, config.difficulty);
        
        toast.success(`Generated ${generatedQuestions.length} questions for weak topics!`);
        setCurrentScreen('instructions');
      } else {
        toast.error('Failed to generate questions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating weak topics test:', error);
      toast.error('Error generating test. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Save weak topics test to database
  const saveWeakTopicsTest = async (
    generatedQuestions: Question[], 
    testTitle: string, 
    topics: string[], 
    duration: number,
    difficulty: string
  ) => {
    if (!userId) return;
    
    const testId = crypto.randomUUID();
    const topicString = topics.join(', ');
    const timestamp = new Date().toISOString();
    
    // Save to localStorage first (instant feedback)
    const newTest: SavedTest = {
      id: testId,
      name: testTitle,
      exam_type: selectedExam || 'NEET',
      topic: topicString,
      questions: generatedQuestions,
      duration: duration,
      created_at: timestamp
    };
    
    const savedTestsKey = `saved_tests_${userId}`;
    const existingTests = localStorage.getItem(savedTestsKey);
    const tests = existingTests ? JSON.parse(existingTests) : [];
    tests.unshift(newTest);
    
    if (tests.length > 50) {
      tests.length = 50;
    }
    
    localStorage.setItem(savedTestsKey, JSON.stringify(tests));
    
    // Sync to database (background, non-blocking)
    try {
      // Map exam type to valid ENUM value
      const validExamTypes = ['UPSC', 'Banking', 'SSC', 'NEET', 'JEE', 'CAT', 'GATE'];
      const examTypeForDB = validExamTypes.includes(selectedExam || '') ? selectedExam : 'Other';
      
      // Map difficulty to valid ENUM value
      const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        'easy': 'easy',
        'medium': 'medium',
        'hard': 'hard',
        'mixed': 'medium'
      };
      const difficultyForDB = difficultyMap[difficulty] || 'medium';
      
      // Save test metadata to mock_tests table
      const { error: testError } = await supabase
        .from('mock_tests')
        .insert({
          id: testId,
          user_id: userId,
          exam_type: examTypeForDB,
          topic: topicString,
          title: testTitle,
          description: `Weak topics practice test focusing on: ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? ` and ${topics.length - 3} more` : ''}`,
          is_ai_generated: true,
          test_type: 'custom', // Using 'custom' for weak topics (compatible with current schema)
          difficulty: difficultyForDB,
          total_questions: generatedQuestions.length,
          time_limit: duration * 60,
          status: 'draft'
        });
      
      if (testError) throw testError;
      
      // Save questions to test_questions table
      const questionsToInsert = generatedQuestions.map((q, index) => ({
        test_id: testId,
        question_number: index + 1,
        question_text: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        topic: q.topic,
        difficulty: (difficultyMap[q.difficulty] || difficultyForDB) as 'easy' | 'medium' | 'hard',
        explanation: q.explanation,
        marks: 2,
        negative_marks: negativeMarking
      }));
      
      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert);
      
      if (questionsError) throw questionsError;
      
      console.log('✓ Weak topics test saved to database:', testId);
      
    } catch (error) {
      console.error('⚠️ Database save failed for weak topics test (data safe in localStorage):', error);
    }
  };

  // Full-screen loading overlay for generating questions (renders on all screens)
  const GeneratingOverlay = () => generatingQuestions ? (
    <div className="fixed inset-0 bg-white/95 dark:bg-[#030213]/95 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm mx-4"
      >
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#030213] dark:border-t-purple-500 animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#030213] to-[#1a1a2e] dark:from-purple-600 dark:to-purple-800 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Generating Your Test
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          AI is crafting questions for your weak topics...
        </p>
      </motion.div>
    </div>
  ) : null;

  // Show Instructions Screen
  if (currentScreen === 'instructions') {
    const testTitle = testName.trim() || generateSmartTestName(selectedTopics);
    
    return (
      <>
        <TestInstructionsScreen
          testTitle={testTitle}
          duration={testDuration}
          totalQuestions={questions.length}
          totalMarks={questions.length * positiveMarking}
          marksPerQuestion={positiveMarking}
          negativeMarking={negativeMarking}
          onStartTest={handleStartTest}
          onGoBack={handleGoHome}
          onScheduleTest={currentTestId ? () => setShowScheduleModal(true) : undefined}
        />
        {showScheduleModal && currentTestId && (
          <ScheduleTestModal
            testId={currentTestId}
            testTitle={testTitle}
            onClose={() => setShowScheduleModal(false)}
          />
        )}
      </>
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
        positiveMarking={positiveMarking}
        negativeMarking={negativeMarking}
        onSubmitTest={handleSubmitTest}
        onExitTest={handleGoHome}
      />
    );
  }

  // Show Results Screen
  if (currentScreen === 'results') {
    const testTitle = testName.trim() || generateSmartTestName(selectedTopics);
    
    return (
      <>
        <GeneratingOverlay />
        <TestResultsScreen
          questions={questions}
          userAnswers={userAnswers}
          timeSpent={timeSpent}
          testTitle={testTitle}
          totalMarks={questions.length * positiveMarking}
          marksPerQuestion={positiveMarking}
          negativeMarking={negativeMarking}
          userId={userId || undefined}
          examType={selectedExam}
          onRetakeTest={handleRetakeTest}
          onGoHome={handleGoHome}
          onStartWeakTopicsTest={handleStartWeakTopicsTest}
        />
      </>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      {/* Full-screen loading overlay for generating questions */}
      <GeneratingOverlay />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Generate Test</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Create AI-powered tests tailored to your needs</p>
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
              <Card className="relative rounded-xl sm:rounded-2xl bg-white dark:bg-black/40 border-2 border-gray-200 dark:border-slate-800/50 shadow-md hover:shadow-xl dark:shadow-2xl transition-shadow duration-300">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-base sm:text-lg">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white" />
                    Topic-wise Practice Test
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Focus on specific topics to strengthen your knowledge</p>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Multi-Select Materials */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                        Select Materials
                        {selectedMaterials.length > 0 && (
                          <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full">
                            {selectedMaterials.length} selected
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <div className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-600 transition-colors max-h-[180px] overflow-y-auto">
                          {loading ? (
                            <div className="p-3 text-gray-500 text-sm">Loading...</div>
                          ) : materials.length === 0 ? (
                            <div className="p-3 text-gray-500 text-sm">No materials uploaded</div>
                          ) : (
                            <div className="p-2 space-y-1">
                              {/* Select All / Clear All */}
                              <div className="flex gap-2 pb-2 border-b border-gray-200 dark:border-slate-700 mb-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMaterials(materials.map(m => m.id))}
                                  className="text-xs text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-medium"
                                >
                                  Select All
                                </button>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMaterials([])}
                                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  Clear
                                </button>
                              </div>
                              {materials.map((material) => {
                                // Clean up the filename for display
                                const rawName = material.file_url?.split('/').pop() || 'Unnamed';
                                // Remove timestamp prefix (e.g., "1766263146288-") and file extension
                                const cleanName = rawName
                                  .replace(/^\d{13}-/, '') // Remove 13-digit timestamp prefix
                                  .replace(/\.(pdf|docx|doc)$/i, '') // Remove file extension
                                  .replace(/_/g, ' ') // Replace underscores with spaces
                                  .trim();
                                
                                return (
                                <label
                                  key={material.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                    selectedMaterials.includes(material.id)
                                      ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-300 dark:border-violet-700'
                                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-transparent'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedMaterials.includes(material.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMaterials([...selectedMaterials, material.id]);
                                      } else {
                                        setSelectedMaterials(selectedMaterials.filter(id => id !== material.id));
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                  />
                                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={cleanName}>
                                    {cleanName.length > 30 ? cleanName.substring(0, 30) + '...' : cleanName}
                                  </span>
                                </label>
                              )})}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Syllabus Selection - Middle (Always visible) */}
                    <div className="space-y-2">
                      <label htmlFor="syllabus-select" className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
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
                            syllabusMaterials.map((syllabus) => {
                              // Clean up syllabus filename for display
                              const rawName = syllabus.file_url?.split('/').pop() || 'Unnamed Syllabus';
                              const cleanName = rawName
                                .replace(/^\d{13}-/, '') // Remove timestamp prefix
                                .replace(/\.(pdf|docx|doc)$/i, '') // Remove extension
                                .replace(/_/g, ' '); // Replace underscores
                              
                              return (
                              <SelectItem key={syllabus.id} value={syllabus.id}>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-violet-600" />
                                  {cleanName.length > 40 ? cleanName.substring(0, 40) + '...' : cleanName}
                                </div>
                              </SelectItem>
                            )})
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
                      <label htmlFor="exam-type-input" className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Exam Type</label>
                      <Input
                        id="exam-type-input"
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
                          {/* Search bar for filtering topics */}
                          <div className="sticky top-0 bg-white dark:bg-slate-800/50 pb-3 mb-2 border-b border-violet-100 dark:border-violet-800">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Search topics..."
                                value={topicSearchQuery}
                                onChange={(e) => setTopicSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-sm rounded-lg bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 focus:border-violet-400 dark:focus:border-violet-500"
                              />
                              {topicSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setTopicSearchQuery('')}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            {topicSearchQuery && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Showing {syllabusTopics.filter(topic => 
                                  topic.toLowerCase().includes(topicSearchQuery.toLowerCase())
                                ).length} of {syllabusTopics.length} topics
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {syllabusTopics
                              .filter(topic => 
                                topic.toLowerCase().includes(topicSearchQuery.toLowerCase())
                              )
                              .map((topic, index) => (
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
                            {topicSearchQuery && syllabusTopics.filter(topic => 
                              topic.toLowerCase().includes(topicSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <p className="col-span-2 text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                No topics found matching &quot;{topicSearchQuery}&quot;
                              </p>
                            )}
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
                    <label htmlFor="test-name-input" className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                      Test Name <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    <Input
                      id="test-name-input"
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="question-count-input" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">Questions</label>
                      <Input
                        id="question-count-input"
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
                    
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="duration-input" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">Duration (min)</label>
                      <Input
                        id="duration-input"
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
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">10-180 min</p>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="positive-marking-input" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">+ve Marks</label>
                      <Input
                        id="positive-marking-input"
                        type="text"
                        value={positiveMarkingInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty, numbers, and decimal
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setPositiveMarkingInput(val);
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                              setPositiveMarking(Math.min(10, Math.max(1, num)));
                            }
                          }
                        }}
                        onBlur={() => {
                          // On blur, ensure valid value
                          const num = parseFloat(positiveMarkingInput);
                          if (isNaN(num) || num < 1) {
                            setPositiveMarkingInput('1');
                            setPositiveMarking(1);
                          } else if (num > 10) {
                            setPositiveMarkingInput('10');
                            setPositiveMarking(10);
                          } else {
                            setPositiveMarkingInput(num.toString());
                            setPositiveMarking(num);
                          }
                        }}
                        className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200"
                      />
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">1-10 marks</p>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="negative-marking-input" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">-ve Marks</label>
                      <Input
                        id="negative-marking-input"
                        type="text"
                        value={negativeMarkingInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty, numbers, and decimal
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setNegativeMarkingInput(val);
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                              setNegativeMarking(Math.min(2, Math.max(0, num)));
                            }
                          }
                        }}
                        onBlur={() => {
                          // On blur, ensure valid value
                          const num = parseFloat(negativeMarkingInput);
                          if (isNaN(num) || num < 0) {
                            setNegativeMarkingInput('0');
                            setNegativeMarking(0);
                          } else if (num > 2) {
                            setNegativeMarkingInput('2');
                            setNegativeMarking(2);
                          } else {
                            setNegativeMarkingInput(num.toString());
                            setNegativeMarking(num);
                          }
                        }}
                        className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200"
                      />
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">0-2 marks</p>
                    </div>
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-600/10 p-3 sm:p-4 rounded-xl border-2 border-violet-200 dark:border-violet-500/30">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-semibold">Test Details</p>
                        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-400 mt-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:block">
                          <span>• {questionCount} Questions</span>
                          <span className="sm:hidden">• {testDuration} min</span>
                          <span className="hidden sm:inline"><br />• {testDuration} Minutes Duration</span>
                          <span>• +{positiveMarking}/-{negativeMarking}</span>
                          <span className="col-span-2 sm:hidden">• AI-Generated</span>
                          <span className="hidden sm:inline"><br />• AI-Generated from {selectedMaterials.length > 0 ? `${selectedMaterials.length} material${selectedMaterials.length > 1 ? 's' : ''}` : 'materials'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateTest}
                    disabled={selectedMaterials.length === 0 || !selectedExam || selectedTopics.length === 0 || generatingQuestions}
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

    </div>
  );
}
