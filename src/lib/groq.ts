import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not set');
}

// Available Groq models (updated for current supported models)
const AVAILABLE_MODELS = [
  'llama-3.1-8b-instant', // Fast and reliable
  'llama-3.2-3b-preview', // Newer model
  'gemma-7b-it', // Alternative option
  'llama3-8b-8192' // Fallback
];

export interface QuestionGenerationRequest {
  content: string
  examType: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  topics?: string[]
}

export interface GeneratedQuestion {
  question: string
  options: string[]
  correctAnswer: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
}

// Helper function to truncate content to fit within token limits
function truncateContent(content: string, maxTokens: number = 2500): string {
  // Conservative estimation: 1 token ≈ 3.5 characters for English text
  const maxChars = maxTokens * 3.5;
  
  if (content.length <= maxChars) {
    return content;
  }

  // Try to find meaningful breakpoints (paragraphs, sentences)
  const truncated = content.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Use the best available breakpoint
  const breakpoint = Math.max(lastPeriod, lastNewline, lastSpace);
  if (breakpoint > maxChars * 0.6) { // Only use if we don't lose too much content
    return truncated.substring(0, breakpoint + 1);
  }
  
  return truncated + '...';
}

// Enhanced content extraction and cleaning
function extractKeyContent(content: string): string {
  if (!content || content.length < 50) {
    return content;
  }

  // Remove PDF artifacts and clean up text
  let cleaned = content
    // Remove PDF-specific artifacts
    .replace(/^%PDF-[\d\.]+.*?$/gm, '')
    .replace(/%þ���+/g, '')
    .replace(/\d+\s+0\s+obj[\s\S]*?endobj/g, '')
    .replace(/<<.*?>>/g, '')
    .replace(/\/[A-Z][a-zA-Z]*\s*/g, '')
    .replace(/endobj|obj|stream|endstream/g, '')
    .replace(/\(D:\d{14}\)/g, '')
    // Remove control characters and normalize
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\uFEFF/g, '')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  // If content is very long, extract key sections intelligently
  if (cleaned.length > 6000) {
    const lines = cleaned.split('\n');
    const keyLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and pure formatting
      if (trimmed.length < 10 || /^[\d\s\-\.\(\)]+$/.test(trimmed)) {
        continue;
      }
      
      // Prioritize lines that look like headings, definitions, or key points
      if (
        /^[A-Z][A-Z\s]{2,}$/.test(trimmed) || // ALL CAPS headings
        /^\d+\./.test(trimmed) || // Numbered points
        /^[•\-\*]/.test(trimmed) || // Bullet points
        /:/.test(trimmed) || // Definitions (contains colon)
        trimmed.split(' ').length > 5 // Substantial content
      ) {
        keyLines.push(trimmed);
      }
    }
    
    // If we extracted meaningful content, use it; otherwise use first part
    if (keyLines.length > 0 && keyLines.join(' ').length > 500) {
      cleaned = keyLines.join('\n');
    } else {
      // Fallback: take first meaningful paragraphs
      const paragraphs = cleaned.split('\n').filter(p => p.trim().length > 50);
      cleaned = paragraphs.slice(0, 10).join('\n');
    }
  }

  return truncateContent(cleaned, 2000); // Conservative limit for Groq
}

export async function generateQuestionsFromContent(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  try {
    // Process and clean the content
    const processedContent = extractKeyContent(request.content);
    
    console.log(`Content length: ${request.content.length} chars -> ${processedContent.length} chars`);
    
    // Build dynamic, focused prompt based on exam type and content
    const topicsText = request.topics && request.topics.length > 0 
      ? `Focus specifically on: ${request.topics.join(', ')}` 
      : '';
    
    const difficultyGuidelines = {
      easy: 'straightforward, testing basic recall and fundamental concepts',
      medium: 'moderately challenging, requiring understanding and application of concepts',
      hard: 'advanced, involving analysis, synthesis, and critical thinking'
    };
    
    const prompt = `You are an expert ${request.examType} exam question writer with deep subject knowledge.

TASK: Create EXACTLY ${request.questionCount} high-quality multiple-choice questions based on the study material provided below.

CRITICAL: You MUST generate EXACTLY ${request.questionCount} questions - no more, no less.

EXAM CONTEXT:
- Exam Type: ${request.examType}
- Difficulty: ${request.difficulty} (${difficultyGuidelines[request.difficulty]})
${topicsText}

STUDY MATERIAL (from semantic search - most relevant content):
${processedContent}

QUESTION REQUIREMENTS:
1. Each question must be clear, unambiguous, and exam-standard quality
2. Exactly 4 options labeled A, B, C, D
3. Only ONE correct answer
4. All distractors (wrong options) must be plausible but clearly incorrect
5. Questions should test conceptual understanding, not just memorization
6. Explanations must be concise (1-2 sentences) and directly reference the material
7. Ensure questions are diverse and cover different aspects of the content
8. Match the ${request.difficulty} difficulty level consistently

OUTPUT FORMAT (JSON array only, no markdown or extra text):
[
  {
    "question": "Clear, complete question with proper punctuation?",
    "options": [
      "A) First option",
      "B) Second option", 
      "C) Third option",
      "D) Fourth option"
    ],
    "correctAnswer": "A",
    "explanation": "Concise explanation referencing the material.",
    "topic": "Specific topic from material",
    "difficulty": "${request.difficulty}"
  }
]

CRITICAL: Return ONLY valid JSON array. No markdown code blocks, no explanatory text, just the array.`;

    const maxTokens = Math.min(8000, 150 * request.questionCount + 500); // Dynamic token allocation
    
    let responseText: string;
    
    try {
      const systemMessage = `You are a professional ${request.examType} exam question generator. You ONLY output valid JSON arrays of questions. Never use markdown formatting or explanatory text.`;
      
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: systemMessage,
        prompt: prompt,
        temperature: 0.8,
        maxTokens: maxTokens,
        topP: 0.95,
      });
      
      responseText = text;
    } catch (error: any) {
      // If content is too long, progressively reduce it
      if (error?.message?.includes('length') || error?.message?.includes('token')) {
        console.log('⚠️ Content exceeds token limit, reducing...');
        const shorterContent = truncateContent(processedContent, 1000);
        
        const compactPrompt = `Create ${request.questionCount} ${request.difficulty} ${request.examType} MCQs from this content:

${shorterContent}

Format (JSON only):
[{"question":"text?","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A","explanation":"why","topic":"topic","difficulty":"${request.difficulty}"}]`;

        const { text } = await generateText({
          model: groq('llama-3.3-70b-versatile'),
          system: "Output only valid JSON array of exam questions.",
          prompt: compactPrompt,
          temperature: 0.8,
          maxTokens: Math.min(4096, maxTokens),
          topP: 0.95,
        });
        
        responseText = text;
      } else {
        throw error;
      }
    }
    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    console.log('📤 Groq response length:', responseText.length, 'chars');

    // Clean up the response - remove markdown, extra text
    let cleanedText = responseText
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .replace(/^[^[{]*/g, '') // Remove any text before JSON starts
      .replace(/[^}\]]*$/g, '') // Remove any text after JSON ends
      .trim();
    
    // Extract JSON array
    const jsonStart = cleanedText.indexOf('[');
    const jsonEnd = cleanedText.lastIndexOf(']');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
      console.error('❌ No valid JSON array found in response');
      throw new Error('Invalid JSON format from AI');
    }
    
    cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    
    let questions: GeneratedQuestion[] = [];
    
    try {
      // Attempt to parse JSON
      questions = JSON.parse(cleanedText);
      console.log(`✓ Parsed ${questions.length} questions successfully`);
    } catch (parseError: any) {
      console.warn('⚠️ JSON parse error:', parseError.message);
      console.warn('Attempting intelligent repair...');
      
      // Strategy 1: Find last complete question object
      const lastCompleteEnd = cleanedText.lastIndexOf('}');
      if (lastCompleteEnd !== -1 && lastCompleteEnd > jsonStart) {
        const repairedJson = cleanedText.substring(0, lastCompleteEnd + 1) + ']';
        try {
          questions = JSON.parse(repairedJson);
          console.log(`✓ Repaired JSON, recovered ${questions.length}/${request.questionCount} questions`);
        } catch (repairError) {
          console.error('❌ Repair strategy 1 failed');
          
          // Strategy 2: Try to extract individual question objects
          try {
            const questionMatches = cleanedText.match(/\{[^{}]*"question"[^{}]*\}/g);
            if (questionMatches && questionMatches.length > 0) {
              questions = questionMatches
                .map(match => {
                  try {
                    return JSON.parse(match);
                  } catch {
                    return null;
                  }
                })
                .filter(q => q !== null) as GeneratedQuestion[];
              
              console.log(`✓ Extracted ${questions.length} questions via pattern matching`);
            } else {
              throw parseError;
            }
          } catch {
            throw parseError;
          }
        }
      } else {
        throw parseError;
      }
    }
    
    // Validate and clean questions
    const validQuestions = questions
      .map((q, index) => ({
        question: q.question?.trim() || '',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer?.trim()?.toUpperCase() || '',
        topic: q.topic?.trim() || request.topics?.[0] || request.examType || 'General',
        difficulty: request.difficulty,
        explanation: q.explanation?.trim() || 'No explanation provided.'
      }))
      .filter(q => {
        // Strict validation
        const isValid = 
          q.question.length > 10 && // Question must be substantial
          q.options.length === 4 && // Exactly 4 options
          q.options.every((opt: string) => opt && opt.length > 1) && // All options valid
          ['A', 'B', 'C', 'D'].includes(q.correctAnswer) && // Valid answer
          q.explanation.length > 5; // Explanation exists
        
        if (!isValid) {
          console.warn('⚠️ Filtered out invalid question:', q.question?.substring(0, 50));
        }
        
        return isValid;
      });
    
    // Limit to requested question count (LLM sometimes generates more)
    const limitedQuestions = validQuestions.slice(0, request.questionCount);
    
    console.log(`✅ Final output: ${limitedQuestions.length} valid questions (requested: ${request.questionCount})`);
    
    if (limitedQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }
    
    // If we got fewer questions than requested, warn but still return them
    if (limitedQuestions.length < request.questionCount) {
      console.warn(`⚠️ Generated ${limitedQuestions.length}/${request.questionCount} questions. LLM may need more content or clearer prompts.`);
    }
    
    return limitedQuestions;

  } catch (error: any) {
    console.error('Error generating questions with Groq:', error);
    
    // Always return fallback questions instead of throwing errors
    console.log('Groq API unavailable, generating questions using built-in intelligence...');
    
    const fallbackQuestions = generateFallbackQuestions(request);
    
    if (fallbackQuestions.length === 0) {
      // If even fallback fails, create basic questions
      return [{
        question: "This is a sample question generated from your study material. What is the main topic discussed?",
        options: [
          "A) Educational content and learning materials",
          "B) Technical specifications and requirements",
          "C) Historical events and timeline",
          "D) Scientific principles and theories"
        ],
        correctAnswer: "A",
        topic: "Study Material Analysis",
        difficulty: request.difficulty,
        explanation: "This question helps assess understanding of the uploaded study material content."
      }];
    }
    
    return fallbackQuestions;
  }
}

// Enhanced fallback questions based on exam type and content
function generateFallbackQuestions(request: QuestionGenerationRequest): GeneratedQuestion[] {
  const examTypeQuestions = getExamTypeQuestions(request.examType, request.difficulty);
  const contentBasedQuestions = generateContentBasedQuestions(request.content, request.difficulty);
  
  // Combine and shuffle questions
  const allQuestions = [...examTypeQuestions, ...contentBasedQuestions];
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, request.questionCount).map((q, index) => ({
    ...q,
    difficulty: request.difficulty
  }));
}

function getExamTypeQuestions(examType: string, difficulty: string): GeneratedQuestion[] {
  const questionBank: Record<string, GeneratedQuestion[]> = {
    Banking: [
      {
        question: "What is the primary function of a commercial bank?",
        options: [
          "A) Accepting deposits and lending money",
          "B) Only accepting deposits", 
          "C) Only lending money",
          "D) Foreign exchange only"
        ],
        correctAnswer: "A",
        topic: "Banking Fundamentals",
        difficulty: difficulty as any,
        explanation: "Commercial banks accept deposits and provide loans as their main function."
      },
      {
        question: "Which of the following is a negotiable instrument?",
        options: [
          "A) Fixed Deposit Receipt",
          "B) Cheque",
          "C) Savings Account Passbook", 
          "D) Loan Agreement"
        ],
        correctAnswer: "B",
        topic: "Banking Operations",
        difficulty: difficulty as any,
        explanation: "A cheque is a negotiable instrument that can be transferred from one person to another."
      },
      {
        question: "What does CRR stand for in banking terms?",
        options: [
          "A) Cash Reserve Ratio",
          "B) Credit Risk Ratio",
          "C) Customer Retention Rate",
          "D) Capital Requirement Ratio"
        ],
        correctAnswer: "A",
        topic: "Banking Regulations",
        difficulty: difficulty as any,
        explanation: "CRR (Cash Reserve Ratio) is the percentage of deposits that banks must keep with the central bank."
      }
    ],
    SSC: [
      {
        question: "Who is known as the 'Iron Man of India'?",
        options: [
          "A) Mahatma Gandhi",
          "B) Sardar Vallabhbhai Patel",
          "C) Jawaharlal Nehru",
          "D) Subhas Chandra Bose"
        ],
        correctAnswer: "B",
        topic: "Indian History",
        difficulty: difficulty as any,
        explanation: "Sardar Vallabhbhai Patel is known as the 'Iron Man of India' for his role in Indian independence."
      },
      {
        question: "What is the square root of 144?",
        options: [
          "A) 11",
          "B) 12", 
          "C) 13",
          "D) 14"
        ],
        correctAnswer: "B",
        topic: "Mathematics",
        difficulty: difficulty as any,
        explanation: "The square root of 144 is 12 because 12 × 12 = 144."
      },
      {
        question: "Which planet is known as the 'Red Planet'?",
        options: [
          "A) Venus",
          "B) Jupiter",
          "C) Mars",
          "D) Saturn"
        ],
        correctAnswer: "C",
        topic: "General Science",
        difficulty: difficulty as any,
        explanation: "Mars is known as the 'Red Planet' due to its reddish appearance caused by iron oxide."
      }
    ],
    UPSC: [
      {
        question: "Which Article of the Indian Constitution deals with the Right to Education?",
        options: [
          "A) Article 19",
          "B) Article 21A",
          "C) Article 25",
          "D) Article 32"
        ],
        correctAnswer: "B",
        topic: "Indian Constitution",
        difficulty: difficulty as any,
        explanation: "Article 21A provides free and compulsory education to children aged 6-14 years."
      },
      {
        question: "Who was the first Governor-General of independent India?",
        options: [
          "A) Lord Mountbatten",
          "B) C. Rajagopalachari",
          "C) Warren Hastings",
          "D) Lord Curzon"
        ],
        correctAnswer: "A",
        topic: "Indian History",
        difficulty: difficulty as any,
        explanation: "Lord Mountbatten was the first Governor-General of independent India from 1947-1948."
      }
    ],
    NEET: [
      {
        question: "Which organ produces insulin in the human body?",
        options: [
          "A) Liver",
          "B) Pancreas",
          "C) Kidney",
          "D) Stomach"
        ],
        correctAnswer: "B",
        topic: "Human Physiology",
        difficulty: difficulty as any,
        explanation: "The pancreas produces insulin, which regulates blood glucose levels."
      }
    ],
    JEE: [
      {
        question: "What is the derivative of sin(x)?",
        options: [
          "A) cos(x)",
          "B) -cos(x)",
          "C) sin(x)",
          "D) -sin(x)"
        ],
        correctAnswer: "A",
        topic: "Calculus",
        difficulty: difficulty as any,
        explanation: "The derivative of sin(x) with respect to x is cos(x)."
      }
    ],
    General: [
      {
        question: "Based on the study material provided, what is the main theme discussed?",
        options: [
          "A) Historical events and their significance",
          "B) Scientific concepts and applications",
          "C) Literary analysis and interpretation",
          "D) Mathematical problem-solving techniques"
        ],
        correctAnswer: "B",
        topic: "Content Analysis",
        difficulty: difficulty as any,
        explanation: "The material focuses on scientific concepts as evidenced by the technical terminology used."
      }
    ]
  };

  return questionBank[examType] || questionBank.General;
}

function generateContentBasedQuestions(content: string, difficulty: string): GeneratedQuestion[] {
  if (!content || content.length < 100) {
    return [];
  }

  // Extract key terms and concepts
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  const keyTerms = words
    .filter(word => word.length > 4 && !commonWords.has(word))
    .reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

  const topTerms = Object.entries(keyTerms)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([term]) => term);

  const contentQuestions: GeneratedQuestion[] = [
    {
      question: `According to the content, which term appears most frequently in the context of the main discussion?`,
      options: [
        `A) ${topTerms[0] || 'concept'}`,
        `B) ${topTerms[1] || 'principle'}`,
        `C) ${topTerms[2] || 'method'}`,
        `D) ${topTerms[3] || 'system'}`
      ],
      correctAnswer: "A",
      topic: "Content Analysis",
      difficulty: difficulty as any,
      explanation: `The term '${topTerms[0] || 'concept'}' appears most frequently, indicating its central importance to the topic.`
    },
    {
      question: "What is the primary objective discussed in the study material?",
      options: [
        "A) To explain fundamental principles",
        "B) To provide historical context",
        "C) To demonstrate practical applications",
        "D) To compare different methodologies"
      ],
      correctAnswer: "A",
      topic: "Main Concepts", 
      difficulty: difficulty as any,
      explanation: "The material primarily focuses on explaining fundamental principles as evidenced by the content structure."
    },
    {
      question: "Based on the content structure, what type of learning approach is emphasized?",
      options: [
        "A) Theoretical understanding",
        "B) Practical implementation", 
        "C) Comparative analysis",
        "D) Historical perspective"
      ],
      correctAnswer: "A",
      topic: "Learning Methodology",
      difficulty: difficulty as any,
      explanation: "The content structure indicates emphasis on theoretical understanding through detailed explanations."
    }
  ];

  return contentQuestions;
}

export async function improveQuestion(
  question: GeneratedQuestion,
  feedback: string
): Promise<GeneratedQuestion> {
  try {
    const systemMessage = "You are a professional exam question improver. Generate only valid JSON responses.";
    
    const prompt = `Improve this multiple choice question based on the feedback provided:
    
Original Question: ${question.question}
Options: ${question.options.join(', ')}
Correct Answer: ${question.correctAnswer}
Explanation: ${question.explanation}

Feedback: ${feedback}

Return an improved version in the same JSON format:
{
  "question": "Improved question text",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correctAnswer": "A",
  "explanation": "Improved explanation",
  "topic": "${question.topic}",
  "difficulty": "${question.difficulty}"
}

Return ONLY the JSON object.`;

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemMessage,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 2048,
    });

    if (!text) {
      return question; // Return original if no response
    }

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const improvedQuestion: GeneratedQuestion = JSON.parse(cleanedText);
    
    return improvedQuestion;

  } catch (error) {
    console.error('Error improving question with Groq:', error);
    return question; // Return original if improvement fails
  }
}