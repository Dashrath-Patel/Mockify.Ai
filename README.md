<p align="center">
  <h1 align="center">🎯 Mockify.AI</h1>
  <p align="center">
    <strong>AI-Powered Mock Test Generation Platform</strong>
  </p>
  <p align="center">
    Transform your study materials into personalized mock tests using cutting-edge AI technology
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## 🌟 Overview

Mockify.AI is an intelligent exam preparation platform that leverages **Retrieval-Augmented Generation (RAG)** and modern AI models to generate personalized mock tests from your study materials. Upload your PDFs, notes, or images, and let AI create comprehensive practice tests tailored to your exam needs.

## ✨ Features

### 📚 Smart Material Processing
- **Multi-format Support**: Upload PDFs, images, and text files
- **OCR Technology**: Extract text from scanned documents and images using Tesseract.js
- **Intelligent Chunking**: Documents split into semantic chunks for optimal context retrieval
- **Embedding Generation**: 768-dimensional vectors using HuggingFace sentence-transformers

### 🧠 AI Question Generation
- **RAG-Powered**: Questions generated from your actual study materials
- **Multiple LLM Support**: 
  - Groq (llama-3.3-70b-versatile) for fast generation
  - Google Gemini 2.0 Flash for explanations
- **Customizable Tests**: Choose difficulty, topic, and question count
- **Exam-Specific**: Support for NEET, UPSC, SSC, JEE, and more

### 🎮 Real-time Test Interface
- **Timed Sessions**: Simulate real exam conditions
- **Question Navigation**: Jump to any question, mark for review
- **Fullscreen Mode**: Distraction-free test environment
- **Negative Marking**: Configurable scoring like real exams
- **Auto-submit**: Automatic submission when time expires

### 🤖 AI Tutor (Doubt Resolution)
- **Instant Explanations**: Get step-by-step breakdowns in 2-3 seconds
- **Context-Aware**: References your own study materials
- **Confidence Scoring**: Know when AI is using your materials vs general knowledge
- **Feedback System**: Rate explanations to improve future responses

### 📊 Adaptive Learning
- **Weak Topic Analysis**: AI identifies your struggling areas
- **Priority-based Practice**: Focus on high-priority weak topics
- **Personalized Recommendations**: Adaptive question difficulty based on performance
- **Progress Tracking**: Visual charts and analytics

### 📈 Performance Analytics
- **Detailed Results**: Question-by-question analysis
- **Topic-wise Breakdown**: See performance across subjects
- **Historical Trends**: Track improvement over time
- **Study Calendar**: Visual progress tracking

### 🔍 Semantic Search
- **Vector-Based Search**: Find content by meaning, not just keywords
- **Material Discovery**: Search across all uploaded documents
- **Relevance Scoring**: Results ranked by semantic similarity

### 👥 Community Features
- **Discussion Forums**: Connect with fellow students
- **Topic-based Threads**: Subject-specific discussions
- **Peer Learning**: Share strategies and tips

### 📅 Test Scheduling
- **Schedule Future Tests**: Plan your practice sessions
- **Email Reminders**: Get notified before scheduled tests
- **Calendar Integration**: Visual test schedule

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.0 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 4.1.16 | Utility-first styling |
| **Framer Motion** | 12.23.24 | Animations |
| **Radix UI** | Latest | Accessible UI components |
| **Recharts** | 3.2.1 | Data visualization |
| **Lucide React** | 0.545.0 | Icons |

### Backend & AI
| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.75.0 | PostgreSQL + Auth + Storage |
| **Groq SDK** | 0.33.0 | Fast LLM inference |
| **Google GenAI** | 1.33.0 | Gemini AI models |
| **LangChain** | 1.1.1 | AI orchestration |
| **HuggingFace** | 4.13.4 | Embeddings |
| **Vercel AI SDK** | 5.0.106 | Streaming AI responses |

### Document Processing
| Technology | Purpose |
|------------|---------|
| **pdf-parse** | PDF text extraction |
| **Tesseract.js** | OCR for images |
| **Mammoth** | DOCX processing |
| **Sharp** | Image optimization |

### Database & Vector Search
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database (via Supabase) |
| **pgvector** | Vector similarity search |
| **Supabase RLS** | Row-level security |

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Groq API key
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Dashrath-Patel/Mockify.Ai.git
cd Mockify.Ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Add your API keys to `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Models
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional
HUGGINGFACE_API_KEY=your_hf_key
```

4. **Set up the database**

Run the SQL migrations in order:
```bash
# In Supabase SQL Editor, run:
backend/database/supabase-schema.sql
backend/database/enhanced-schema.sql
backend/database/add-embeddings.sql
backend/database/add-doubt-history-table.sql
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 16)                    │
├─────────────────────────────────────────────────────────────────┤
│  Pages: Dashboard | Upload | Test | Results | Community | Profile│
│  Components: MockTestInterface | AITutorChat | AdaptivePractice  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  /api/upload          - Material upload & processing             │
│  /api/generate-questions - RAG-based question generation         │
│  /api/doubt-resolver  - AI tutor explanations                    │
│  /api/search-materials - Semantic search                         │
│  /api/adaptive-practice - Weak topic analysis                    │
│  /api/schedule-test   - Test scheduling                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Groq LLM      │  │  Gemini AI      │  │  HuggingFace    │
│ (llama-3.3-70b) │  │ (gemini-2.0)    │  │  (embeddings)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                              │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL    │  pgvector    │  Storage    │  Auth             │
│  (data)        │  (embeddings)│  (files)    │  (users)          │
└─────────────────────────────────────────────────────────────────┘
```

### Question Generation Flow
```
1. User uploads PDF → Text extraction → Chunking (~1000 chars)
2. Each chunk → HuggingFace → 768-dim embedding → Supabase pgvector
3. User requests test → Query embedding → Cosine similarity search
4. Top 21 chunks → Context formatting → Groq LLM
5. LLM generates questions → Validation → Delivery to user
```

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── generate-questions/
│   │   │   ├── doubt-resolver/
│   │   │   ├── upload/
│   │   │   └── search-materials/
│   │   ├── dashboard/          # Main dashboard
│   │   ├── test/               # Test interface
│   │   ├── upload-materials/   # Material upload
│   │   └── community/          # Community forums
│   ├── components/             # React components
│   │   ├── ui/                 # Radix UI primitives
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── MockTestInterface.tsx
│   │   ├── AITutorChat.tsx
│   │   ├── AdaptivePractice.tsx
│   │   └── ...
│   └── lib/                    # Utilities & services
│       ├── agents/             # AI agents
│       ├── supabase.ts         # Supabase client
│       ├── groq.ts             # Groq client
│       └── embedding-service.ts
├── backend/
│   └── database/               # SQL migrations
├── docs/                       # Documentation
└── public/                     # Static assets
```

## 📡 API Reference

### Generate Questions
```http
POST /api/generate-questions
Content-Type: application/json
Authorization: Bearer <token>

{
  "materialId": "uuid",
  "examType": "NEET",
  "topic": "Physics",
  "questionCount": 10,
  "difficulty": "medium"
}
```

### Doubt Resolver
```http
POST /api/doubt-resolver
Content-Type: application/json

{
  "questionText": "What is Newton's first law?",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A",
  "userAnswer": "B",
  "doubtText": "Why is A correct?",
  "userId": "uuid"
}
```

### Search Materials
```http
POST /api/search-materials
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "photosynthesis process",
  "threshold": 0.4,
  "exam_type": "NEET"
}
```

## 🔧 Configuration

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `GROQ_API_KEY` | ✅ | Groq API key for LLM |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `HUGGINGFACE_API_KEY` | ⚪ | HuggingFace API (optional) |

### Next.js Configuration
- **Turbopack**: Enabled for faster development (`next dev --turbo`)
- **Image Optimization**: AVIF/WebP with modern formats
- **Package Optimization**: Tree-shaking for lucide-react, recharts, framer-motion

## 📊 Performance

| Metric | Value |
|--------|-------|
| Question Generation | 15-20 seconds |
| Doubt Resolution | 2-3 seconds |
| Semantic Search | <1 second |
| Build Size | Optimized with code splitting |
| Lighthouse Score | 90+ (Performance) |

## 🛡️ Security

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Supabase Auth with OAuth support
- **API Protection**: Service role key for server-side operations
- **Content Security Policy**: Configured headers for XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Groq](https://groq.com/) - Fast LLM Inference
- [Google Gemini](https://ai.google.dev/) - AI Models
- [Radix UI](https://www.radix-ui.com/) - Accessible Components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

<p align="center">
  Made with ❤️ by the Mockify.AI Team
</p>
