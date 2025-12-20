# AI Tutor - Real-Time Doubt Resolution Agent

## 🎯 Overview

The AI Tutor feature provides instant, personalized explanations for test questions using agentic AI. Students can ask doubts directly on test results, and receive contextualized answers that reference their own study materials.

## ✨ Key Features

### 1. **Instant Doubt Resolution**
- Ask questions about any test question
- Get explanations in 2-3 seconds
- Works on correct, incorrect, and skipped questions

### 2. **RAG-Powered Context**
- Searches student's uploaded study materials
- References specific pages/sections in explanations
- Provides material citations for deeper study

### 3. **Smart Explanations**
- Step-by-step breakdown
- Common misconception analysis
- Memory tips and tricks
- Emoji-enhanced engagement

### 4. **Confidence Scoring**
- **High**: Based on student's materials
- **Medium**: Partial material match
- **Low**: General explanation

### 5. **Feedback Loop**
- 👍/👎 feedback system
- Tracks helpfulness for improvement
- Saves doubt history for analytics

## 🏗️ Architecture

```
Student asks doubt
    ↓
API Route (/api/doubt-resolver)
    ↓
Doubt Resolver Agent
    ↓
┌────────────────────────────────┐
│ 1. Retrieve Relevant Materials │ ← Semantic Search (Embeddings)
│ 2. Generate Context            │ ← Supabase Vector Search
│ 3. Call Gemini AI             │ ← gemini-2.0-flash
│ 4. Format Response             │ ← Structured Output
└────────────────────────────────┘
    ↓
Return explanation + references
    ↓
Display in AITutorChat component
```

## 📂 Files Created

### Backend
- **`src/lib/agents/doubt-resolver-agent.ts`** - Core agent logic
- **`src/app/api/doubt-resolver/route.ts`** - API endpoint
- **`backend/database/add-doubt-history-table.sql`** - Database schema

### Frontend
- **`src/components/AITutorChat.tsx`** - Chat UI component
- **`src/components/TestResultsScreen.tsx`** - Updated with AI Tutor button

## 🚀 Setup Instructions

### 1. Database Setup

Run the SQL migration in Supabase dashboard:

```bash
# In Supabase SQL Editor, run:
backend/database/add-doubt-history-table.sql
```

This creates the `doubt_history` table with RLS policies.

### 2. Environment Variables

Already configured in `.env.local`:
```bash
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### 3. Install Dependencies

All required packages are already installed:
- `@google/genai` - Gemini AI
- `@supabase/supabase-js` - Database
- Existing UI components

### 4. Deploy & Test

```bash
npm run dev
# Visit http://localhost:3000
# Take a test → See results → Click "Ask AI Tutor"
```

## 💡 Usage Example

**Student Flow:**

1. Completes mock test
2. Views results screen
3. Sees incorrect answer on Question 5
4. Clicks **"Ask AI Tutor"** button
5. Types: *"Why is option C correct? I thought B was right."*
6. Gets instant AI explanation with material references
7. Gives 👍 feedback if helpful

**AI Response Example:**

```
Great question! You chose B, but here's why C is correct:

📚 From your uploaded notes (Physics-Ch3.pdf, Page 45):
"Newton's Third Law states equal and opposite forces..."

🎯 Step-by-step:
1. Force on object A = 10N (given)
2. Reaction force = -10N (Third Law)
3. Therefore, option C is correct

💡 Common mistake: Students forget reaction forces 
act on different objects!

💡 Tip: Remember F₁₂ = -F₂₁ (forces are equal but opposite)
```

## 🔧 API Reference

### POST /api/doubt-resolver

**Request:**
```typescript
{
  questionText: string;      // Full question text
  options: string[];         // Array of options
  correctAnswer: string;     // Correct answer (e.g., "A")
  userAnswer: string;        // User's answer
  doubtText: string;        // Student's doubt
  topic?: string;           // Optional topic
  questionIndex?: number;   // Optional question number
}
```

**Response:**
```typescript
{
  success: true;
  explanation: string;      // AI-generated explanation
  materialReferences: [     // Relevant study materials
    {
      content: string;
      source: string;
      relevanceScore: number;
    }
  ];
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}
```

**Rate Limit:** 5 requests per minute per user

## 📊 Analytics Tracked

The `doubt_history` table stores:
- Question text
- Doubt text
- User feedback (helpful/not helpful)
- Timestamp

**Use this data for:**
- Identifying common confusions
- Improving explanations
- Detecting knowledge gaps
- Content recommendations

## 🎨 UI Components

### AITutorChat Component

**Props:**
```typescript
interface AITutorChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  topic?: string;
  questionIndex?: number;
}
```

**Features:**
- Responsive dialog
- Quick doubt suggestions
- Material reference cards
- Feedback buttons
- "Ask Another Doubt" flow

## 🔐 Security

1. **Authentication**: Checks `auth.uid()` for user session
2. **RLS Policies**: Row-level security on `doubt_history`
3. **Rate Limiting**: 5 requests/minute
4. **Input Validation**: Validates all request fields

## 🚀 Future Enhancements

### Phase 2 Features:
1. **Voice Input** - Speak your doubt
2. **Follow-up Questions** - Multi-turn conversations
3. **Similar Questions** - "You also struggled with..."
4. **Video Explanations** - YouTube links for concepts
5. **Hindi Support** - Bilingual explanations
6. **Doubt Trends** - Weekly doubt summary report

### Advanced Analytics:
```sql
-- Find most confusing topics
SELECT 
  question_text, 
  COUNT(*) as doubt_count
FROM doubt_history
GROUP BY question_text
ORDER BY doubt_count DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Common Issues

**1. "Module not found: motion/react"**
```bash
npm install motion --legacy-peer-deps
```

**2. "Unauthorized error"**
- Check Supabase session
- Verify RLS policies
- Ensure user is logged in

**3. "Rate limit exceeded"**
- Wait 60 seconds
- Check `doubt_history` table for spam

**4. "No materials found" (Low confidence)**
- User needs to upload study materials
- Check embeddings are generated
- Verify `match_documents` RPC function exists

## 📈 Performance Metrics

**Target Benchmarks:**
- Response time: < 3 seconds
- Accuracy: > 85% helpful feedback
- Material matching: > 70% high confidence
- User engagement: > 30% adoption rate

## 🎓 Educational Impact

**Benefits for Students:**
- ✅ Instant clarification
- ✅ Personalized to their materials
- ✅ Available 24/7
- ✅ No judgment anxiety
- ✅ Reinforces concepts

**Benefits for ExamSensei:**
- 🚀 Unique differentiator
- 💎 Premium feature potential
- 📊 Rich learning analytics
- 🔁 Increased retention
- 💬 Viral sharing potential

## 📝 License

Part of ExamSensei - All Rights Reserved

---

**Built with ❤️ by ExamSensei Team**

*Empowering students with AI-powered learning*
