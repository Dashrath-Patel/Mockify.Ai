# Syllabus Upload & Topic Extraction Flow

## Complete Step-by-Step Process

### 📤 **Step 1: User Uploads Syllabus PDF**
```
User selects file: "NEET_Syllabus_2025.pdf"
Material Type: "syllabus"
Exam Type: "NEET"
```

### 📄 **Step 2: PDF Text Extraction**
```typescript
// Uses LangChain PDFLoader
const { rawText, chunks } = await extractAndChunkPDF(fileBuffer, CHUNK_STRATEGIES.MEDIUM);

Result:
- rawText: 36,408 characters (FULL syllabus text)
- chunks: 50 chunks (1000 chars each, 200 overlap)
```

**Important**: Chunks are created from **RAW TEXT** for semantic search, but topic extraction uses **FULL RAW TEXT**, not chunks!

### 🎯 **Step 3: Topic Extraction (ONLY for syllabus type)**

```typescript
if (materialType === 'syllabus') {
  // Extract topics from FULL RAW TEXT (not from chunks)
  const syllabusExtraction = await extractSyllabusTopics(rawText, finalExam);
}
```

#### What happens inside `extractSyllabusTopics()`:

**3a. Smart Preprocessing**
```typescript
const cleanedText = preprocessSyllabusText(syllabusText);
// Scans first 150 lines, scores each line
// Skips intro pages if detected
// Output: Text starting from actual topics
```

**3b. AI Extraction with Gemini**
```typescript
const truncatedText = cleanedText.substring(0, 30000); // Max 30K chars
// Sends to Gemini 1.5 Flash with prompt
// AI reads entire text and extracts structured topics
// Returns JSON: { topics: [...], subtopics: {...}, sections: [...] }
```

**3c. Fallback if AI fails**
```typescript
if (syllabusExtraction fails) {
  // Use pattern matching
  syllabusTopics = extractTopicsWithPatterns(rawText, finalExam);
  // Looks for: "1. Physics", "Unit 1:", "Chapter 5", etc.
}
```

### 💾 **Step 4: Storage in Database**

Two separate storage locations:

#### 4a. Material Record (study_materials table)
```typescript
// Update the material with:
{
  extracted_text: "All Stakeholders and aspirants...", // Full 36K chars
  structured_content: {
    document_type: 'syllabus',
    is_syllabus: true,
    syllabus_data: {
      topics: [
        "Physics - Mechanics",
        "Physics - Thermodynamics",
        "Chemistry - Organic Chemistry",
        // ... 71 topics total
      ],
      subtopics: {
        "Physics - Mechanics": ["Newton's Laws", "Kinematics"],
        // ...
      },
      sections: ["Section A - Physics", "Section B - Chemistry"]
    },
    chunks: [...],  // All 50 chunks stored here too
    metadata: { ... }
  },
  embedding: [0.009740471, 0.017783524, ...] // 768-dim vector
}
```

#### 4b. Chunk Storage (document_chunks table)
```typescript
// Store each of 50 chunks separately
for each chunk:
  INSERT INTO document_chunks {
    material_id: material.id,
    chunk_index: 0-49,
    content: "chunk text (1000 chars)",
    embedding: [0.123, 0.456, ...], // 768-dim vector per chunk
    metadata: { source, page, chunkIndex }
  }
```

### 🔍 **Step 5: Retrieval & Display**

#### When user opens Mock Test page:

```typescript
// Fetch material with topics
const { data } = await supabase
  .from('study_materials')
  .select('id, structured_content, ...')
  .eq('material_type', 'syllabus');

// Extract topics from structured_content
const topics = data.structured_content.syllabus_data.topics;
setSyllabusTopics(topics); // Display as checkboxes
```

#### UI Shows:
```
☑ Physics - Mechanics
☑ Physics - Thermodynamics  
☑ Chemistry - Organic Chemistry
☐ Biology - Cell Biology
...

[Select All] [Full Syllabus] [Clear]
```

### 🎓 **Step 6: Mock Test Generation**

User selects topics and clicks "Generate Test":

```typescript
// Selected topics
const selectedTopics = ["Physics - Mechanics", "Chemistry - Organic"];

// API call to generate questions
POST /api/generate-questions
{
  materialIds: [material_id],
  topics: ["Physics - Mechanics", "Chemistry - Organic"],
  numQuestions: 20
}
```

#### Question Generation Process:

**6a. Semantic Search in Chunks**
```typescript
// Search only relevant chunks using embeddings
const query = "Physics - Mechanics topics";
const queryEmbedding = await generateEmbedding(query);

// Find top N most similar chunks
SELECT chunk_id, content, embedding <-> query_embedding AS distance
FROM document_chunks
WHERE material_id = ?
ORDER BY distance
LIMIT 10;
```

**6b. Gemini Generates Questions**
```typescript
// Uses retrieved chunks as context
const context = relevantChunks.map(c => c.content).join('\n\n');

// Prompt to Gemini
const prompt = `Based on this syllabus content:
${context}

Generate 20 MCQs on topics: Physics - Mechanics, Chemistry - Organic
...`;

// Returns structured questions
```

---

## Key Points to Understand

### ✅ **Two Parallel Processes**

1. **Topic Extraction** (from FULL RAW TEXT)
   - Purpose: Give users a list to choose from
   - Input: Complete 36K char text
   - Output: Structured topic list
   - Storage: `structured_content.syllabus_data.topics`

2. **Chunking** (for semantic search)
   - Purpose: Enable finding relevant content
   - Input: Same 36K char text
   - Output: 50 chunks with embeddings
   - Storage: `document_chunks` table

### ✅ **Why Both Are Needed**

**Without Topics:**
- User has no way to select specific subjects
- Would need to manually type "Physics" or "Chemistry"
- No structured navigation

**Without Chunks:**
- Can't do semantic search
- Would need to send entire 36K text to AI (expensive, slow)
- No relevance ranking

### ✅ **The Flow in Simple Terms**

```
Upload PDF
    ↓
Extract FULL TEXT (36,408 chars)
    ↓
    ├─→ Extract Topics (AI reads full text)
    │   └─→ Store in structured_content.syllabus_data
    │
    └─→ Create Chunks (split into 50 pieces)
        └─→ Store in document_chunks with embeddings
```

Then later:

```
User selects topics from UI
    ↓
Generate test for selected topics
    ↓
Search relevant chunks using embeddings
    ↓
Send chunks to Gemini to generate questions
    ↓
Return MCQs to user
```

---

## Important: Topics vs Chunks

| Aspect | Topics | Chunks |
|--------|--------|--------|
| **Source** | Full raw text (36K) | Same full raw text (36K) |
| **Purpose** | User selection/navigation | Semantic search |
| **Processing** | AI extraction (Gemini) | Text splitting (1000 chars) |
| **Storage** | `structured_content` JSON | `document_chunks` table |
| **Count** | 71 topics | 50 chunks |
| **Used for** | UI checkboxes | Question generation context |
| **Embeddings** | No (just text list) | Yes (768-dim vectors) |

---

## Example Data Structure

### In `study_materials.structured_content`:
```json
{
  "document_type": "syllabus",
  "is_syllabus": true,
  "syllabus_data": {
    "topics": [
      "Physics - Mechanics",
      "Physics - Thermodynamics",
      "Chemistry - Organic Chemistry",
      "Biology - Cell Biology"
    ],
    "subtopics": {
      "Physics - Mechanics": ["Newton's Laws", "Kinematics", "Work & Energy"]
    }
  },
  "chunks": [
    { "content": "All Stakeholders and aspirants...", "metadata": {...} },
    // ... 50 chunks
  ]
}
```

### In `document_chunks` table:
```sql
| id | material_id | chunk_index | content | embedding |
|----|-------------|-------------|---------|-----------|
| 1  | mat_123     | 0          | "All Stakeholders..." | [0.01, 0.02, ...] |
| 2  | mat_123     | 1          | "Physics topics include..." | [0.03, 0.04, ...] |
| 3  | mat_123     | 2          | "Newton's laws state..." | [0.05, 0.06, ...] |
```

---

## Why This Design Works

1. **Efficient Topic Selection**: User sees clean list, not raw text
2. **Smart Content Retrieval**: Embeddings find relevant chunks quickly
3. **Cost Effective**: Only send relevant chunks to AI, not full 36K
4. **Accurate Questions**: AI has both topic context + detailed content
5. **Scalable**: Works for 1-page syllabus or 100-page textbook

---

## Summary

**The topics are NOT extracted from chunks.**  
**Topics are extracted from the FULL RAW TEXT using AI.**  
**Chunks are created separately for semantic search purposes.**  
**Both use the same source text but serve different purposes.**
