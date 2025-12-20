/**
 * Syllabus Topic Extraction Service
 * Extracts topics and subtopics from official syllabus PDFs using AI
 */

import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

// Initialize new Gemini SDK with API key
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SyllabusTopicExtractionResult {
  success: boolean;
  topics: string[];
  subtopics?: Record<string, string[]>;
  sections?: string[];
  extractedAt: string;
  error?: string;
}

/**
 * Preprocesses syllabus text to intelligently find where actual content starts
 * Works for ANY exam type - uses multiple heuristics to detect content vs intro
 */
function preprocessSyllabusText(text: string): string {
  const lines = text.split('\n');
  
  // If document is too short, don't preprocess (likely already clean)
  if (lines.length < 20 || text.length < 2000) {
    console.log(`📄 Short document (${lines.length} lines), using full text`);
    return text;
  }
  
  // Keywords that indicate intro/metadata (NEGATIVE signals)
  const introKeywords = [
    'introduction', 'overview', 'preface', 'foreword', 'about',
    'instructions', 'guidelines', 'important note', 'notice', 'disclaimer',
    'eligibility', 'examination pattern', 'exam pattern', 'test pattern',
    'marking scheme', 'grading', 'contact', 'website', 'email', 'phone',
    'all rights reserved', 'copyright', 'published by', 'acknowledgment',
    'table of contents', 'contents', 'page', 'annexure', 'appendix',
    'notification', 'advertisement', 'apply online', 'registration',
    'fee structure', 'dates', 'schedule', 'calendar', 'timeline'
  ];
  
  // Keywords that indicate actual syllabus content (POSITIVE signals)
  const contentKeywords = [
    // Generic syllabus terms
    'syllabus', 'topics', 'course content', 'curriculum', 'course outline',
    'unit', 'chapter', 'section', 'module', 'lesson', 'part',
    
    // Common subjects (STEM)
    'physics', 'chemistry', 'biology', 'mathematics', 'math', 'maths',
    'botany', 'zoology', 'organic', 'inorganic', 'physical', 'analytical',
    'algebra', 'geometry', 'calculus', 'trigonometry', 'statistics',
    
    // Humanities & Social Sciences
    'history', 'geography', 'economics', 'political science', 'sociology',
    'psychology', 'philosophy', 'literature', 'english', 'hindi',
    'language', 'grammar', 'comprehension',
    
    // Professional/Technical subjects
    'engineering', 'computer science', 'programming', 'software',
    'management', 'business', 'accounting', 'finance', 'commerce',
    'law', 'legal', 'medicine', 'anatomy', 'physiology',
    
    // Structure indicators
    'objectives', 'learning outcomes', 'competencies', 'skills',
    'paper i', 'paper ii', 'paper-', 'section a', 'section b', 'section-'
  ];
  
  // Numbered/structured content patterns (strong positive signals)
  const structuredPatterns = [
    /^\d+\.\s+[A-Z]/,           // "1. Physics"
    /^[A-Z]\.\s+[A-Z]/,         // "A. Mechanics"
    /^unit\s+\d+/i,             // "Unit 1"
    /^chapter\s+\d+/i,          // "Chapter 1"
    /^section\s+[A-Z0-9]/i,     // "Section A"
    /^paper\s+[IVX\d]/i,        // "Paper I"
    /^module\s+\d+/i,           // "Module 1"
    /^\([a-z0-9]+\)\s+[A-Z]/    // "(a) Topic"
  ];
  
  let bestStartIndex = 0;
  let highestScore = 0;
  
  // Analyze first 150 lines (covers ~3-5 pages typically)
  const scanLimit = Math.min(lines.length, 150);
  
  for (let i = 0; i < scanLimit; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    // Skip very short or empty lines
    if (line.length < 5) continue;
    
    let score = 0;
    
    // POSITIVE SCORING
    // Check for content keywords
    contentKeywords.forEach(keyword => {
      if (lowerLine.includes(keyword)) {
        score += 3; // Strong positive signal
      }
    });
    
    // Check for structured patterns (very strong signal)
    structuredPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        score += 10; // Very strong positive signal
      }
    });
    
    // Line starts with capital letter and has topic-like structure
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*[-:]/.test(line)) {
      score += 5; // "Physics - Mechanics" pattern
    }
    
    // Contains multiple capital words (likely subject/topic names)
    const capitalWords = line.match(/\b[A-Z][a-z]+/g) || [];
    if (capitalWords.length >= 2) {
      score += 2;
    }
    
    // NEGATIVE SCORING
    // Check for intro keywords (reduce score)
    introKeywords.forEach(keyword => {
      if (lowerLine.includes(keyword)) {
        score -= 2; // Negative signal
      }
    });
    
    // Too many numbers (likely page numbers, dates, etc.)
    const numberCount = (line.match(/\d+/g) || []).length;
    if (numberCount > 3) {
      score -= 1;
    }
    
    // Contains URLs, emails, phone numbers (definitely not content)
    if (/https?:\/\/|www\.|@|tel:|phone/i.test(lowerLine)) {
      score -= 5;
    }
    
    // Update best starting point if this line has higher score
    if (score > highestScore && score >= 8) {
      highestScore = score;
      bestStartIndex = i;
    }
  }
  
  // Decision logic
  if (bestStartIndex > 0 && highestScore >= 8) {
    const skippedLines = bestStartIndex;
    const skippedChars = lines.slice(0, bestStartIndex).join('\n').length;
    console.log(`📄 Smart skip: removed ${skippedLines} intro lines (${skippedChars} chars) - score: ${highestScore}`);
    return lines.slice(bestStartIndex).join('\n');
  } else if (bestStartIndex === 0 && highestScore >= 5) {
    console.log(`📄 Content starts immediately (no intro pages) - score: ${highestScore}`);
    return text;
  } else {
    console.log(`📄 Could not reliably detect content start, using full text`);
    return text;
  }
}

/**
 * Extracts topics from syllabus text using AI
 * @param syllabusText - The extracted text from syllabus PDF
 * @param examType - The exam type (NEET, JEE, UPSC, etc.)
 * @returns Structured list of topics and subtopics
 */
export async function extractSyllabusTopics(
  syllabusText: string,
  examType: string
): Promise<SyllabusTopicExtractionResult> {
  try {
    // Step 1: Preprocess to skip intro pages and focus on actual content
    const cleanedText = preprocessSyllabusText(syllabusText);
    
    // Step 2: Keep full text for Gemini 2.5 Flash (supports up to 1M tokens = ~4M chars)
    // For typical syllabi (20-50k chars), send the complete document to extract all topics
    // Only truncate extremely large documents (>100k chars) to stay within reasonable limits
    const truncatedText = cleanedText.length > 100000 
      ? cleanedText.substring(0, 100000) + '\n\n[Content truncated - document exceeds 100k chars]'
      : cleanedText;
    
    console.log(`📝 Sending ${truncatedText.length} chars to AI for topic extraction`);

    // Get current year for context
    const currentYear = new Date().getFullYear();

    const prompt = `You are an expert at extracting syllabus topics from official exam documents.

**EXAM CONTEXT**: This is the official ${examType} syllabus for ${currentYear}. The student is preparing for the ${examType} exam.

**YOUR TASK**: Extract the EXACT syllabus topics as they appear in the official ${examType} curriculum for ${currentYear}.

**SYLLABUS DOCUMENT**:
"""
${truncatedText}
"""

**CRITICAL REQUIREMENTS**:

1. **Be Exam-Specific**: This is for ${examType} preparation. Only extract topics that are part of the official ${examType} syllabus.

2. **Current Year Topics**: Focus on topics relevant to ${currentYear}. Skip outdated information, introductory pages, or administrative details.

3. **Identify Official Topics**: Look for subject sections, main topics, units, chapters, or topic headings in the document.

4. **Skip Non-Topics**:
   - Skip: Cover pages, instructions, exam patterns, marking schemes
   - Skip: Administrative info, dates, eligibility criteria
   - Skip: "Introduction", "Overview", "Important Notes"

5. **Extract Clean Topics**: 
   - Format: "Subject - Topic Name"
   - Include main topics and important subtopics
   - Keep topic names concise and official

6. **JSON Output**: Return ONLY valid JSON (no markdown, no explanation):
{
  "topics": ["Subject - Main Topic 1", "Subject - Main Topic 2"],
  "subtopics": {
    "Subject - Main Topic 1": ["Subtopic 1", "Subtopic 2"],
    "Subject - Main Topic 2": ["Subtopic A", "Subtopic B"]
  },
  "sections": ["Section 1", "Section 2"]
}

Return ONLY the JSON object, no additional text or explanation.`;

    // Use Gemini 2.5 Flash Lite (lighter model, less overloaded, faster)
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.3, // Lower temperature for more consistent extraction
        maxOutputTokens: 16384, // Increased for larger syllabi with many topics
        responseMimeType: 'application/json', // Force JSON response
      }
    });

    const responseText = (result.text || '').trim();
    
    console.log(`✓ AI response received (${responseText.length} chars)`);
    
    // Parse JSON response (responseMimeType: 'application/json' means it's already JSON)
    let parsed;
    try {
      // Try direct JSON parse first (since we set responseMimeType to json)
      parsed = JSON.parse(responseText);
      console.log(`✓ Parsed JSON directly`);
    } catch (directParseError: any) {
      console.warn(`Direct JSON parse failed: ${directParseError.message}`);
      
      // Fallback: Check for markdown code blocks
      try {
        let jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
        if (jsonMatch) {
          console.log(`✓ Found JSON in markdown code block`);
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          // Last resort: try to find plain JSON object
          jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            console.log(`✓ Found plain JSON in response`);
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON pattern found in response');
          }
        }
      } catch (fallbackError: any) {
        console.error('❌ No valid JSON found in AI response:', responseText.substring(0, 500) + '...');
        console.error('Parse error:', fallbackError.message);
        return {
          success: false,
          topics: [],
          error: 'Failed to extract topics - invalid AI response format',
          extractedAt: new Date().toISOString()
        };
      }
    }
    
    // Validate the response structure
    if (!parsed.topics || !Array.isArray(parsed.topics)) {
      console.error('Invalid topics structure:', parsed);
      return {
        success: false,
        topics: [],
        error: 'Invalid topics structure in AI response',
        extractedAt: new Date().toISOString()
      };
    }

    // Remove duplicates and clean up
    const uniqueTopics = [...new Set(parsed.topics)]
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

    return {
      success: true,
      topics: uniqueTopics,
      subtopics: parsed.subtopics || {},
      sections: parsed.sections || [],
      extractedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error extracting syllabus topics:', error);
    return {
      success: false,
      topics: [],
      error: error.message || 'Unknown error during topic extraction',
      extractedAt: new Date().toISOString()
    };
  }
}

/**
 * Fallback: Extract topics using simple pattern matching
 * Used when AI extraction fails
 */
export function extractTopicsWithPatterns(syllabusText: string, examType: string): string[] {
  const topics = new Set<string>();
  const lines = syllabusText.split('\n');

  // Common exam-specific patterns
  const patterns: Record<string, RegExp[]> = {
    'NEET': [
      /^(\w+)\s*-\s*(.+)$/i, // "Physics - Mechanics"
      /^\d+\.\s*([A-Z][^.]+)$/i, // "1. PHYSICS"
      /^Unit\s+\d+:?\s*(.+)$/i, // "Unit 1: Thermodynamics"
    ],
    'JEE': [
      /^(\w+)\s*-\s*(.+)$/i,
      /^\d+\.\s*([A-Z][^.]+)$/i,
      /^Chapter\s+\d+:?\s*(.+)$/i,
    ],
    'UPSC': [
      /^Paper\s+[IVX]+:?\s*(.+)$/i,
      /^(\w+)\s*-\s*(.+)$/i,
      /^\d+\.\s*([A-Z][^.]+)$/i,
    ],
    'default': [
      /^(\w+)\s*-\s*(.+)$/i,
      /^\d+\.\s*([A-Z][^.]+)$/i,
      /^Unit\s+\d+:?\s*(.+)$/i,
      /^Chapter\s+\d+:?\s*(.+)$/i,
      /^Section\s+[A-Z]:?\s*(.+)$/i,
    ]
  };

  const examPatterns = patterns[examType] || patterns['default'];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 100) continue;

    for (const pattern of examPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const topic = match[1] || match[0];
        if (topic && topic.length > 3) {
          topics.add(topic.trim());
        }
      }
    }
  }

  return Array.from(topics).slice(0, 200); // Limit to 200 topics (full syllabus)
}

/**
 * Create intelligent chunks for syllabus based on extracted topics
 * Each chunk represents a topic or group of related content
 * @param fullText - The complete syllabus text
 * @param topics - Extracted topics from AI
 * @returns Array of topic-based chunks with metadata
 */
export function createTopicBasedChunks(
  fullText: string,
  topics: string[]
): Array<{ text: string; metadata: { topic: string; chunkIndex: number } }> {
  
  if (topics.length === 0) {
    // Fallback to single chunk if no topics
    console.log('⚠️ No topics provided, creating single chunk');
    return [{
      text: fullText.substring(0, 10000), // Max 10K for single chunk
      metadata: { topic: 'Full Syllabus', chunkIndex: 0 }
    }];
  }
  
  console.log(`📚 Creating topic-based chunks for ${topics.length} topics`);
  
  const chunks: Array<{ text: string; metadata: { topic: string; chunkIndex: number } }> = [];
  const lowerText = fullText.toLowerCase();
  
  // Try to find content sections for each topic
  topics.forEach((topic, index) => {
    // Extract the main keyword from topic (e.g., "Physics - Mechanics" → "mechanics")
    const keywords = topic.toLowerCase()
      .split(/[-:,]/)
      .map(s => s.trim())
      .filter(s => s.length > 3);
    
    // Find where this topic appears in the text
    let bestMatchPos = -1;
    let bestKeyword = '';
    
    for (const keyword of keywords) {
      const pos = lowerText.indexOf(keyword);
      if (pos !== -1 && (bestMatchPos === -1 || pos < bestMatchPos)) {
        bestMatchPos = pos;
        bestKeyword = keyword;
      }
    }
    
    if (bestMatchPos !== -1) {
      // Extract context around the keyword (±2000 chars)
      const start = Math.max(0, bestMatchPos - 500);
      const end = Math.min(fullText.length, bestMatchPos + 2500);
      const chunkText = fullText.substring(start, end).trim();
      
      chunks.push({
        text: chunkText,
        metadata: {
          topic: topic,
          chunkIndex: index
        }
      });
      
      console.log(`  ✓ Chunk ${index + 1}: "${topic}" (${chunkText.length} chars, keyword: "${bestKeyword}")`);
    } else {
      // Topic not found in text, create a minimal chunk with topic name
      console.log(`  ⚠️ Topic "${topic}" not found in text, creating placeholder`);
      chunks.push({
        text: `Topic: ${topic}\n\n(Content to be covered in this section)`,
        metadata: {
          topic: topic,
          chunkIndex: index
        }
      });
    }
  });
  
  // If no chunks were created, add full text as fallback
  if (chunks.length === 0) {
    console.log('⚠️ No topic-based chunks created, using full text');
    chunks.push({
      text: fullText.substring(0, 10000),
      metadata: { topic: 'Full Syllabus', chunkIndex: 0 }
    });
  }
  
  console.log(`✓ Created ${chunks.length} topic-based chunks`);
  console.log(`  Average chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length)} chars`);
  
  return chunks;
}
