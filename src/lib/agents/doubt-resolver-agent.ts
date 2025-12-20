/**
 * Doubt Resolver Agent
 * Real-time AI tutor that helps students understand test questions
 * Uses RAG (Retrieval Augmented Generation) with user's study materials
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

interface DoubtRequest {
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  doubtText: string;
  userId: string;
  topic?: string;
}

interface MaterialContext {
  content: string;
  source: string;
  relevanceScore: number;
}

/**
 * Retrieve relevant context from user's study materials
 * Simplified version - gets recent materials without embeddings
 */
async function retrieveRelevantMaterials(
  userId: string,
  questionText: string,
  topic?: string
): Promise<MaterialContext[]> {
  try {
    // Get user's recent study materials
    const { data: materials, error } = await supabase
      .from('study_materials')
      .select('extracted_text, file_url, topic, structured_content')
      .eq('user_id', userId)
      .eq('processing_status', 'completed')
      .not('extracted_text', 'is', null)
      .limit(3)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching materials:', error);
      return [];
    }

    if (!materials || materials.length === 0) {
      console.log('No study materials found for user');
      return [];
    }

    // Format materials with source info
    return materials.map((material: any) => {
      // Extract filename from file_url
      const fileName = material.file_url?.split('/').pop() || 'Study Material';
      
      return {
        content: material.extracted_text?.substring(0, 500) || '',
        source: fileName,
        relevanceScore: 0.8 // Static for now
      };
    });
  } catch (error) {
    console.error('Error in retrieveRelevantMaterials:', error);
    return [];
  }
}



/**
 * Generate AI explanation using Gemini with context
 */
async function generateExplanation(
  request: DoubtRequest,
  materials: MaterialContext[]
): Promise<string> {
  // Build context from materials
  const materialContext = materials.length > 0
    ? materials.map((m, i) => 
        `\n📚 Reference ${i + 1} (${m.source}):\n${m.content}\n`
      ).join('\n')
    : 'No specific study material found for this topic.';

  const prompt = `You are an expert AI tutor helping a student understand a competitive exam question.

**IMPORTANT RULES:**
1. ONLY answer questions related to the exam question shown below
2. If the student asks about something UNRELATED to this question or topic, politely say: "That's outside the scope of this question. Let me help you understand this specific question better. What would you like to know about it?"
3. Do NOT discuss topics from other fields (like computer science for a biology question)
4. Stay focused on explaining the concept being tested in THIS question
5. Keep responses concise and focused (max 300 words)

**The Question:**
${request.questionText}

**Options:**
${request.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

**Correct Answer:** ${request.correctAnswer}
**Student's Answer:** ${request.userAnswer}
${request.topic ? `**Topic:** ${request.topic}` : ''}

**Student's Doubt:**
"${request.doubtText}"

**Relevant Study Material:**
${materialContext}

**How to respond:**
1. If the doubt is RELATED to the question: Explain clearly why the correct answer is right
2. If the student chose wrong: Briefly explain the misconception
3. Use simple language and bullet points
4. Add one 💡 tip at the end to remember this concept
5. Keep it short and helpful

If the student's doubt is NOT about this question's topic, politely redirect them.`;

  // Helper function for exponential backoff
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Try models in order: gemini-2.5-flash-lite (less overloaded), then fallbacks
    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let response;
    let lastError;

    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const modelName = models[modelIndex];
      
      // Retry each model up to 2 times with exponential backoff for rate limits
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            }
          });
          break; // Success - exit retry loop
        } catch (err: any) {
          lastError = err;
          
          // If rate limited (429), wait and retry same model
          if (err.status === 429 && attempt < 1) {
            const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s
            console.log(`Model ${modelName} rate limited, waiting ${delay}ms before retry...`);
            await sleep(delay);
            continue;
          }
          
          console.log(`Model ${modelName} failed (${err.status || err.code}), trying next...`);
          break; // Try next model
        }
      }
      
      if (response) break; // Success - exit model loop
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }
    
    return response.text || 'Unable to generate explanation. Please try again.';
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    
    // Provide helpful fallback message based on error
    if (error.status === 429) {
      throw new Error('API rate limit reached. Please try again in a moment.');
    }
    throw new Error('Failed to generate explanation. Please try again.');
  }
}

/**
 * Main function to resolve student's doubt
 */
export async function resolveDoubt(request: DoubtRequest): Promise<{
  explanation: string;
  materialReferences: MaterialContext[];
  confidence: 'high' | 'medium' | 'low';
}> {
  try {
    // Step 1: Retrieve relevant study materials
    const materials = await retrieveRelevantMaterials(
      request.userId,
      `${request.questionText} ${request.topic || ''}`,
      request.topic
    );

    // Step 2: Generate explanation with context
    const explanation = await generateExplanation(request, materials);

    // Step 3: Determine confidence based on material availability
    const confidence = materials.length >= 2 ? 'high' 
                    : materials.length === 1 ? 'medium' 
                    : 'low';

    return {
      explanation,
      materialReferences: materials,
      confidence
    };
  } catch (error) {
    console.error('Error in resolveDoubt:', error);
    throw error;
  }
}

/**
 * Save doubt interaction for analytics
 */
export async function saveDoubtInteraction(
  userId: string,
  questionText: string,
  doubtText: string,
  wasHelpful: boolean | null = null
): Promise<void> {
  try {
    await supabase.from('doubt_history').insert({
      user_id: userId,
      question_text: questionText,
      doubt_text: doubtText,
      was_helpful: wasHelpful,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving doubt interaction:', error);
    // Don't throw - this is not critical
  }
}
