export interface TestResult {
  score: number
  totalQuestions: number
  timeTaken: number
  analytics: TestAnalytics
}

export interface TestAnalytics {
  topicWisePerformance: TopicPerformance[]
  difficultyWisePerformance: DifficultyPerformance
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export interface TopicPerformance {
  topic: string
  correct: number
  total: number
  percentage: number
}

export interface DifficultyPerformance {
  easy: { correct: number; total: number; percentage: number }
  medium: { correct: number; total: number; percentage: number }
  hard: { correct: number; total: number; percentage: number }
}

export interface Question {
  id: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  correctAnswer: string
}

export function calculateScore(
  userAnswers: Record<string, string>,
  questions: Question[]
): TestResult {
  const totalQuestions = questions.length
  let correctAnswers = 0

  // Calculate basic score
  questions.forEach(question => {
    const userAnswer = userAnswers[question.id];
    if (userAnswer) {
      // Normalize both answers to just the letter (A, B, C, D)
      const userAnswerLetter = userAnswer.trim().charAt(0).toUpperCase();
      const correctAnswerLetter = question.correctAnswer.trim().charAt(0).toUpperCase();
      
      if (userAnswerLetter === correctAnswerLetter) {
        correctAnswers++
      }
    }
  })

  const score = Math.round((correctAnswers / totalQuestions) * 100)

  // Calculate topic-wise performance
  const topicStats: Record<string, { correct: number; total: number }> = {}
  
  questions.forEach(question => {
    const topic = question.topic
    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 }
    }
    topicStats[topic].total++
    if (userAnswers[question.id] === question.correctAnswer) {
      topicStats[topic].correct++
    }
  })

  const topicWisePerformance: TopicPerformance[] = Object.entries(topicStats).map(
    ([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
      percentage: (stats.correct / stats.total) * 100
    })
  )

  // Calculate difficulty-wise performance
  const difficultyStats = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 }
  }

  questions.forEach(question => {
    const difficulty = question.difficulty
    difficultyStats[difficulty].total++
    if (userAnswers[question.id] === question.correctAnswer) {
      difficultyStats[difficulty].correct++
    }
  })

  const difficultyWisePerformance: DifficultyPerformance = {
    easy: {
      ...difficultyStats.easy,
      percentage: difficultyStats.easy.total > 0 
        ? (difficultyStats.easy.correct / difficultyStats.easy.total) * 100 
        : 0
    },
    medium: {
      ...difficultyStats.medium,
      percentage: difficultyStats.medium.total > 0 
        ? (difficultyStats.medium.correct / difficultyStats.medium.total) * 100 
        : 0
    },
    hard: {
      ...difficultyStats.hard,
      percentage: difficultyStats.hard.total > 0 
        ? (difficultyStats.hard.correct / difficultyStats.hard.total) * 100 
        : 0
    }
  }

  // Identify strengths and weaknesses
  const strengths: string[] = []
  const weaknesses: string[] = []

  topicWisePerformance.forEach(topic => {
    if (topic.percentage >= 80) {
      strengths.push(topic.topic)
    } else if (topic.percentage < 60) {
      weaknesses.push(topic.topic)
    }
  })

  // Generate recommendations
  const recommendations = generateRecommendations(
    score,
    topicWisePerformance,
    difficultyWisePerformance
  )

  return {
    score,
    totalQuestions,
    timeTaken: 0, // Will be set by calling function
    analytics: {
      topicWisePerformance,
      difficultyWisePerformance,
      strengths,
      weaknesses,
      recommendations
    }
  }
}

function generateRecommendations(
  score: number,
  topicPerformance: TopicPerformance[],
  difficultyPerformance: DifficultyPerformance
): string[] {
  const recommendations: string[] = []

  // Overall performance recommendations
  if (score >= 90) {
    recommendations.push("Excellent performance! Continue with advanced practice tests.")
  } else if (score >= 75) {
    recommendations.push("Good job! Focus on weak areas for improvement.")
  } else if (score >= 60) {
    recommendations.push("Average performance. Increase study time and focus on fundamentals.")
  } else {
    recommendations.push("Needs improvement. Review basic concepts thoroughly.")
  }

  // Topic-specific recommendations
  const weakTopics = topicPerformance
    .filter(topic => topic.percentage < 60)
    .map(topic => topic.topic)

  if (weakTopics.length > 0) {
    recommendations.push(`Focus more on: ${weakTopics.join(', ')}`)
  }

  // Difficulty-specific recommendations
  if (difficultyPerformance.easy.percentage < 80) {
    recommendations.push("Review fundamental concepts for easy questions.")
  }
  if (difficultyPerformance.medium.percentage < 60) {
    recommendations.push("Practice more medium-difficulty problems.")
  }
  if (difficultyPerformance.hard.percentage < 40) {
    recommendations.push("Work on advanced problem-solving techniques.")
  }

  return recommendations
}

export function getPerformanceLevel(score: number): {
  level: string
  color: string
  description: string
} {
  if (score >= 90) {
    return {
      level: 'Excellent',
      color: 'green',
      description: 'Outstanding performance! You have mastered this topic.'
    }
  } else if (score >= 75) {
    return {
      level: 'Good',
      color: 'blue',
      description: 'Good understanding. Minor improvements needed.'
    }
  } else if (score >= 60) {
    return {
      level: 'Average',
      color: 'yellow',
      description: 'Fair performance. More practice required.'
    }
  } else if (score >= 40) {
    return {
      level: 'Below Average',
      color: 'orange',
      description: 'Needs significant improvement. Focus on fundamentals.'
    }
  } else {
    return {
      level: 'Poor',
      color: 'red',
      description: 'Requires extensive study. Start with basic concepts.'
    }
  }
}

export function calculateTimeEfficiency(
  timeTaken: number,
  totalQuestions: number,
  timeLimit: number
): {
  efficiency: number
  averageTimePerQuestion: number
  timeRemaining: number
} {
  const averageTimePerQuestion = timeTaken / totalQuestions
  const efficiency = ((timeLimit - timeTaken) / timeLimit) * 100
  const timeRemaining = timeLimit - timeTaken

  return {
    efficiency: Math.max(0, efficiency),
    averageTimePerQuestion,
    timeRemaining
  }
}