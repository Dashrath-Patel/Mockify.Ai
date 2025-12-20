# Question Generation System: Complete Flow & Analysis

## 📋 System Flow Overview

### 1. User Input Phase
- User uploads a PDF document (e.g., 25-page Physics PDF)
- System extracts 61,091 characters of raw text
- Content is split into **84 uniform chunks** using RecursiveCharacterTextSplitter
  - Each chunk: ~1000 characters with 200-character overlap
  - Overlap ensures context continuity between chunks
- Each chunk gets its own 768-dimensional embedding vector using HuggingFace's `sentence-transformers/all-mpnet-base-v2` model

### 2. Storage Phase
- All 84 chunks stored in `document_chunks` table with:
  - Original text content
  - Start/end character positions
  - 768-dimensional embedding vector
  - Link to parent material

### 3. Test Generation Request
When user clicks "Generate & Start Test":
- User specifies:
  - Material selection (e.g., Physics PDF)
  - Exam type (e.g., NEET)
  - Topic (e.g., Physics)
  - Number of questions (e.g., 10)
  - Test duration (e.g., 20 minutes)

### 4. Semantic Search Phase
System creates a search query embedding:
- Query text: "NEET Physics questions and concepts"
- Generates 768-dimensional embedding for this query
- Searches all 84 chunks using cosine similarity
- **Current limitation: Retrieves only top 30 chunks with >30% similarity**
- Result: 21 chunks pass the threshold
  - Top similarities: 49.9%, 43.9%, 40.8%, 39.7%, 39.5%
  - Average: 37.1% similarity

### 5. Context Preparation Phase
The 21 relevant chunks are formatted:
```
[Context 1] (Physics - 49.9% relevant)
chars 0-977
[chunk text content]

[Context 2] (Physics - 43.9% relevant)
chars 29478-29747
[chunk text content]
...
```

**Current Challenge:**
- Combined chunks: 19,393 characters
- **Limitation: Truncated to 6,999 characters** to fit LLM token limits
- This means only ~36% of retrieved content is actually used
- Approximately 7-8 chunks worth of content reaches the LLM

### 6. Prompt Construction Phase
Two-part prompt created:

**System Message:**
```
You are a professional NEET exam question generator. 
You ONLY output valid JSON arrays of questions. 
Never use markdown formatting or explanatory text.
```

**User Prompt:**
```
Generate EXACTLY 10 high-quality multiple-choice questions for NEET exam on topic "Physics".

STRICT REQUIREMENTS:
1. Generate EXACTLY 10 questions - no more, no less
2. Each question must be challenging and exam-appropriate
3. Provide 4 options (A, B, C, D) for each question
4. Mark the correct answer (A/B/C/D)
5. Include detailed explanation for correct answer
6. Questions based on content below

DIFFICULTY GUIDELINES:
- 40% Easy (recall and basic concepts)
- 40% Medium (application and understanding)
- 20% Hard (analysis, synthesis, complex problems)

CONTENT TO BASE QUESTIONS ON:
[The 6,999 characters of formatted chunks]

OUTPUT FORMAT (JSON only, no markdown):
[{question, options, correctAnswer, explanation}]
```

### 7. LLM Generation Phase
**Model Used:** `llama-3.3-70b-versatile` via Groq API

**Parameters:**
- Max tokens: Dynamically calculated (1500 for 10 questions + 500 buffer = 2000 tokens)
- Temperature: 0.7 (balanced creativity)
- Top P: 0.9 (diverse but coherent outputs)

**LLM Processing:**
- Reads the 6,999 characters of context
- Understands exam type (NEET) and difficulty requirements
- Generates questions based on the most relevant chunks
- Returns JSON array of questions

**Current Issues Encountered:**
- LLM sometimes generates more questions than requested (e.g., 37 instead of 10)
- Sometimes generates fewer (e.g., 9 instead of 10)
- JSON responses occasionally truncated mid-object
- Sometimes includes markdown formatting despite instructions

### 8. Response Processing Phase
**Cleaning Steps:**
1. Remove markdown code blocks (```json, ```)
2. Trim whitespace
3. Attempt JSON parsing

**If JSON parsing fails:**
- Detect truncation at position (e.g., position 13148)
- Find last complete question object
- Close JSON array properly
- Extract questions using pattern matching as fallback

**Validation:**
- Question text must be >10 characters
- Must have exactly 4 options (A, B, C, D)
- Correct answer must be valid (A/B/C/D only)
- Explanation must be >5 characters
- **Final enforcement: Slice to exact requested count** (e.g., take first 10 out of 37)

### 9. Test Delivery Phase
- Validated questions sent to frontend
- Timer initialized with user's specified duration (converted from minutes to seconds)
- Test interface displays questions one by one
- User can navigate, select answers, and submit

---

## 🚨 Current Limitations & Issues

### 1. Chunk Retrieval Limitation
- **Problem:** Only 21 out of 84 chunks retrieved
- **Why:** `match_count: 30` hardcoded limit + 30% similarity threshold
- **Impact:** Missing potentially relevant content from 63 chunks

### 2. Content Truncation Limitation
- **Problem:** 19,393 chars truncated to 6,999 chars
- **Why:** Token limit constraint (7000 chars ≈ 1750 tokens)
- **Impact:** Only 36% of retrieved chunks actually used by LLM
- **Effect:** Questions generated from limited context

### 3. Token Budget Constraint
- **Problem:** Total token budget shared between:
  - Input prompt (~2000 tokens for 7k chars)
  - Output generation (~2000 tokens for 10 questions)
  - Total: ~4000 tokens used, but model has 8000 token limit
- **Why Conservative:** To avoid hitting limits with larger requests
- **Impact:** Can't use more content even though capacity exists

### 4. Question Count Inconsistency
- **Problem:** LLM ignores exact count request
- **Current Fix:** Slice output to requested count
- **Limitation:** If LLM generates only 9 questions, user gets 9 instead of 10
- **Why:** LLM instruction-following not perfect, especially for exact counts

### 5. JSON Format Issues
- **Problem:** LLM sometimes includes markdown, extra text, or truncates mid-JSON
- **Current Fix:** Multiple parsing strategies with fallbacks
- **Limitation:** Complex repair logic needed for what should be simple JSON output

### 6. Embedding Quality Limitation
- **Problem:** Best chunk similarity only 49.9%
- **Why:** Single-word/short-phrase queries ("Physics") vs. document chunks (full paragraphs)
- **Impact:** May miss relevant sections that use different terminology

### 7. Fixed Chunk Strategy
- **Problem:** All documents chunked at 1000 chars with 200 overlap
- **Why:** No adaptive chunking based on document structure
- **Impact:** May split related concepts or combine unrelated ones

---

## 🚀 Future Improvements with Premium LLMs

### 1. Use Models with Larger Context Windows

**Current:**
- llama-3.3-70b: 8,000 tokens (~32,000 characters)

**Premium Options:**
- **Claude 3.5 Sonnet:** 200,000 tokens (~800,000 characters)
- **GPT-4 Turbo:** 128,000 tokens (~512,000 characters)
- **Gemini 1.5 Pro:** 1,000,000 tokens (~4,000,000 characters)

**Benefits:**
- Send ALL 84 chunks without truncation
- Include full 19,393 characters (or more)
- No need to limit to top 30 chunks
- Better context understanding = better questions

### 2. Implement RAG with Reranking

**Current:** Simple cosine similarity search

**Premium Approach:**
1. **First Pass:** Retrieve top 100 chunks (not 30)
2. **Reranking:** Use Cohere Rerank or similar to reorder by true relevance
3. **Second Pass:** Take top 50 most relevant chunks after reranking
4. **Result:** Higher quality context with better semantic matching

### 3. Multi-Stage Question Generation

**Stage 1: Content Analysis**
- LLM reads all chunks
- Identifies key concepts, formulas, definitions
- Creates knowledge graph

**Stage 2: Question Planning**
- Determines difficulty distribution
- Plans question types (conceptual, numerical, application)
- Ensures topic coverage

**Stage 3: Question Generation**
- Generates questions based on plan
- Guarantees exact count
- Ensures no duplicate concepts

**Stage 4: Quality Review**
- Self-critique by LLM
- Checks for ambiguity, clarity, accuracy
- Regenerates weak questions

### 4. Adaptive Chunking Strategies

**Current:** Fixed 1000-character chunks

**Premium Approach:**
- **Semantic Chunking:** Split at natural boundaries (paragraphs, sections)
- **Sentence-Window Retrieval:** Retrieve by sentence, but provide surrounding context
- **Hierarchical Chunking:** 
  - Small chunks (256 chars) for precise retrieval
  - Medium chunks (1024 chars) for context
  - Large chunks (4096 chars) for overview
- **Document Structure Awareness:** Preserve headings, equations, diagrams

### 5. Query Expansion & Reformulation

**Current:** Single query: "NEET Physics questions and concepts"

**Premium Approach:**
- Generate multiple query variations:
  - "Physics numerical problems and calculations"
  - "Conceptual Physics questions for competitive exams"
  - "Laws and theories in Physics"
  - "Physics formulas and applications"
- Retrieve chunks for each query
- Combine and deduplicate results
- **Result:** Better coverage of relevant content

### 6. Hybrid Search

**Current:** Pure vector similarity search

**Premium Approach:**
- **Vector Search:** Semantic similarity (current approach)
- **Keyword Search:** BM25 for exact term matching
- **Weighted Combination:** 70% vector + 30% keyword
- **Result:** Catch both semantic matches AND exact terminology

### 7. Streaming Generation

**Current:** Wait for all questions at once

**Premium Approach:**
- Stream questions one by one as generated
- Show progress: "Generated 3/10 questions..."
- User can see questions appearing in real-time
- Better UX for large question sets

### 8. Question Validation Service

**Current:** Basic validation (length, structure)

**Premium Approach:**
- **Separate LLM call** to validate each question:
  - Is question clear and unambiguous?
  - Are all options plausible?
  - Is correct answer truly correct?
  - Is explanation accurate?
  - Difficulty level appropriate?
- Auto-fix or regenerate problematic questions
- **Result:** Higher quality output

### 9. Dynamic Difficulty Adjustment

**Current:** Fixed 40/40/20 distribution

**Premium Approach:**
- Analyze user's past performance
- Adjust difficulty based on topic mastery
- Easy topics → more hard questions
- Weak topics → more medium questions
- **Result:** Personalized learning experience

### 10. Multi-Document Synthesis

**Current:** Generate from single material

**Premium Approach:**
- When user selects multiple PDFs:
  - Retrieve chunks from all materials
  - LLM synthesizes cross-document questions
  - "Compare concept X from material A with Y from material B"
- **Result:** Deeper understanding, integrated knowledge

---

## 📊 Recommended Architecture for Premium Version

### Phase 1: Enhanced Retrieval
```
User Request
    ↓
Query Expansion (5 variations)
    ↓
Hybrid Search (Vector 70% + Keyword 30%)
    ↓
Retrieve Top 100 Chunks
    ↓
Rerank with Cohere (Take Top 50)
    ↓
All 50 chunks (no truncation) → LLM
```

### Phase 2: Intelligent Generation
```
Claude 3.5 Sonnet (200k context)
    ↓
Read all 50 chunks fully
    ↓
Analyze content & plan questions
    ↓
Generate questions iteratively
    ↓
Self-validate each question
    ↓
Stream to frontend in real-time
```

### Phase 3: Quality Assurance
```
Generated Questions
    ↓
Separate Validation LLM
    ↓
Check clarity, accuracy, difficulty
    ↓
Auto-fix issues or regenerate
    ↓
Ensure exact count match
    ↓
Deliver to user
```

---

## 💰 Cost-Benefit Analysis

### Current System (Groq Free Tier)
- **Cost:** $0
- **Limitations:** 8k tokens, JSON issues, truncation
- **Quality:** 70-80% (good but not great)
- **Speed:** Fast (15-20 seconds)

### Premium Option 1: Claude 3.5 Sonnet
- **Cost:** ~$0.50-$1.00 per test generation
- **Benefits:** 200k context, perfect JSON, no truncation
- **Quality:** 90-95% (excellent)
- **Speed:** 20-30 seconds

### Premium Option 2: GPT-4 Turbo
- **Cost:** ~$0.30-$0.60 per test generation
- **Benefits:** 128k context, reliable output
- **Quality:** 85-90% (very good)
- **Speed:** 15-25 seconds

### Premium Option 3: Gemini 1.5 Pro
- **Cost:** ~$0.10-$0.30 per test generation
- **Benefits:** 1M context (massive), free tier available
- **Quality:** 85-90% (very good)
- **Speed:** 25-35 seconds

---

## 🎯 Immediate Next Steps

### Quick Wins (No Cost)
1. Increase `match_count` from 30 to 50 chunks
2. Lower `match_threshold` from 30% to 25%
3. Increase content limit from 7k to 10k characters
4. Implement query expansion (generate 3-5 query variations)
5. Add retry logic when question count doesn't match

### Medium-Term (Low Cost)
1. Switch to GPT-4 Turbo for better reliability
2. Implement basic reranking with sentence-transformers
3. Add streaming for better UX
4. Implement separate validation pass

### Long-Term (Premium)
1. Migrate to Claude 3.5 Sonnet for best quality
2. Implement full RAG pipeline with reranking
3. Add multi-stage generation with planning
4. Build question quality scoring system
5. Implement adaptive difficulty based on user history

---

## 📈 Expected Quality Improvements

### Current System
- Question relevance: 70-80%
- Answer accuracy: 85-90%
- Explanation quality: 75-85%
- Difficulty appropriateness: 70-80%

### With Premium LLMs
- Question relevance: 90-95% (full context awareness)
- Answer accuracy: 95-98% (better reasoning)
- Explanation quality: 90-95% (clearer, more detailed)
- Difficulty appropriateness: 90-95% (better calibration)

### With Full Premium System (LLM + Retrieval + Validation)
- Question relevance: 95-98%
- Answer accuracy: 98-99%
- Explanation quality: 95-98%
- Difficulty appropriateness: 95-98%

---

## 📝 Technical Implementation Details

### Key Files

1. **`src/lib/groq.ts`** - Question generation logic
   - Prompt construction
   - LLM API calls
   - JSON parsing and validation
   - Question count enforcement

2. **`src/app/api/generate-questions/route.ts`** - API endpoint
   - Semantic search orchestration
   - Chunk retrieval and formatting
   - Content truncation logic
   - Response handling

3. **`src/components/MockTests.tsx`** - Frontend UI
   - User input collection
   - Test generation trigger
   - Question display and timer
   - Answer submission

4. **`backend/database/add-document-chunks.sql`** - Database schema
   - `search_similar_chunks` RPC function
   - Cosine similarity search with pgvector
   - Filtering and ordering logic

### Current Configuration

```typescript
// Semantic Search Settings
match_count: 30          // Max chunks retrieved
match_threshold: 0.3     // 30% minimum similarity
content_limit: 7000      // Max characters sent to LLM

// LLM Settings
model: 'llama-3.3-70b-versatile'
max_tokens: 150 * questionCount + 500
temperature: 0.7
top_p: 0.9

// Chunking Settings
chunk_size: 1000         // Characters per chunk
chunk_overlap: 200       // Overlap between chunks
embedding_dims: 768      // HuggingFace all-mpnet-base-v2
```

---

## 🔍 Debugging & Monitoring

### Key Log Messages
```
📝 Generating embedding for: "NEET Physics questions and concepts"
✓ Embedding generated (768 dimensions, expected: 768)
✓ Found 21 relevant chunks
  Top similarities: 49.9%, 43.9%, 40.8%, 39.7%, 39.5%
✓ Combined 21 chunks into context
  Total content length: 19393 chars
  Average chunk similarity: 37.1%
Content length: 19393 chars -> 6999 chars
📤 Groq response length: 24351 chars
✓ Parsed 37 questions successfully
✅ Final output: 10 valid questions (requested: 10)
```

### Performance Metrics
- Embedding generation: ~2-3 seconds
- Semantic search: ~1-2 seconds
- LLM generation: ~10-15 seconds
- Total pipeline: ~15-20 seconds

---

This comprehensive document explains the entire question generation system, from PDF upload to final test delivery, including current limitations and a detailed roadmap for future enhancements with premium LLM models.
