import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { calculateScore } from '@/lib/scoring'

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

    // Validate required fields - answers can be empty object if all questions skipped
    if (!testId || answers === undefined || answers === null || typeof timeTaken !== 'number') {
      return NextResponse.json(
        { error: 'Test ID, answers, and time taken are required' },
        { status: 400 }
      )
    }

    // Ensure answers is an object (can be empty)
    const validAnswers = typeof answers === 'object' ? answers : {};

    // Fetch test and questions
    const { data: test, error: testError } = await supabase
      .from('mock_tests')
      .select(`
        *,
        test_questions (
          id,
          question_text,
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
    const questions = test.test_questions.map((q: any) => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      correctAnswer: q.correct_answer
    }))

    // Calculate score and analytics
    const result = calculateScore(validAnswers, questions)
    result.timeTaken = timeTaken

    console.log('Score calculation:', { 
      resultScore: result.score, 
      totalQuestions: result.totalQuestions,
      answersCount: Object.keys(validAnswers).length 
    });

    const correctAnswers: Record<string, string> = {}
    questions.forEach((q: any) => {
      correctAnswers[q.id] = q.correctAnswer
    })

    // Calculate correct answers by comparing with normalized answers (just letter)
    const correctCount = Object.entries(validAnswers).filter(([questionId, userAnswer]) => {
      const correctAnswer = correctAnswers[questionId];
      // Extract just the letter from user's answer (e.g., "A) Some text" -> "A")
      const userAnswerStr = String(userAnswer || '');
      const userAnswerLetter = userAnswerStr.trim().charAt(0).toUpperCase();
      const correctAnswerLetter = correctAnswer?.trim().charAt(0).toUpperCase();
      console.log('Comparing:', { questionId, userAnswerLetter, correctAnswerLetter, match: userAnswerLetter === correctAnswerLetter });
      return userAnswerLetter === correctAnswerLetter;
    }).length;

    console.log('Correct answers count:', correctCount);

    // Save result to database
    const { data: resultRecord, error: resultError } = await supabase
      .from('test_results')
      .insert({
        test_id: testId,
        user_id: user.id,
        score: result.score,
        total_questions: result.totalQuestions,
        correct_answers: correctCount,
        time_spent: timeTaken,
        answers: validAnswers
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

    // Update test status to completed after successful result save
    const { error: statusUpdateError } = await supabase
      .from('mock_tests')
      .update({ status: 'completed' })
      .eq('id', testId)
      .eq('user_id', user.id)

    if (statusUpdateError) {
      console.error('Error updating test status:', statusUpdateError)
      // Don't fail the request, result was saved successfully
    }

    // Prepare detailed response
    const detailedResults = {
      resultId: resultRecord.id,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: Object.entries(validAnswers).filter(
        ([questionId, answer]) => answer === correctAnswers[questionId]
      ).length,
      timeTaken: timeTaken,
      questions: test.test_questions.map((q: any) => ({
        id: q.id,
        question: q.question_text,
        options: q.options,
        correctAnswer: q.correct_answer,
        userAnswer: validAnswers[q.id] || null,
        isCorrect: validAnswers[q.id] === q.correct_answer,
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