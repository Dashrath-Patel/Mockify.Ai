# Chunk-Based Question Generation System

## Overview
Implemented semantic search-based question generation that uses relevant content chunks instead of full documents.

## How It Works

### 1. **Semantic Search for Relevant Chunks**
When generating questions from study materials:

```typescript
// Create search query from exam type and topics
const searchQuery = `${examType} ${topics.join(' ')} questions and concepts`;

// Generate embedding for the query
const queryEmbedding = await generateEmbedding(searchQuery);

// Search for most relevant chunks (top 30)
const chunks = await supabase.rpc('search_similar_chunks', {
  query_embedding: vectorLiteral,
  match_threshold: 0.3,
  match_count: 30,
  filter_user_id: userId
});
```

### 2. **Format Chunks as Context**
Retrieved chunks are formatted with metadata:

```typescript
[Context 1] (Physics - 49.0% relevant)
The ball hits the ground and rises to a height of...

---

[Context 2] (Physics - 47.6% relevant)
relation of a moving particle is given by...

---

[Context 3] (Physics - 46.0% relevant)
If the speed of gas coming out of the balloon...
```

### 3. **LLM Prompt with Context**
The LLM receives an enhanced prompt:

```
You are an expert question generator for Physics examinations.

IMPORTANT: The content below comes from semantically relevant chunks 
extracted from the user's study materials using AI-powered similarity 
search. These chunks were selected because they are most relevant to 
Physics topics.

Generate 10 multiple choice questions from the following relevant 
content chunks:

Content: [Context 1] (Physics - 49.0% relevant)
The ball hits the ground...
[Context 2] (Physics - 47.6% relevant)
...

Requirements:
- Difficulty level: medium
- Each question should have exactly 4 options (A, B, C, D)
- Provide the correct answer and explanation
- Focus on key concepts from the provided chunks
```

## Benefits

### ✅ **Precision**
- Only uses the **most relevant** parts of documents
- Avoids irrelevant content that could confuse the LLM
- 30-50% similarity scores ensure high-quality matches

### ✅ **Efficiency**
- Reduces token usage (shorter context)
- Faster generation (less text to process)
- Better question quality (focused content)

### ✅ **Scalability**
- Works with large documents (up to 10MB PDFs)
- Handles multiple documents seamlessly
- Chunks are pre-computed during upload

### ✅ **Transparency**
- Shows which chunks were used
- Displays similarity scores
- Tracks average relevance

## API Response

```json
{
  "success": true,
  "questions": [...],
  "metadata": {
    "exam_type": "Physics",
    "difficulty": "medium",
    "question_count": 10,
    "chunks_used": 30,
    "content_length": 15000,
    "average_similarity": "45.2%",
    "materials_used": 2
  }
}
```

## Example Flow

1. **User uploads** "Physics Question Bank.pdf" (61,091 chars, 84 chunks)
2. **User requests** 10 Physics questions, medium difficulty
3. **System generates** embedding for "Physics questions and concepts"
4. **System searches** 84 chunks, finds top 30 with 30-50% similarity
5. **System formats** chunks as numbered contexts with metadata
6. **LLM generates** 10 questions from the relevant chunks
7. **User receives** questions with metadata showing which chunks were used

## Files Modified

- ✅ `src/app/api/generate-questions/route.ts` - Chunk-based search
- ✅ `src/lib/groq.ts` - Enhanced prompt with chunk context
- ✅ `src/lib/pdf-chunking.ts` - Uniform chunking system
- ✅ `backend/database/add-document-chunks.sql` - Chunk storage & search

## Next Steps

- ✅ Semantic search working (40-50% similarity scores)
- ✅ Chunk-based question generation implemented
- 🔄 Test with various document types
- 🔄 Fine-tune similarity thresholds
- 🔄 Add chunk preview in UI
