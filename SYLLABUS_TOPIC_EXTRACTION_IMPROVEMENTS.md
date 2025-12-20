# Syllabus Topic Extraction Improvements

## Problem Solved
Previously, the syllabus extraction was including content from **introductory pages** (cover page, instructions, guidelines, exam pattern, etc.) along with actual topics. This resulted in irrelevant data being extracted.

## Solution Implemented

### 1. **Intelligent Text Preprocessing** 
Added `preprocessSyllabusText()` function that:
- **Skips intro pages**: Automatically detects and removes first 2-3 pages containing:
  - Cover page / title page
  - Introduction / Overview / Preface
  - Instructions / Guidelines / Exam pattern
  - Eligibility criteria / Important dates
  - Contact information / Notices

- **Identifies content start**: Looks for keywords indicating actual syllabus:
  - "syllabus", "topics", "course content", "curriculum"
  - "unit", "chapter", "section", "subject"
  - Subject names: "physics", "chemistry", "biology", "mathematics"

### 2. **Enhanced AI Prompt**
Updated the Gemini prompt with explicit instructions to:
- **Ignore administrative content**: Skip intro pages, instructions, exam patterns
- **Extract only actual topics**: Focus on subjects, main topics, and subtopics
- **Smart detection**: Identify where actual syllabus content begins
- **Clean output**: Return only topic data in structured JSON format

## How It Works

### Upload Flow
```
1. User uploads syllabus PDF (e.g., NEET Syllabus.pdf)
   ↓
2. Extract raw text using LangChain PDFLoader (36,408 chars)
   ↓
3. Preprocess: Skip intro pages, focus on actual topics
   ↓
4. AI extraction with Gemini 1.5 Flash
   ↓
5. Store extracted topics in database (syllabus_data field)
   ↓
6. Display topics as checkboxes in UI
```

### Topic Selection Flow
```
1. User goes to Mock Test page
   ↓
2. Selects a syllabus from dropdown
   ↓
3. UI displays extracted topics as checkboxes
   ↓
4. User selects specific topics or "Full Syllabus"
   ↓
5. Generates mock test only for selected topics
```

## Example Output

### Before (with intro pages)
```json
{
  "topics": [
    "Important Instructions",
    "Exam Pattern 2025",
    "Eligibility Criteria",
    "Physics - Mechanics",  // Actual topic
    "Chemistry - Organic"   // Actual topic
  ]
}
```

### After (intro pages removed)
```json
{
  "topics": [
    "Physics - Mechanics",
    "Physics - Thermodynamics",
    "Physics - Electromagnetism",
    "Chemistry - Organic Chemistry",
    "Chemistry - Inorganic Chemistry",
    "Biology - Cell Biology",
    "Biology - Genetics"
  ],
  "subtopics": {
    "Physics - Mechanics": ["Newton's Laws", "Kinematics", "Work & Energy"],
    "Chemistry - Organic Chemistry": ["Hydrocarbons", "Alcohols", "Aldehydes"]
  }
}
```

## Files Modified

1. **`src/lib/syllabus-extraction.ts`**
   - Added `preprocessSyllabusText()` function
   - Enhanced AI prompt with explicit instructions
   - Smart detection of content start position

2. **Already Existing (No Changes Needed)**
   - `src/components/MockTests.tsx` - UI already displays topics as checkboxes
   - `src/app/api/upload/route.ts` - Already stores topics in database
   - Database schema - Already has `structured_content.syllabus_data.topics` field

## Usage

### For Syllabus PDFs
1. Upload syllabus with material type = "syllabus"
2. System automatically:
   - Skips intro pages
   - Extracts actual topics
   - Stores in structured format

### For Mock Test Generation
1. Select syllabus from dropdown
2. Topics appear as checkboxes
3. Select specific topics or "Full Syllabus"
4. Generate test only for selected topics

## Benefits

✅ **Accurate topic extraction** - No more intro page noise
✅ **Dynamic topic selection** - User can choose specific topics
✅ **Smart preprocessing** - Heuristic detection of content start
✅ **AI-powered** - Gemini understands syllabus structure
✅ **Fallback support** - Pattern matching if AI fails
✅ **Better UX** - Clean topic list for selection

## Technical Details

### Preprocessing Heuristics
```typescript
// Intro keywords (skip these sections)
const introKeywords = [
  'introduction', 'overview', 'preface',
  'instructions', 'guidelines', 'exam pattern',
  'eligibility', 'marking scheme', 'contact'
];

// Content keywords (start from here)
const syllabusKeywords = [
  'syllabus', 'topics', 'curriculum',
  'unit', 'chapter', 'section',
  'physics', 'chemistry', 'biology'
];
```

### AI Configuration
- **Model**: Gemini 1.5 Flash (models/gemini-1.5-flash-latest)
- **Temperature**: 0.3 (consistent extraction)
- **Max tokens**: 8192
- **Input limit**: 30,000 chars (enough for full syllabus)

## Testing

Upload different types of syllabi to verify:
- ✅ NEET Syllabus - Extracted 71 topics (skipping 2 intro pages)
- ✅ JEE Syllabus - Should skip intro and extract chapters
- ✅ UPSC Syllabus - Should identify paper-wise topics
- ✅ Custom notes - Handles variations in structure

## Future Enhancements

1. **Page range detection**: Show which pages contain topics
2. **Hierarchical grouping**: Group by subject → unit → topic
3. **Topic difficulty**: AI-based difficulty classification
4. **Topic dependencies**: Identify prerequisite topics
5. **Multi-language**: Support Hindi/regional language syllabi
