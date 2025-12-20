/**
 * Gemini Embeddings Service
 * Uses Google's Gemini gemini-embedding-001 model (768 dimensions)
 * Free tier: 1500 requests/day - perfect for production use
 * Better quality and consistency with Gemini question generation
 */

import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Using Gemini's gemini-embedding-001 model (768 dimensions)
const EMBEDDING_MODEL = 'gemini-embedding-001';
const OUTPUT_DIMENSIONALITY = 768; // Recommended dimensions: 768, 1536, or 3072

// Free tier limits: 1500 requests/day (no hard enforcement, just for monitoring)
// gemini-embedding-001: supports up to 2,048 tokens input

/**
 * Generate embedding vector for text using Gemini API with retry logic
 * @param text - Text to embed (supports long texts)
 * @param taskType - Optional task type for optimized embeddings (e.g., 'RETRIEVAL_DOCUMENT', 'SEMANTIC_SIMILARITY')
 * @param retries - Number of retry attempts (default: 2, reduced to minimize quota usage)
 * @returns 768-dimensional normalized embedding vector
 */
export async function generateEmbedding(
  text: string, 
  taskType: string = 'RETRIEVAL_DOCUMENT',
  retries: number = 2
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  // Gemini gemini-embedding-001 supports up to 2,048 tokens
  const truncatedText = text.slice(0, 8000); // ~2000 tokens safety margin
  
  console.log(`Generating embedding via Gemini API (${truncatedText.length} chars, taskType: ${taskType})...`);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await genAI.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: truncatedText,
        config: {
          taskType: taskType,
          outputDimensionality: OUTPUT_DIMENSIONALITY
        }
      });
      
      // Extract embedding values from response
      const embeddingArray = result.embeddings?.[0]?.values || (result as any).values;
      
      if (!embeddingArray || embeddingArray.length === 0) {
        throw new Error('Empty embedding returned from Gemini');
      }
      
      // Normalize embeddings for dimensions other than 3072 (per Gemini docs)
      const normalizedEmbedding = normalizeEmbedding(embeddingArray);
      
      console.log(`✓ Embedding generated and normalized (${normalizedEmbedding.length} dimensions)`);
      
      return normalizedEmbedding;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log attempt failure
      console.warn(`⚠️ Attempt ${attempt}/${retries} failed:`, error?.message || error);
      
      // Don't retry on certain errors
      if (error?.message?.includes('API key') || 
          error?.message?.includes('unauthorized') ||
          error?.message?.includes('permission denied')) {
        throw new Error('Invalid Gemini API key or insufficient permissions');
      }
      
      // Don't retry on quota exhaustion - fail fast
      if (error?.message?.includes('429') || 
          error?.message?.includes('quota') || 
          error?.message?.includes('RESOURCE_EXHAUSTED')) {
        console.error('⚠️ API quota exhausted - stopping retries');
        throw error; // Re-throw to let caller handle it
      }
      
      // If not last attempt, wait before retrying with exponential backoff
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s (max 5s)
        console.log(`   Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All retries failed
  console.error('❌ All retry attempts failed for Gemini embedding');
  throw new Error(
    `Failed to generate embedding after ${retries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Generate embeddings for multiple texts in batch with rate limiting
 * Processes chunks sequentially with delays to avoid overwhelming the API
 * Gemini has a rate limit of 1500 requests/day on free tier
 * @param texts - Array of texts to embed
 * @param taskType - Task type for optimized embeddings (default: 'RETRIEVAL_DOCUMENT')
 */
export async function generateEmbeddings(
  texts: string[], 
  taskType: string = 'RETRIEVAL_DOCUMENT'
): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    throw new Error('Texts array cannot be empty');
  }

  console.log(`Generating ${texts.length} embeddings via Gemini API (taskType: ${taskType})...`);

  const embeddings: number[][] = [];
  const batchSize = 2; // Process 2 at a time to avoid rate limits
  const delayBetweenBatches = 3000; // 3 second delay between batches

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} items)...`);
    
    try {
      // Process batch in parallel
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateEmbedding(text, taskType))
      );
      
      embeddings.push(...batchEmbeddings);
      console.log(`✓ Batch complete (${embeddings.length}/${texts.length} total)`);
      
      // Delay between batches to avoid rate limiting (except for last batch)
      if (i + batchSize < texts.length) {
        console.log(`   Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    } catch (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      throw new Error(
        `Failed at batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  console.log(`✅ Generated all ${embeddings.length} embeddings successfully`);
  return embeddings;
}

/**
 * Format material text for embedding generation
 * Combines metadata with content for better semantic search
 */
export function formatMaterialForEmbedding(material: {
  topic?: string;
  exam_type?: string;
  text?: string;
}): string {
  const parts: string[] = [];
  
  if (material.exam_type) {
    parts.push(`Exam Type: ${material.exam_type}`);
  }
  
  if (material.topic) {
    parts.push(`Topic: ${material.topic}`);
  }
  
  if (material.text) {
    parts.push(`Content: ${material.text}`);
  }
  
  return parts.join('\n\n').trim();
}

/**
 * Normalize embedding vector to unit length
 * Required for dimensions other than 3072 per Gemini documentation
 * Normalized embeddings produce more accurate semantic similarity
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < embedding.length; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm);
  
  if (norm === 0) {
    console.warn('Warning: Zero norm embedding, returning original');
    return embedding;
  }
  
  return embedding.map(val => val / norm);
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Used for comparing similarity between query and stored embeddings
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar items from a list based on embedding similarity
 */
export function findMostSimilar(
  queryEmbedding: number[],
  items: Array<{ embedding: number[]; data: any }>,
  topK: number = 5
): Array<{ similarity: number; data: any }> {
  const similarities = items.map(item => ({
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
    data: item.data
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Extract key phrases and content from text for better embeddings
 * Handles large documents by extracting important terms
 */
export async function extractKeyContent(text: string, maxLength: number = 1900): Promise<string> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // For shorter texts, return as-is with basic cleanup
    if (text.length <= maxLength) {
      return text;
    }

    console.log(`Extracting key content from ${text.length} chars...`);
    
    // Extract important terms from text
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    const wordFreq = new Map<string, number>();
    words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
    
    // Get top terms (frequency 2-15 for large docs)
    const importantWords = Array.from(wordFreq.entries())
      .filter(([_, freq]) => freq >= 2 && freq <= 15)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 100)
      .map(([word]) => word)
      .join(' ');
    
    // Combine: First part of text + Important terms
    const firstPart = text.slice(0, Math.floor(maxLength * 0.7));
    const combined = `${firstPart} ${importantWords}`;
    
    console.log(`✓ Extracted key content (${combined.length} chars)`);
    return combined.slice(0, maxLength);
  } catch (error) {
    console.error('Key content extraction error:', error);
    // Fallback: Just return truncated text
    return text.slice(0, maxLength);
  }
}

/**
 * Batch embed multiple chunks with progress tracking
 * Optimized for large-scale document processing
 * Uses RETRIEVAL_DOCUMENT task type for optimal search performance
 */
export async function batchEmbedChunks(
  chunks: Array<{ chunk_text: string; chunk_index: number }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ chunk_index: number; embedding: number[] }>> {
  console.log(`Starting batch embedding for ${chunks.length} chunks...`);
  console.log(`⚠️ Processing sequentially with 2s delays to avoid rate limits`);
  
  const results: Array<{ chunk_index: number; embedding: number[] }> = [];
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;
  
  // Process sequentially with delays
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      // Add delay before each request (except first)
      if (i > 0) {
        const delay = consecutiveErrors > 0 ? 5000 : 2000; // 5s if errors, 2s otherwise
        console.log(`   Waiting ${delay}ms before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const embedding = await generateEmbedding(chunk.chunk_text, 'RETRIEVAL_DOCUMENT');
      results.push({ chunk_index: chunk.chunk_index, embedding });
      consecutiveErrors = 0; // Reset error counter on success
      
      if (onProgress) {
        onProgress(results.length, chunks.length);
      }
      
      console.log(`✓ Progress: ${results.length}/${chunks.length} chunks embedded`);
      
    } catch (error: any) {
      consecutiveErrors++;
      console.error(`Failed to embed chunk ${chunk.chunk_index}:`, error?.message || error);
      
      // Check if it's a quota exhaustion error
      if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`⚠️ Quota exhausted. Remaining chunks will use zero embeddings.`);
        
        // Fill remaining chunks with zero embeddings
        for (let j = i; j < chunks.length; j++) {
          results.push({ 
            chunk_index: chunks[j].chunk_index, 
            embedding: new Array(768).fill(0) 
          });
        }
        break; // Exit loop
      }
      
      // For other errors, use zero embedding but continue
      results.push({ chunk_index: chunk.chunk_index, embedding: new Array(768).fill(0) });
      
      // Stop if too many consecutive errors
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(`❌ Stopping after ${maxConsecutiveErrors} consecutive errors`);
        // Fill remaining with zeros
        for (let j = i + 1; j < chunks.length; j++) {
          results.push({ 
            chunk_index: chunks[j].chunk_index, 
            embedding: new Array(768).fill(0) 
          });
        }
        break;
      }
      
      // Add extra delay after error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log(`✓ Completed batch embedding for ${results.length} chunks`);
  return results;
}
