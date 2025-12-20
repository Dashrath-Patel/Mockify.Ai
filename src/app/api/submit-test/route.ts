import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { calculateScore } from '@/lib/scoring'
import { generateFeedback } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { testId, answers, timeTaken } = body

    // Validate required fields
    if (!testId || !answers || typeof timeTaken !== 'number') {
      return NextResponse.json(
        { error: 'Test ID, answers, and time taken are required' },
        { status: 400 }
      )
    }

    // Fetch test and questions
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select(`
        *,
        questions (
          id,
          question,
          options,
          correct_answer,
          topic,
          difficulty
        )
      `)
      .eq('id', testId)
      .eq('user_id', user.id)
      .single()

    if (testError || !test) {
      console.error('Error fetching test:', testError)
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    // Convert questions to the format expected by calculateScore
    const questions = test.questions.map((q: any) => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      correctAnswer: q.correct_answer
    }))

    // Calculate score and analytics
    const result = calculateScore(answers, questions)
    result.timeTaken = timeTaken

    // Create topic mapping for feedback
    const topics: Record<string, string> = {}
    questions.forEach((q: any) => {
      topics[q.id] = q.topic
    })

    const correctAnswers: Record<string, string> = {}
    questions.forEach((q: any) => {
      correctAnswers[q.id] = q.correctAnswer
    })

    // Generate AI feedback
    let feedback = ''
    try {
      feedback = await generateFeedback(answers, correctAnswers, topics)
    } catch (feedbackError) {
      console.error('Error generating feedback:', feedbackError)
      // Continue without feedback
    }

    // Save result to database
    const { data: resultRecord, error: resultError } = await supabase
      .from('results')
      .insert({
        test_id: testId,
        user_id: user.id,
        score: result.score,
        total_questions: result.totalQuestions,
        correct_answers: Object.entries(answers).filter(
          ([questionId, answer]) => answer === correctAnswers[questionId]
        ).length,
        time_taken: timeTaken,
        answers: answers,
        analytics: result.analytics,
        feedback: feedback
      })
      .select()
      .single()

    if (resultError) {
      console.error('Error saving result:', resultError)
      return NextResponse.json(
        { error: 'Failed to save test result' },
        { status: 500 }
      )
    }

    // Update test status to completed if this is the first attempt
    const { data: existingResults } = await supabase
      .from('results')
      .select('id')
      .eq('test_id', testId)
      .eq('user_id', user.id)

    if (existingResults && existingResults.length === 1) {
      await supabase
        .from('tests')
        .update({ status: 'completed' })
        .eq('id', testId)
    }

    // Prepare detailed response
    const detailedResults = {
      resultId: resultRecord.id,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: Object.entries(answers).filter(
        ([questionId, answer]) => answer === correctAnswers[questionId]
      ).length,
      timeTaken: timeTaken,
      analytics: result.analytics,
      feedback: feedback,
      questions: test.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        userAnswer: answers[q.id] || null,
        isCorrect: answers[q.id] === q.correct_answer,
        topic: q.topic,
        difficulty: q.difficulty
      }))
    }

    return NextResponse.json({
      success: true,
      result: detailedResults
    })

  } catch (error) {
    console.error('Error in submit test API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}