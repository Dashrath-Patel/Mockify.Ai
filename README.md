# MockifyAI - AI-Powered Mock Test Platform

An intelligent mock test platform that transforms study materials into personalized practice tests using AI. Upload PDFs or DOCX files, and let AI generate relevant questions with detailed explanations.

## ✨ Key Features

- **🚀 Smart File Upload**: Drag & drop PDF/DOCX files with automatic text extraction
- **🧠 AI Question Generation**: Powered by Groq API (llama-3.1-8b-instant), Google Gemini, and OpenAI
- **📄 Advanced OCR**: DeepSeek OCR + Tesseract.js (90-97% accuracy on Hindi/English scans)
- **🎯 Custom Test Creation**: Choose exam type, difficulty level, and question count
- **📊 Progress Tracking**: Real-time analytics and performance insights
- **👥 Community Features**: Discussion forums and shared materials
- **🔐 Secure Authentication**: Supabase Auth with Google OAuth
- **💾 Cloud Storage**: Automatic file and progress sync via Supabase

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.4** - React 19 with App Router and Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS 4.1.16** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.23.24** - Smooth animations
- **Recharts 3.2.1** - Data visualization

### Backend & AI
- **Groq SDK 0.33.0** - Fast AI inference (llama-3.1-8b-instant)
- **Google Gemini** - Alternative AI model for question generation
- **OpenAI API 6.3.0** - Fallback AI service
- **Supabase 2.75.0** - PostgreSQL database + Authentication + Storage
- **pdf-parse 2.4.5** - Server-side PDF text extraction
- **mammoth 1.11.0** - DOCX document processing
- **DeepSeek OCR + Tesseract.js** - High-accuracy OCR (90-97% on Hindi scans)
- **Sharp** - Image preprocessing for OCR accuracy boost
- **HuggingFace Inference** - Free DeepSeek OCR API access

### Infrastructure
- **Supabase Auth** - User authentication with Google OAuth
- **Supabase Storage** - Secure file uploads organized by user
- **Row Level Security (RLS)** - Database-level access control
- **Next.js API Routes** - RESTful backend endpoints

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **Supabase account** - [Create one here](https://supabase.com)
- **Groq API key** - [Get free API key](https://console.groq.com/keys)
- **Google OAuth credentials** (optional) - For social login

### Installation

1. **Clone and install dependencies:**

```bash
git clone https://github.com/Dashrath-Patel/Mockify-AI.git
cd mockify-ai
npm install --legacy-peer-deps
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys (Server-side only - NEVER use NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key (optional)
OPENAI_API_KEY=your_openai_api_key (optional)

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Set up Supabase database:**

- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Run the schema files in `backend/database/` directory:
  - `supabase-schema.sql` - Core tables
  - `enhanced-schema.sql` - Additional features
  - `fix-storage-policies.sql` - Storage bucket setup

4. **Configure Supabase Storage:**

- Create a storage bucket named `study-materials`
- Set it to public or configure RLS policies
- Enable file uploads for authenticated users

5. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
npm run validate     # Run type-check + lint
```


## 🏗️ System Architecture

### Project Structure

```
mockify-ai/
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── login/           # Login page
│   │   │   └── signup/          # Signup page
│   │   ├── api/                 # Backend API endpoints
│   │   │   ├── upload/          # File upload & OCR processing
│   │   │   ├── generate-questions/  # AI question generation
│   │   │   ├── submit-test/     # Test submission & scoring
│   │   │   ├── progress/        # User progress tracking
│   │   │   ├── comments/        # Community comments
│   │   │   └── discussions/     # Discussion threads
│   │   ├── dashboard/           # Main dashboard
│   │   │   ├── materials/       # Study materials management
│   │   │   ├── tests/           # Test history & results
│   │   │   ├── analytics/       # Performance analytics
│   │   │   └── settings/        # User settings
│   │   ├── test/[id]/           # Dynamic test taking page
│   │   ├── community/           # Community discussions
│   │   ├── profile/             # User profile
│   │   └── page.tsx             # Landing page
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # Radix UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── [50+ more]
│   │   ├── Dashboard.tsx        # Dashboard component
│   │   ├── UploadMaterials.tsx  # File upload interface
│   │   ├── Community.tsx        # Community forum
│   │   ├── Profile.tsx          # User profile display
│   │   └── [more components]
│   │
│   ├── lib/                     # Core services & utilities
│   │   ├── server-ocr.ts        # OCR processing (pdf-parse, mammoth, tesseract)
│   │   ├── groq.ts              # Groq AI integration
│   │   ├── gemini.ts            # Google Gemini AI
│   │   ├── openai.ts            # OpenAI integration
│   │   ├── supabase.ts          # Supabase client (browser)
│   │   ├── supabase-server.ts   # Supabase server client
│   │   ├── scoring.ts           # Test scoring logic
│   │   └── utils.ts             # Utility functions
│   │
│   └── contexts/                # React contexts
│       └── ThemeContext.tsx     # Theme management
│
└── backend/
    └── database/                # SQL schema files
        ├── supabase-schema.sql
        ├── enhanced-schema.sql
        └── [migration files]
```

### System Flow

#### 1. **User Authentication Flow**

```
User → Login/Signup Page → Supabase Auth
                              ↓
                    Google OAuth / Email+Password
                              ↓
                      Session Created
                              ↓
                      Redirect to Dashboard
```

#### 2. **File Upload & Processing Flow**

```
User uploads PDF/DOCX → UploadMaterials Component
                              ↓
                    FormData with file
                              ↓
                    POST /api/upload
                              ↓
                    ┌─────────────────────┐
                    │ server-ocr.ts       │
                    │ - extractTextFromPDF│
                    │ - extractTextFromDOCX│
                    │ - extractTextFromImage│
                    └─────────────────────┘
                              ↓
                    Text extracted + cleaned
                              ↓
                    Store in Supabase:
                    - Upload file to Storage
                    - Save metadata to 'materials' table
                    - Store extracted_text & structured_content
                              ↓
                    Return success to client
                              ↓
                    Display in Materials list
```

#### 3. **AI Question Generation Flow**

```
User selects materials + config → Dashboard
                              ↓
                    POST /api/generate-questions
                    {
                      materialIds: [...],
                      testConfig: {
                        examType: "MCQ",
                        difficulty: "medium",
                        questionCount: 20
                      }
                    }
                              ↓
                    Fetch materials from DB
                              ↓
                    Extract & combine text content
                              ↓
                    ┌─────────────────────┐
                    │ groq.ts             │
                    │ - Clean content     │
                    │ - Build AI prompt   │
                    │ - Call Groq API     │
                    │ - Parse JSON response│
                    └─────────────────────┘
                              ↓
                    Validate questions format
                              ↓
                    Store in 'tests' & 'questions' tables
                              ↓
                    Create 'user_test_sessions' record
                              ↓
                    Return test ID to client
                              ↓
                    Redirect to /test/[id]
```

#### 4. **Test Taking Flow**

```
User navigates to /test/[id] → Load test & questions
                              ↓
                    Fetch from 'tests' & 'questions' tables
                              ↓
                    Display questions one by one
                              ↓
                    User selects answers
                              ↓
                    On Submit → POST /api/submit-test
                              ↓
                    ┌─────────────────────┐
                    │ scoring.ts          │
                    │ - Compare answers   │
                    │ - Calculate score   │
                    │ - Generate feedback │
                    └─────────────────────┘
                              ↓
                    Store results in 'results' table
                              ↓
                    Update user progress
                              ↓
                    Display results with explanations
```

#### 5. **Community Discussion Flow**

```
User creates post → Community Component
                              ↓
                    POST /api/discussions
                              ↓
                    Validate user authentication
                              ↓
                    Store in 'discussions' table
                              ↓
                    Fetch user name from 'users' table
                              ↓
                    Display post in community feed
                              ↓
                    Other users can comment
                              ↓
                    POST /api/comments
                              ↓
                    Store in 'comments' table
```

### Database Schema

#### Core Tables

**users**
- `id` (UUID, Primary Key)
- `email` (Text, Unique)
- `name` (Text)
- `created_at` (Timestamp)

**materials**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `filename` (Text)
- `file_path` (Text)
- `file_size` (Integer)
- `mime_type` (Text)
- `extracted_text` (Text)
- `structured_content` (JSONB)
- `ocr_confidence` (Float)
- `processing_method` (Text)
- `created_at` (Timestamp)

**tests**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `title` (Text)
- `exam_type` (Text)
- `difficulty` (Text)
- `total_questions` (Integer)
- `created_at` (Timestamp)

**questions**
- `id` (UUID, Primary Key)
- `test_id` (UUID, Foreign Key → tests)
- `question_text` (Text)
- `options` (JSONB)
- `correct_answer` (Text)
- `explanation` (Text)
- `topic` (Text)
- `difficulty` (Text)

**results**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `test_id` (UUID, Foreign Key → tests)
- `score` (Float)
- `total_questions` (Integer)
- `answers` (JSONB)
- `completed_at` (Timestamp)

**discussions**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `title` (Text)
- `content` (Text)
- `created_at` (Timestamp)

**comments**
- `id` (UUID, Primary Key)
- `discussion_id` (UUID, Foreign Key → discussions)
- `user_id` (UUID, Foreign Key → users)
- `content` (Text)
- `created_at` (Timestamp)

### Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Supabase Auth**: JWT-based authentication with secure session management
- **Service Role Key**: Server-side operations use elevated permissions
- **File Upload Validation**: Type and size checks before processing
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Protection**: Input sanitization and React's built-in escaping

## 🔧 Configuration & Setup

### Environment Variables

Create `.env.local` file with the following:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (Server-side only - NEVER expose to client)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=gsk_your_groq_api_key (optional)
OPENAI_API_KEY=sk-your_openai_api_key (optional)

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Configuration

1. **Create Supabase Project**: Visit [supabase.com](https://supabase.com) and create a new project

2. **Run Database Schema**:
   - Open SQL Editor in Supabase dashboard
   - Execute `backend/database/supabase-schema.sql`
   - Execute `backend/database/enhanced-schema.sql`
   - Execute `backend/database/fix-storage-policies.sql`

3. **Setup Storage Bucket**:
   - Go to Storage → Create bucket named `study-materials`
   - Make it public or configure RLS policies
   - Enable uploads for authenticated users

4. **Configure Authentication**:
   - Go to Authentication → Providers
   - Enable Email provider
   - Enable Google OAuth (optional):
     - Add Google Client ID and Secret
     - Add authorized redirect URIs

### AI Service Setup

**Groq (Recommended - Fast & Free)**
- Sign up at [console.groq.com](https://console.groq.com)
- Create API key
- Models available: llama-3.1-8b-instant, llama-3.2-3b-preview

**Google Gemini (Optional)**
- Get API key from [ai.google.dev](https://ai.google.dev)
- Models: gemini-1.5-flash, gemini-pro

**OpenAI (Optional)**
- Get API key from [platform.openai.com](https://platform.openai.com)
- Models: gpt-4, gpt-3.5-turbo

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Manual Deployment
1. Build the application: `npm run build`
2. Set up environment variables on your hosting platform
3. Ensure Python environment is available for OCR features
4. Deploy the built application

## 🎯 Key Features Explained

### OCR Text Extraction

The platform uses a multi-library approach for optimal text extraction:

1. **pdf-parse**: Primary library for text-based PDFs (95%+ accuracy)
2. **mammoth**: DOCX document processing (native text extraction)
3. **tesseract.js**: Fallback for image-based PDFs and scanned documents

### AI Question Generation

Three AI services with intelligent fallback:

1. **Groq (Primary)**: Fast inference with llama-3.1-8b-instant
   - Best for speed and cost-effectiveness
   - Processes 20 questions in ~5-10 seconds

2. **Google Gemini**: Alternative with gemini-1.5-flash
   - Good for longer context windows
   - Better at complex reasoning

3. **OpenAI**: Premium fallback with GPT-4
   - Highest quality output
   - More expensive

### Dynamic User Personalization

All user interfaces dynamically fetch and display actual user data:

- Dashboard displays user's name from database
- Community posts show real user names and avatars
- Progress tracking personalized per user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Groq](https://groq.com/) - Lightning-fast AI inference
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 🎯 MVP Roadmap & Implementation Status

### Current Status: 80% MVP Complete

**✅ Completed:**
- Core features: Auth, Upload, OCR, AI Generation, Test Taking, Analytics, Community
- Production-ready architecture with cost-optimized AI (Groq $0.05/1M tokens)
- Row Level Security and Supabase infrastructure

**🔴 Critical Gaps (Blocking Launch):**
1. **Payments Integration** - Razorpay for ₹299/₹499 tiers (2 days)
2. **Hindi Language Support** - OCR + UI for 80% India market (3 days)
3. **Onboarding Questionnaire** - Goal capture for personalization (1 day)
4. **Rate Limiting** - Prevent AI cost overruns (1 day)
5. **Weak Area Plans** - AI-generated improvement roadmaps (2 days)

**📋 Implementation Details:** See [MVP_IMPLEMENTATION_ROADMAP.md](./MVP_IMPLEMENTATION_ROADMAP.md) for:
- Phase 1 (Weeks 1-2): Payment integration, Hindi support, usage limits
- Phase 2 (Weeks 3-6): Beta launch → 100 paying users
- Database enhancements: [mvp-phase1-enhancements.sql](./backend/database/mvp-phase1-enhancements.sql)
- Target: ₹25k MRR in 90 days

### 90-Day Goals

| Metric | Target | Status |
|--------|--------|--------|
| Total Users | 500+ | 🔜 Launch pending |
| Paying Users | 100+ | 🔜 Payment integration needed |
| Monthly Revenue | ₹25,000+ | 🔜 Awaiting monetization |
| Test Completion Rate | 60%+ | ✅ Architecture supports |
| User Retention (30d) | 60%+ | ✅ Community features ready |

## 💰 Pricing Plans (India-Focused)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 1 test/month, 10 questions, basic analytics |
| **Premium** | ₹299/month | Unlimited tests, 50 questions, AI explanations, Hindi support |
| **Pro** | ₹499/month | 100 questions/test, priority support, WhatsApp alerts |

## 📧 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/Dashrath-Patel/Mockify-AI/issues)
- **Discussions**: [Join community discussions](https://github.com/Dashrath-Patel/Mockify-AI/discussions)
- **Implementation Help**: See [MVP_IMPLEMENTATION_ROADMAP.md](./MVP_IMPLEMENTATION_ROADMAP.md)

---

⭐ **Star this repository if you find it useful!**

Built with 💙 by [Dashrath Patel](https://github.com/Dashrath-Patel) | 🎯 Goal: 100 paying users in 90 days
