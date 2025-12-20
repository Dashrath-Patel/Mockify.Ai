import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsFromContent } from '@/lib/gemini';
import { isDevMode, getDevUser, logDevModeStatus } from '@/lib/dev-mode';

// Development-friendly question generation API that works without Supabase
export async function POST(request: NextRequest) {
  try {
    logDevModeStatus();
    
    if (!isDevMode()) {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      )
    }

    const body = await request.json()
    let { materials, testConfig } = body

    console.log('🔧 Processing question generation in development mode...')
    console.log('📋 Test Config:', testConfig)

    // Validate required fields
    if (!testConfig || !testConfig.examType || !testConfig.difficulty || !testConfig.questionCount) {
      return NextResponse.json(
        { error: 'Test configuration is required (examType, difficulty, questionCount)' },
        { status: 400 }
      )
    }

    // Process materials (if any)
    let combinedContent = ''
    
    if (materials && materials.length > 0) {
      console.log(`📚 Processing ${materials.length} materials...`)
      
      // In dev mode, materials might be passed directly with text
      combinedContent = materials
        .map((material: any) => material.extractedText || material.text || '')
        .filter((text: string) => text && text.length > 0)
        .join('\n\n--- NEXT DOCUMENT ---\n\n')
      
      console.log(`📄 Combined content: ${combinedContent.length} characters`)
    }

    // If no content or insufficient content, use default content for the exam type
    if (combinedContent.length < 100) {
      console.log('📝 Using fallback content for question generation')
      const examType = testConfig.examType || 'General'
      combinedContent = `This is a ${examType} examination covering fundamental concepts and principles. 
      The test includes topics relevant to ${examType} studies and practical applications. 
      Students should demonstrate understanding of key concepts, problem-solving abilities, and analytical skills.
      The examination format includes multiple choice questions testing various aspects of the subject matter.
      Questions range from basic conceptual understanding to applied problem solving scenarios.
      
      Key topics include:
      - Fundamental principles and concepts
      - Practical applications and real-world scenarios
      - Problem-solving techniques and methodologies
      - Critical thinking and analytical skills
      - Current trends and best practices in the field`
    }

    console.log('🤖 Generating questions with Gemini AI...')

    // Generate questions using Gemini AI
    let questions;
    try {
      questions = await generateQuestionsFromContent({
        content: combinedContent,
        examType: testConfig.examType || 'General',
        difficulty: testConfig.difficulty || 'medium',
        questionCount: parseInt(testConfig.questionCount) || 10,
        topics: testConfig.topics
      });

      console.log(`✅ Generated ${questions.length} questions successfully`)

    } catch (error: any) {
      console.error('❌ Error generating questions with Gemini:', error);
      
      return NextResponse.json(
        { 
          error: 'AI question generation failed',
          details: error?.message || 'Gemini API error',
          devMode: true,
          fallback: 'You can still test with mock questions'
        },
        { status: 503 }
      )
    }

    // Create mock test record for development
    const mockTest = {
      id: `dev-test-${Date.now()}`,
      title: `${testConfig.examType} Mock Test`,
      description: `Generated ${questions.length} questions for ${testConfig.examType} exam`,
      config: testConfig,
      status: 'completed',
      totalQuestions: questions.length,
      timeLimit: testConfig.timeLimit || 30,
      createdAt: new Date().toISOString(),
      user: getDevUser()
    }

    return NextResponse.json({
      success: true,
      message: 'Questions generated successfully in development mode',
      test: mockTest,
      questions: questions,
      devMode: true,
      metadata: {
        exam_type: testConfig.examType,
        difficulty: testConfig.difficulty,
        question_count: questions.length,
        generated_at: new Date().toISOString(),
        materials_used: materials?.length || 0,
        content_length: combinedContent.length,
        ai_model: 'gemini-1.5-flash'
      }
    })

  } catch (error: any) {
    console.error('❌ Error in development question generation API:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        devMode: true
      },
      { status: 500 }
    )
  }
}