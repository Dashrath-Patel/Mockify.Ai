/**
 * PDF Text Extraction and Chunking System
 * 
 * Purpose: Extract raw text from PDFs (up to 10MB) and split into uniform chunks
 * Use Case: Works for ANY PDF type - resumes, textbooks, question papers, research papers
 * 
 * Flow:
 * 1. Extract raw text using LangChain PDF loader
 * 2. Split into uniform chunks (by character count)
 * 3. Generate embeddings for each chunk
 * 4. Store chunks + embeddings in database
 * 5. Search similar chunks to generate questions via LLM
 */

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Chunk metadata interface
 */
export interface TextChunk {
  text: string;           // Raw chunk text
  index: number;          // Chunk position (0, 1, 2...)
  start_char: number;     // Starting character position in original text
  end_char: number;       // Ending character position
  char_count: number;     // Number of characters in this chunk
  word_count: number;     // Number of words in this chunk
}

/**
 * Extract raw text from PDF file
 * Works for any PDF type - no formatting, just pure text extraction
 */
export async function extractRawTextFromPDF(fileBuffer: Buffer): Promise<string> {
  try {
    console.log('📄 Extracting raw text from PDF...');
    console.log(`   File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Create a temporary blob from buffer
    const blob = new Blob([fileBuffer as any], { type: 'application/pdf' });
    
    // Use LangChain PDF loader for reliable extraction
    const loader = new PDFLoader(blob, {
      splitPages: false, // Get all pages as one document
    });
    
    const docs = await loader.load();
    
    console.log(`   Loaded ${docs.length} document(s) from PDF`);
    
    // Combine all pages into single text
    const rawText = docs.map(doc => {
      const content = doc.pageContent || '';
      console.log(`   Page content length: ${content.length} chars`);
      return content;
    }).join('\n\n');
    
    console.log(`✓ Extracted ${rawText.length} characters from ${docs.length} pages`);
    
    // If extraction yielded very little text, provide helpful error
    if (rawText.length < 50) {
      console.error('⚠️  PDF extraction yielded minimal text');
      console.error('   This usually means:');
      console.error('   1. PDF contains scanned images (needs OCR)');
      console.error('   2. PDF is encrypted or password protected');
      console.error('   3. PDF has copy protection enabled');
      console.error('   4. PDF uses non-standard encoding');
      throw new Error(
        'PDF appears to contain scanned images or is protected. ' +
        'The file may need OCR (Optical Character Recognition) to extract text. ' +
        'Please try uploading a PDF with selectable text, or enable OCR processing.'
      );
    }
    
    return rawText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('scanned images') || error.message.includes('OCR')) {
        throw error; // Re-throw our custom error
      }
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    
    throw new Error('Failed to extract text from PDF - unknown error');
  }
}

/**
 * Split text into uniform chunks
 * Strategy: Fixed character size with overlap for context preservation
 * 
 * @param text - Raw extracted text
 * @param chunkSize - Characters per chunk (default: 1000)
 * @param overlap - Character overlap between chunks (default: 200)
 * @returns Array of text chunks with metadata
 */
export async function splitIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Promise<TextChunk[]> {
  try {
    console.log(`📊 Splitting ${text.length} chars into chunks (size: ${chunkSize}, overlap: ${overlap})...`);
    
    // Use LangChain's RecursiveCharacterTextSplitter
    // Tries to split on: paragraphs → sentences → words → characters
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunkSize,
      chunkOverlap: overlap,
      separators: ['\n\n', '\n', '. ', ' ', ''], // Priority order
    });
    
    const splitDocs = await splitter.createDocuments([text]);
    
    // Convert to our chunk format with metadata
    let currentPosition = 0;
    const chunks: TextChunk[] = splitDocs.map((doc, index) => {
      const chunkText = doc.pageContent;
      const charCount = chunkText.length;
      const wordCount = chunkText.split(/\s+/).filter(w => w.length > 0).length;
      
      // Find actual position in original text (approximate due to overlap)
      const startChar = currentPosition;
      const endChar = startChar + charCount;
      
      currentPosition = endChar - overlap; // Move forward minus overlap
      
      return {
        text: chunkText,
        index,
        start_char: startChar,
        end_char: endChar,
        char_count: charCount,
        word_count: wordCount,
      };
    });
    
    console.log(`✓ Created ${chunks.length} chunks`);
    console.log(`  Average chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.char_count, 0) / chunks.length)} chars`);
    
    return chunks;
  } catch (error) {
    console.error('Text splitting error:', error);
    throw new Error('Failed to split text into chunks');
  }
}

/**
 * Recommended chunk sizes for different use cases
 */
export const CHUNK_STRATEGIES = {
  // Small chunks - for precise search, good for Q&A
  SMALL: { size: 500, overlap: 100 },
  
  // Medium chunks - balanced, good for general purpose
  MEDIUM: { size: 1000, overlap: 200 },
  
  // Large chunks - more context, good for summarization
  LARGE: { size: 2000, overlap: 400 },
  
  // Embedding optimized - fits sentence-transformers model limits
  EMBEDDING: { size: 1500, overlap: 300 },
};

/**
 * Smart chunking that adapts to document size
 * Small docs: larger chunks, Large docs: smaller chunks
 */
export function getAdaptiveChunkSize(textLength: number): { size: number; overlap: number } {
  if (textLength < 5000) {
    // Very small document - use large chunks
    return CHUNK_STRATEGIES.LARGE;
  } else if (textLength < 50000) {
    // Medium document - use medium chunks
    return CHUNK_STRATEGIES.MEDIUM;
  } else {
    // Large document - use small chunks for better search granularity
    return CHUNK_STRATEGIES.SMALL;
  }
}

/**
 * Complete pipeline: Extract → Chunk → Return JSON
 * 
 * @param fileBuffer - PDF file as buffer
 * @param chunkStrategy - Optional chunk size strategy
 * @returns Array of chunks ready for embedding generation
 */
export async function extractAndChunkPDF(
  fileBuffer: Buffer,
  chunkStrategy?: { size: number; overlap: number }
): Promise<{ rawText: string; chunks: TextChunk[] }> {
  try {
    // Step 1: Extract raw text
    const rawText = await extractRawTextFromPDF(fileBuffer);
    
    if (!rawText || rawText.length < 50) {
      console.error(`⚠️  Extracted text too short: ${rawText?.length || 0} characters`);
      throw new Error(
        'PDF text extraction yielded insufficient content. ' +
        'This PDF may contain scanned images that require OCR processing. ' +
        'Please upload a PDF with selectable text.'
      );
    }
    
    // Step 2: Determine chunk size (adaptive or manual)
    const strategy = chunkStrategy || getAdaptiveChunkSize(rawText.length);
    
    console.log(`Using chunk strategy: ${strategy.size} chars with ${strategy.overlap} overlap`);
    
    // Step 3: Split into chunks
    const chunks = await splitIntoChunks(rawText, strategy.size, strategy.overlap);
    
    if (chunks.length === 0) {
      throw new Error('Failed to create text chunks from extracted content');
    }
    
    console.log(`✓ Successfully created ${chunks.length} chunks from ${rawText.length} characters`);
    
    return {
      rawText,
      chunks,
    };
  } catch (error) {
    console.error('Extract and chunk pipeline error:', error);
    
    // Re-throw with original error message if it's informative
    if (error instanceof Error && error.message.includes('scanned')) {
      throw error;
    }
    
    throw new Error(
      error instanceof Error 
        ? `PDF processing failed: ${error.message}`
        : 'Unknown error during PDF processing'
    );
  }
}

/**
 * Sanitize chunk text for database storage
 * Removes problematic characters that break PostgreSQL
 */
export function sanitizeChunkText(text: string): string {
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Control chars
    .replace(/\uFEFF/g, '') // BOM
    .replace(/[\u2028\u2029]/g, '') // Line/paragraph separators
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Example usage:
 * 
 * ```typescript
 * // 1. Extract and chunk
 * const { rawText, chunks } = await extractAndChunkPDF(pdfBuffer);
 * 
 * // 2. Generate embeddings for each chunk
 * const embeddings = await Promise.all(
 *   chunks.map(chunk => generateEmbedding(chunk.text))
 * );
 * 
 * // 3. Store in database
 * await supabase.from('document_chunks').insert(
 *   chunks.map((chunk, i) => ({
 *     document_id: docId,
 *     chunk_index: chunk.index,
 *     text: chunk.text,
 *     embedding: embeddings[i],
 *     metadata: { start_char: chunk.start_char, word_count: chunk.word_count }
 *   }))
 * );
 * 
 * // 4. Search similar chunks later
 * const queryEmbedding = await generateEmbedding("React developer");
 * const { data: similarChunks } = await supabase.rpc('search_chunks', {
 *   query_embedding: queryEmbedding,
 *   match_threshold: 0.5
 * });
 * 
 * // 5. Generate questions from similar chunks using LLM
 * const context = similarChunks.map(c => c.text).join('\n\n');
 * const questions = await generateQuestionsFromContext(context);
 * ```
 */
