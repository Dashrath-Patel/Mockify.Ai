/**
 * Adaptive Question Generation Agent
 * Analyzes student performance and generates personalized practice questions
 * Focuses on weak topics and adjusts difficulty based on performance
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
export interface TopicPerformance {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
  lastAttempted: Date;
}

export interface WeakTopic {
  topic: string;
  score: number;
  questionsAttempted: number;
  priority: 'high' | 'medium' | 'low';
  suggestedDifficulty: 'easy' | 'medium' | 'hard';
}

export interface AdaptiveQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  focusArea: string;
}

export interface PracticeSession {
  userId: string;
  weakTopics: WeakTopic[];
  questions: AdaptiveQuestion[];
  generatedAt: Date;
}

/**
 * Analyze user's test history to find weak topics
 */
export async function analyzeWeakTopics(userId: string): Promise<WeakTopic[]> {
  try {
    // Fetch user's recent practice sessions (saved test results)
    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select('topic_results, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10); // Last 10 tests

    if (error || !sessions || sessions.length === 0) {
      console.log('No test results found for analysis');
      return [];
    }

    // Aggregate topic performance across all tests
    const topicStats: Record<string, {
      correct: number;
      total: number;
      lastAttempted: Date;
    }> = {};

    sessions.forEach(session => {
      const topicResults = session.topic_results;
      if (!topicResults?.topicWisePerformance) return;

      topicResults.topicWisePerformance.forEach((perf: TopicPerformance) => {
        if (!topicStats[perf.topic]) {
          topicStats[perf.topic] = {
            correct: 0,
            total: 0,
            lastAttempted: new Date(session.created_at)
          };
        }
        topicStats[perf.topic].correct += perf.correct;
        topicStats[perf.topic].total += perf.total;
        // Update last attempted if more recent
        const sessionDate = new Date(session.created_at);
        if (sessionDate > topicStats[perf.topic].lastAttempted) {
          topicStats[perf.topic].lastAttempted = sessionDate;
        }
      });
    });

    // Convert to WeakTopic array and identify weak areas
    const weakTopics: WeakTopic[] = [];

    Object.entries(topicStats).forEach(([topic, stats]) => {
      const score = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      
      // Consider topics below 70% as weak
      if (score < 70) {
        let priority: 'high' | 'medium' | 'low';
        let suggestedDifficulty: 'easy' | 'medium' | 'hard';

        // Determine priority based on score
        if (score < 40) {
          priority = 'high';
          suggestedDifficulty = 'easy'; // Start easy for very weak topics
        } else if (score < 60) {
          priority = 'medium';
          suggestedDifficulty = 'medium';
        } else {
          priority = 'low';
          suggestedDifficulty = 'medium'; // Push slightly harder
        }

        weakTopics.push({
          topic,
          score: Math.round(score),
          questionsAttempted: stats.total,
          priority,
          suggestedDifficulty
        });
      }
    });

    // Sort by priority (high first) then by score (lowest first)
    weakTopics.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.score - b.score;
    });

    return weakTopics;
  } catch (error) {
    console.error('Error analyzing weak topics:', error);
    return [];
  }
}

/**
 * Get relevant content from user's study materials for a topic
 */
async function getTopicContent(
  userId: string,
  topic: string
): Promise<string> {
  try {
    const { data: materials, error } = await supabase
      .from('study_materials')
      .select('extracted_text, topic')
      .eq('user_id', userId)
      .eq('processing_status', 'completed')
      .not('extracted_text', 'is', null)
      .limit(3);

    if (error || !materials || materials.length === 0) {
      return '';
    }

    // Combine relevant content
    const content = materials
      .map(m => m.extracted_text?.substring(0, 1000) || '')
      .filter(t => t.length > 0)
      .join('\n\n');

    return content.substring(0, 3000); // Limit total content
  } catch (error) {
    console.error('Error fetching topic content:', error);
    return '';
  }
}

/**
 * Generate adaptive practice questions for weak topics
 */
export async function generateAdaptiveQuestions(
  userId: string,
  weakTopics: WeakTopic[],
  questionCount: number = 5,
  examType: string = 'NEET'
): Promise<AdaptiveQuestion[]> {
  try {
    // Take top 3 weak topics for focused practice
    const targetTopics = weakTopics.slice(0, 3);
    
    if (targetTopics.length === 0) {
      console.log('No weak topics to generate questions for');
      return [];
    }

    // Get study material content for context
    const materialContent = await getTopicContent(userId, targetTopics[0].topic);

    // Build the prompt
    const topicsInfo = targetTopics.map(t => 
      `- ${t.topic}: Score ${t.score}%, Priority ${t.priority}, Suggested difficulty: ${t.suggestedDifficulty}`
    ).join('\n');

    const prompt = `You are an expert ${examType} exam question generator. Generate ${questionCount} practice questions focused on the student's weak topics.

**WEAK TOPICS TO FOCUS ON:**
${topicsInfo}

**INSTRUCTIONS:**
1. Generate questions that help the student improve on these weak areas
2. Distribute questions across the weak topics (prioritize high-priority topics)
3. Match difficulty level suggested for each topic
4. Include clear explanations that teach the concept
5. For topics with very low scores (< 40%), start with foundational concepts
6. For topics with medium scores (40-60%), test application of concepts
7. For topics with higher scores (> 60%), include slightly challenging questions

${materialContent ? `**RELEVANT STUDY MATERIAL:**\n${materialContent}\n` : ''}

**OUTPUT FORMAT (strict JSON):**
Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Clear question text",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A) Option 1",
    "topic": "Topic Name",
    "difficulty": "easy|medium|hard",
    "explanation": "Why this answer is correct and key concept to remember",
    "focusArea": "Specific concept or sub-topic being tested"
  }
]

Generate exactly ${questionCount} questions. Return ONLY the JSON array, no other text.`;

    // Try multiple models
    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let response;
    let lastError;

    for (const modelName of models) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 3000,
          }
        });
        break;
      } catch (err: any) {
        lastError = err;
        console.log(`Model ${modelName} failed, trying next...`);
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }

    // Parse the response
    const text = response.text || '';
    
    // Extract JSON from response
    let jsonText = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const questions: AdaptiveQuestion[] = JSON.parse(jsonText);

    // Validate and clean questions
    return questions.filter(q => 
      q.question && 
      q.options?.length === 4 && 
      q.correctAnswer && 
      q.topic
    ).map(q => ({
      ...q,
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation || 'Practice this concept thoroughly.',
      focusArea: q.focusArea || q.topic
    }));

  } catch (error) {
    console.error('Error generating adaptive questions:', error);
    throw error;
  }
}

/**
 * Save practice session results
 */
export async function savePracticeSession(
  userId: string,
  questions: AdaptiveQuestion[],
  answers: Record<number, string>,
  weakTopics: WeakTopic[]
): Promise<{ score: number; improvement: Record<string, number> }> {
  try {
    // Calculate score
    let correct = 0;
    const topicResults: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === q.correctAnswer;
      
      if (isCorrect) correct++;

      if (!topicResults[q.topic]) {
        topicResults[q.topic] = { correct: 0, total: 0 };
      }
      topicResults[q.topic].total++;
      if (isCorrect) topicResults[q.topic].correct++;
    });

    const score = Math.round((correct / questions.length) * 100);

    // Calculate improvement potential
    const improvement: Record<string, number> = {};
    Object.entries(topicResults).forEach(([topic, stats]) => {
      const newScore = (stats.correct / stats.total) * 100;
      const oldTopic = weakTopics.find(w => w.topic === topic);
      if (oldTopic) {
        improvement[topic] = Math.round(newScore - oldTopic.score);
      }
    });

    // Save to database
    await supabase.from('practice_sessions').insert({
      user_id: userId,
      weak_topics: weakTopics,
      questions_count: questions.length,
      score: score,
      topic_results: topicResults,
      created_at: new Date().toISOString()
    });

    return { score, improvement };
  } catch (error) {
    console.error('Error saving practice session:', error);
    return { score: 0, improvement: {} };
  }
}

/**
 * Main function: Generate personalized practice set
 */
export async function createAdaptivePracticeSet(
  userId: string,
  questionCount: number = 5,
  examType: string = 'NEET'
): Promise<PracticeSession | null> {
  try {
    // Step 1: Analyze weak topics
    const weakTopics = await analyzeWeakTopics(userId);

    if (weakTopics.length === 0) {
      console.log('No weak topics found - student is performing well!');
      return null;
    }

    console.log(`Found ${weakTopics.length} weak topics:`, weakTopics.map(t => t.topic));

    // Step 2: Generate adaptive questions
    const questions = await generateAdaptiveQuestions(
      userId,
      weakTopics,
      questionCount,
      examType
    );

    if (questions.length === 0) {
      throw new Error('Failed to generate questions');
    }

    // Step 3: Return practice session
    return {
      userId,
      weakTopics,
      questions,
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error creating adaptive practice set:', error);
    throw error;
  }
}
