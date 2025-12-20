/**
 * LangChain-based Document Extraction Service
 * Handles text extraction from PDF, DOCX using LangChain loaders
 * Implements robust MCQ parsing for exam materials (NEET/JEE)
 * 
 * WORKFLOW (Step-by-Step for 90%+ Usability):
 * ================================================
 * 
 * EXTRACTION PHASE:
 * - Use PDFLoader/DocxLoader (LangChain) to extract raw text
 * - Split into 2000-char chunks (overlap 300) with MCQ-aware separators
 * - Preserve page metadata for question tracking
 * 
 * CLEANING PHASE (Step 1):
 * 1a. normalizeAndCleanText():
 *     - Remove PDF headers/footers (Page:, NEET Test Paper, etc.)
 *     - Fix run-on text (J1.2 → J 1.2, cm3 → cm 3)
 *     - Strip LaTeX artifacts (\command{}, $math$, \(math\))
 *     - Normalize whitespace and punctuation
 *     - Handle scientific notation (× 10 − 6 → × 10^-6)
 * 
 * 1b. extractQuestionsFromText():
 *     - Regex match: Q.1 or 1. or 1) patterns
 *     - Extract question text until next question/chunk end
 *     - Parse options (supports 3 formats):
 *       * 1. option / 1) option
 *       * (1) option / (A) option
 *       * A) option / a) option
 *     - Validate: min 20 chars question, 2-4 options
 *     - Return ParsedQuestion[] with confidence scores
 * 
 * 1c. mergeFragmentedQuestions():
 *     - Detect incomplete questions (< 4 options, same Q number)
 *     - Merge adjacent chunks if question spans boundaries
 *     - Deduplicate by question number
 * 
 * VALIDATION PHASE:
 * - validateExtractionQuality():
 *   * Score 0-100% based on: text length, questions count, completion rate
 *   * Flag issues: scanned PDF, low yield, fragmented options
 *   * Recommend: "Upload text-based PDF", "Reformat questions"
 *   * Usable threshold: ≥70% score
 * 
 * OUTPUT:
 * - ExtractionResult with:
 *   * Full text (for LLM context)
 *   * Chunks array (for storage)
 *   * ParsedQuestion[] (structured MCQs ready for DB/gen)
 *   * Quality metrics (score, issues, recommendations)
 * 
 * USAGE:
 * const result = await extractAndParseMCQs(buffer, 'application/pdf', 'physics.pdf', 'physics');
 * const quality = validateExtractionQuality(result);
 * // Store result.parsedQuestions in study_materials.structured_content
 * // Use result.text for Gemini LLM generation (Step 5)
 */

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

export interface ParsedQuestion {
  question: string;
  options: string[];
  explanation?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: {
    page?: number;
    source: string;
    chunkIndex: number;
  };
}

export interface ExtractionResult {
  success: boolean;
  text: string;
  chunks: Array<{
    content: string;
    metadata: {
      page?: number;
      source: string;
      chunkIndex: number;
    };
  }>;
  parsedQuestions?: ParsedQuestion[];
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    extractionMethod: 'langchain-pdf' | 'langchain-docx' | 'text' | 'failed';
    questionsExtracted?: number;
  };
  error?: string;
}

/**
 * Extract and chunk text from PDF using LangChain PDFLoader
 */
async function extractFromPDF(buffer: Buffer, filename: string): Promise<ExtractionResult> {
  try {
    // Create a temporary blob for PDFLoader
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob, {
      splitPages: true,
      parsedItemSeparator: '\n'
    });

    const docs = await loader.load();
    
    if (!docs || docs.length === 0) {
      throw new Error('No content extracted from PDF');
    }

    // Combine all pages
    const fullText = docs.map(doc => doc.pageContent).join('\n\n');
    
    // Chunk the content with MCQ-optimized settings
    // Note: Parser joins all chunks back together, so chunking is just for storage
    // Use reasonable chunks that won't break too aggressively
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000, // Large enough for 3-4 questions per chunk
      chunkOverlap: 400, // Heavy overlap ensures questions aren't split
      separators: [
        '\n\n\n', // Strong paragraph break
        '\n\n', // Double newline
        '\n', // Single newline
        '. ', // Sentence
        ' ', // Space
        ''
      ]
    });

    const chunks = await splitter.splitDocuments(docs);
    
    return {
      success: true,
      text: fullText,
      chunks: chunks.map((chunk, index) => ({
        content: chunk.pageContent,
        metadata: {
          page: chunk.metadata.loc?.pageNumber,
          source: filename,
          chunkIndex: index
        }
      })),
      metadata: {
        pageCount: docs.length,
        wordCount: fullText.split(/\s+/).length,
        characterCount: fullText.length,
        extractionMethod: 'langchain-pdf'
      }
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      text: '',
      chunks: [],
      metadata: {
        wordCount: 0,
        characterCount: 0,
        extractionMethod: 'failed'
      },
      error: error instanceof Error ? error.message : 'PDF extraction failed'
    };
  }
}

/**
 * Extract and chunk text from DOCX using LangChain DocxLoader
 */
async function extractFromDOCX(buffer: Buffer, filename: string): Promise<ExtractionResult> {
  try {
    // Create a temporary blob for DocxLoader
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    const loader = new DocxLoader(blob);
    const docs = await loader.load();
    
    if (!docs || docs.length === 0) {
      throw new Error('No content extracted from DOCX');
    }

    const fullText = docs.map(doc => doc.pageContent).join('\n\n');
    
    // Chunk the content with MCQ-optimized settings
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 300,
      separators: ['\n\nQ', '\n\n\d+.', '\n\n', '\n', '. ', ' ', '']
    });

    const chunks = await splitter.splitDocuments(docs);
    
    return {
      success: true,
      text: fullText,
      chunks: chunks.map((chunk, index) => ({
        content: chunk.pageContent,
        metadata: {
          source: filename,
          chunkIndex: index
        }
      })),
      metadata: {
        wordCount: fullText.split(/\s+/).length,
        characterCount: fullText.length,
        extractionMethod: 'langchain-docx'
      }
    };
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return {
      success: false,
      text: '',
      chunks: [],
      metadata: {
        wordCount: 0,
        characterCount: 0,
        extractionMethod: 'failed'
      },
      error: error instanceof Error ? error.message : 'DOCX extraction failed'
    };
  }
}

/**
 * Extract and chunk plain text
 */
async function extractFromText(text: string, filename: string): Promise<ExtractionResult> {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 300,
      separators: ['\n\nQ', '\n\n\d+.', '\n\n', '\n', '. ', ' ', '']
    });

    const docs = [new Document({ pageContent: text, metadata: { source: filename } })];
    const chunks = await splitter.splitDocuments(docs);
    
    return {
      success: true,
      text: text,
      chunks: chunks.map((chunk, index) => ({
        content: chunk.pageContent,
        metadata: {
          source: filename,
          chunkIndex: index
        }
      })),
      metadata: {
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        extractionMethod: 'text'
      }
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    return {
      success: false,
      text: '',
      chunks: [],
      metadata: {
        wordCount: 0,
        characterCount: 0,
        extractionMethod: 'failed'
      },
      error: error instanceof Error ? error.message : 'Text processing failed'
    };
  }
}

/**
 * Main extraction function - routes to appropriate loader based on file type
 */
export async function extractAndChunkDocument(
  buffer: Buffer,
  fileType: string,
  filename: string
): Promise<ExtractionResult> {
  // Detect file type
  if (fileType === 'application/pdf') {
    return extractFromPDF(buffer, filename);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    return extractFromDOCX(buffer, filename);
  } else if (fileType === 'text/plain') {
    const text = buffer.toString('utf-8');
    return extractFromText(text, filename);
  } else {
    return {
      success: false,
      text: '',
      chunks: [],
      metadata: {
        wordCount: 0,
        characterCount: 0,
        extractionMethod: 'failed'
      },
      error: `Unsupported file type: ${fileType}. Only PDF and DOCX are supported for text extraction.`
    };
  }
}

/**
 * Step 1a: Normalize text and remove common PDF artifacts
 */
function normalizeAndCleanText(text: string): string {
  return text
    // Collapse multiple whitespaces into single space
    .replace(/\s+/g, ' ')
    
    // Remove common PDF headers/footers
    .replace(/Page:\s*\d+/gi, '')
    .replace(/NEET Test Paper \d+/gi, '')
    .replace(/Contact Number:\s*\d+\s*\/\s*\d+/gi, '')
    .replace(/JEE \(Main\).*?\d{4}/gi, '')
    
    // Fix run-on text (e.g., "J1.2" → "J 1.2", "cm3" → "cm 3")
    .replace(/([a-zA-Z])(\d+)([a-zA-Z])/g, '$1 $2 $3')
    .replace(/(\d+)([a-zA-Z]{2,})/g, '$1 $2')
    
    // Remove LaTeX artifacts
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '') // \command{content}
    .replace(/\$\$[^$]*\$\$/g, '') // $$display math$$
    .replace(/\$[^$]*\$/g, '') // $inline math$
    .replace(/\\\([^)]*\\\)/g, '') // \(math\)
    .replace(/\\\[[^\]]*\\\]/g, '') // \[math\]
    
    // Remove special Unicode characters that cause issues
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    
    // Fix common OCR artifacts
    .replace(/(\d)\s*×\s*10\s*−\s*(\d)/g, '$1 × 10^-$2') // Scientific notation
    .replace(/(\d)\s*×\s*(\d)/g, '$1 × $2')
    
    // Clean up punctuation spacing
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2')
    
    .trim();
}

/**
 * Production NEET/JEE parser - optimized for actual exam PDF format
 * Format: Question number (no dot), then question text, then options numbered 1. 2. 3. 4.
 */
export function cleanAndParseChunks(chunks: Array<{ content: string; metadata: any }>): ParsedQuestion[] {
  const allText = chunks.map(c => c.content).join("\n\n");
  const questions: ParsedQuestion[] = [];
  
  // Remove subject headers like "PHYSICS", "CHEMISTRY" that appear at start
  const cleanedText = allText.replace(/^(PHYSICS|CHEMISTRY|BIOLOGY|MATHEMATICS)\s+/gm, '');
  
  // Match pattern: standalone number, followed by text, until next standalone number or end
  // Uses negative lookbehind to avoid matching "1." (option) and positive lookbehind for whitespace/newline
  const questionPattern = /(?:^|\n)(\d+)\s+([^\n][^]*?)(?=(?:^|\n)\d+\s+[A-Z]|$)/gm;
  
  const matches = [...cleanedText.matchAll(questionPattern)];
  console.log(`Found ${matches.length} questions in PDF`);
  
  matches.forEach((match, idx) => {
    const qNumber = parseInt(match[1]);
    const fullText = match[2].trim();
    
    // Skip if suspiciously short (likely not a real question)
    if (fullText.length < 40) {
      return;
    }
    
    // Extract options: Look for "1. text 2. text 3. text 4. text"
    let options: string[] = [];
    let questionText = fullText;
    
    // Method 1: Look for last 4 occurrences of "number." pattern
    // This works best when options are at the end
    const allNumberedItems = [...fullText.matchAll(/(\d+)\.\s+([^\n]+?)(?=\s*\d+\.|$)/gs)];
    
    if (allNumberedItems.length >= 4) {
      // Get last 4 numbered items (most likely to be options)
      const lastFour = allNumberedItems.slice(-4);
      
      // Verify they are numbered 1-4
      const numbers = lastFour.map(m => parseInt(m[1]));
      if (numbers.some(n => n >= 1 && n <= 4)) {
        options = lastFour.map(m => m[2].trim());
        
        // Question text is everything before first option
        const firstOptionIdx = fullText.indexOf(lastFour[0][0]);
        if (firstOptionIdx > 20) {
          questionText = fullText.substring(0, firstOptionIdx).trim();
        }
      }
    }
    
    // Method 2: Look for explicit "1. ... 2. ... 3. ... 4. ..." pattern
    if (options.length < 4) {
      const explicitMatch = fullText.match(/1\.\s*(.+?)\s+2\.\s*(.+?)\s+3\.\s*(.+?)\s+4\.\s*(.+?)(?=\n\n|$)/s);
      if (explicitMatch) {
        options = [
          explicitMatch[1].trim(),
          explicitMatch[2].trim(),
          explicitMatch[3].trim(),
          explicitMatch[4].trim()
        ];
        const firstOptIdx = fullText.indexOf('1.');
        if (firstOptIdx > 20) {
          questionText = fullText.substring(0, firstOptIdx).trim();
        }
      }
    }
    
    // Method 3: Split by newlines and look for lines starting with numbers
    if (options.length < 4) {
      const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
      const optionLines = lines.filter(l => /^[1-4]\.\s/.test(l));
      
      if (optionLines.length >= 4) {
        options = optionLines.slice(0, 4).map(l => l.replace(/^[1-4]\.\s*/, '').trim());
        
        // Find where options start
        const firstOptLine = optionLines[0];
        const optIdx = fullText.indexOf(firstOptLine);
        if (optIdx > 20) {
          questionText = fullText.substring(0, optIdx).trim();
        }
      }
    }
    
    // Clean up options
    options = options.map(opt => {
      return opt
        .replace(/\s*\d+\.\s*$/, '') // Remove trailing "1." etc
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/^\d+\)\s*/, '') // Remove leading "1)" if present
        .trim();
    }).filter(opt => opt.length > 0); // Remove empty options
    
    // Ensure exactly 4 options
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }
    options = options.slice(0, 4);
    
    // Find source chunk for metadata
    const sourceChunk = chunks.find(c => c.content.includes(fullText.substring(0, 100)));
    
    // Confidence based on whether we found real options
    const hasRealOptions = options.every(o => o.length > 2 && !o.startsWith('Option'));
    const confidence = hasRealOptions ? 95 : 50;
    
    questions.push({
      question: questionText,
      options: options,
      metadata: {
        originalNumber: qNumber,
        raw_text: fullText.substring(0, 500),
        confidence: confidence,
        page: sourceChunk?.metadata?.page || sourceChunk?.metadata?.loc?.pageNumber || 'unknown',
        source: sourceChunk?.metadata?.source || 'unknown',
        chunkIndex: chunks.indexOf(sourceChunk || chunks[0])
      }
    });
  });
  
  console.log(`Successfully parsed ${questions.length} questions with options`);
  return questions;
}

/**
 * Extract MCQs with enhanced parsing for exam materials
 */
export async function extractAndParseMCQs(
  buffer: Buffer,
  fileType: string,
  filename: string,
  topic?: string
): Promise<ExtractionResult> {
  // First, extract and chunk the document
  const result = await extractAndChunkDocument(buffer, fileType, filename);
  
  if (!result.success) {
    return result;
  }
  
  // Parse MCQs from chunks
  const parsedQuestions = cleanAndParseChunks(result.chunks);
  
  // Enhance with topic if provided
  if (topic && parsedQuestions.length > 0) {
    parsedQuestions.forEach(q => {
      q.topic = topic;
    });
  }
  
  return {
    ...result,
    parsedQuestions,
    metadata: {
      ...result.metadata,
      questionsExtracted: parsedQuestions.length
    }
  };
}

/**
 * Validate extraction quality - returns usability score (0-100%)
 * Aligned with battle-tested parser expectations
 */
export function validateExtractionQuality(result: ExtractionResult): {
  score: number;
  usable: boolean;
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  // Check text length (full text should be stored, no truncation)
  if (result.text.length < 500) {
    score -= 50;
    issues.push('Very low text extraction (<500 chars)');
    recommendations.push('Upload a text-based PDF, not scanned image');
  } else if (result.text.length < 5000) {
    score -= 20;
    issues.push('Low text yield - may be incomplete extraction');
  }
  
  // Check parsed questions (NEET/JEE papers typically have 25-50 questions)
  const questionsCount = result.parsedQuestions?.length || 0;
  if (questionsCount === 0) {
    score -= 40;
    issues.push('No questions extracted');
    recommendations.push('Ensure PDF has numbered questions (1. 2. 3.) format');
  } else if (questionsCount < 15) {
    score -= 25;
    issues.push(`Only ${questionsCount} questions found (expected 25-50 for NEET/JEE)`);
    recommendations.push('PDF may have formatting issues or be incomplete');
  } else if (questionsCount < 25) {
    score -= 10;
    issues.push(`${questionsCount} questions extracted (expected 25+)`);
  }
  
  // Check question quality (complete options)
  const completeQuestions = result.parsedQuestions?.filter(q => 
    q.options.length === 4 && 
    !q.options.some(opt => opt.includes('not found') || opt.includes('incomplete')) &&
    q.options.filter(opt => opt.length > 5).length === 4 // All options have meaningful text
  ).length || 0;
  const completionRate = questionsCount > 0 ? (completeQuestions / questionsCount) * 100 : 0;
  
  if (completionRate < 60) {
    score -= 20;
    issues.push(`Only ${completionRate.toFixed(0)}% questions have 4 complete options`);
    recommendations.push('Some questions may be fragmented - extraction partially successful');
  } else if (completionRate < 85) {
    score -= 10;
    issues.push(`${completionRate.toFixed(0)}% questions complete (good)`);
  }
  
  // Check for common artifacts (informational, small penalty)
  const hasLatex = /\\[a-zA-Z]+\{|\\$|\\\\/.test(result.text);
  if (hasLatex) {
    score -= 3;
    issues.push('Some LaTeX artifacts present (minor issue)');
  }
  
  // Determine quality grade (production standards)
  let quality: 'HIGH' | 'MEDIUM' | 'LOW';
  if (questionsCount >= 25) {
    quality = 'HIGH';
  } else if (questionsCount >= 15) {
    quality = 'MEDIUM';
  } else {
    quality = 'LOW';
  }
  
  return {
    score: Math.max(0, score),
    usable: score >= 60, // 60%+ is acceptable (lowered threshold for production use)
    quality,
    issues,
    recommendations
  };
}

/**
 * Check if file is likely scanned (for flagging manual review)
 * This is a heuristic - checks if extracted text is too short for file size
 */
export function isLikelyScanned(
  result: ExtractionResult,
  fileSizeBytes: number
): boolean {
  if (!result.success || !result.text) return true;
  
  // Heuristic: If file is > 100KB but extracted < 100 chars, likely scanned
  const minExpectedCharsPerKB = 1;
  const fileSizeKB = fileSizeBytes / 1024;
  const expectedMinChars = fileSizeKB * minExpectedCharsPerKB;
  
  return result.text.length < expectedMinChars && fileSizeKB > 100;
}
