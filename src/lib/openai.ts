import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

export async function generateQuestionsFromContent(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  try {
    const prompt = `
    You are an expert question generator for ${request.examType} examinations.
    
    Based on the following study material, generate ${request.questionCount} multiple-choice questions with difficulty level: ${request.difficulty}.
    
    Study Material:
    ${request.content}
    
    Requirements:
    - Each question should have 4 options (A, B, C, D)
    - Only one correct answer per question
    - Include a brief explanation for each answer
    - Vary the topics covered
    - Make questions challenging but fair
    - Focus on conceptual understanding and application
    
    Return the response as a JSON array with the following structure:
    [
      {
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "A",
        "topic": "Topic name",
        "difficulty": "${request.difficulty}",
        "explanation": "Brief explanation of why this is correct"
      }
    ]
    
    Ensure the JSON is valid and properly formatted.
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator specializing in generating high-quality examination questions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const questions = JSON.parse(content) as GeneratedQuestion[]
    
    // Validate the response structure
    if (!Array.isArray(questions)) {
      throw new Error('Invalid response format')
    }

    return questions

  } catch (error) {
    console.error('Error generating questions:', error)
    throw new Error('Failed to generate questions from content')
  }
}

export async function generateFeedback(
  answers: Record<string, string>,
  correctAnswers: Record<string, string>,
  topics: Record<string, string>
): Promise<string> {
  try {
    const totalQuestions = Object.keys(correctAnswers).length
    const correctCount = Object.entries(answers).filter(
      ([questionId, answer]) => answer === correctAnswers[questionId]
    ).length

    const score = (correctCount / totalQuestions) * 100

    // Identify weak areas
    const weakTopics = Object.entries(answers)
      .filter(([questionId, answer]) => answer !== correctAnswers[questionId])
      .map(([questionId]) => topics[questionId])
      .filter((topic, index, array) => array.indexOf(topic) === index)

    const prompt = `
    Generate personalized feedback for a student who scored ${score.toFixed(1)}% (${correctCount}/${totalQuestions}) on their mock test.
    
    Weak areas identified: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None'}
    
    Provide:
    1. Overall performance assessment
    2. Specific areas for improvement
    3. Study recommendations
    4. Motivation and next steps
    
    Keep it encouraging but constructive, around 150-200 words.
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive educational mentor providing constructive feedback to help students improve.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    })

    return response.choices[0].message.content || 'Keep practicing and you\'ll improve!'

  } catch (error) {
    console.error('Error generating feedback:', error)
    return 'Great effort on completing the test! Keep practicing to improve your performance.'
  }
}

export default openai