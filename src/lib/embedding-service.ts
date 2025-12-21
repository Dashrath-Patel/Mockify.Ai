/**
 * Embedding Service using Xenova/Transformers
 * Generates semantic embeddings for text using all-MiniLM-L6-v2 model
 * Runs locally in Node.js - no API costs!
 */

import { pipeline, env } from '@xenova/transformers';

// Configure transformers environment for server-side usage
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false;

// ONNX backend configuration  
env.backends.onnx.wasm.numThreads = 1;

let embeddingPipeline: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

/**
 * Initialize embedding model (singleton pattern)
 * Uses Xenova/all-MiniLM-L6-v2:
 * - 384 dimensions
 * - Fast inference (~50ms per text)
 * - Good for semantic similarity
 */
async function getEmbeddingPipeline() {
  // Return existing pipeline if already loaded
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  // If initialization is in progress, wait for it
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log('🔄 Loading embedding model (first time only, ~20MB download)...');
      const startTime = Date.now();
      
      // Load with explicit configuration for server environment
      // Use quantized model for better compatibility and smaller size
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          quantized: true, // Quantized model is more reliable
          progress_callback: (progress: any) => {
            if (progress.status === 'progress' && progress.file) {
              console.log(`  Downloading ${progress.file}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
            } else if (progress.status === 'done') {
              console.log(`  ✓ Loaded: ${progress.file}`);
            }
          }
        }
      );
      
      const loadTime = Date.now() - startTime;
      console.log(`✓ Embedding model loaded in ${loadTime}ms`);
      
      return embeddingPipeline;
    } catch (error) {
      console.error('Failed to load embedding model:', error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
      embeddingPipeline = null;
      isInitializing = false;
      initPromise = null;
      
      // Don't throw - let the calling function handle gracefully
      throw new Error(`Embedding model initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Generate embedding for a single text
 * @param text - Input text (will be truncated to 512 tokens)
 * @returns 384-dimensional vector as number array
 * @throws Error if text is empty or embedding generation fails
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Truncate to model limit (512 tokens ≈ 2000 chars)
    const truncated = trimmedText.substring(0, 2000);
    
    // Get model pipeline
    const pipe = await getEmbeddingPipeline();
    
    // Generate embedding with mean pooling and normalization
    const output = await pipe(truncated, { 
      pooling: 'mean',  // Average all token embeddings
      normalize: true    // L2 normalization for cosine similarity
    });
    
    // Convert tensor to JavaScript array
    const embedding = Array.from(output.data as Float32Array);
    
    // Validate output dimension
    if (embedding.length !== 384) {
      throw new Error(`Invalid embedding dimension: ${embedding.length}, expected 384`);
    }
    
    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 * More efficient than calling generateEmbedding() in a loop
 * Processes in batches of 10 to avoid memory issues
 * 
 * @param texts - Array of text strings
 * @returns Array of 384-dimensional vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Filter out empty texts
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      return [];
    }

    console.log(`Generating embeddings for ${validTexts.length} texts...`);
    
    // Process in batches to avoid memory issues
    const batchSize = 10;
    const embeddings: number[][] = [];
    
    for (let i = 0; i < validTexts.length; i += batchSize) {
      const batch = validTexts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
      
      const progress = Math.min(i + batchSize, validTexts.length);
      console.log(`  ✓ Processed ${progress}/${validTexts.length} embeddings`);
    }
    
    console.log(`✓ All embeddings generated`);
    return embeddings;
  } catch (error) {
    console.error('Batch embedding generation error:', error);
    throw new Error('Failed to generate embeddings in batch');
  }
}

/**
 * Format question text for embedding
 * Combines question + options for better semantic representation
 * 
 * @param question - Question text
 * @param options - Array of option texts
 * @returns Formatted text for embedding
 */
export function formatQuestionForEmbedding(
  question: string,
  options: string[]
): string {
  const cleanQuestion = question.trim();
  
  // Filter and clean options
  const cleanOptions = options
    .filter(opt => opt && opt.length > 2)
    .map((opt, idx) => `${idx + 1}. ${opt.trim()}`)
    .join(' ');
  
  return `${cleanQuestion}\n${cleanOptions}`;
}

/**
 * Format material summary for embedding
 * Uses topic + sample questions for representation
 * 
 * @param topic - Material topic
 * @param questions - Array of parsed questions
 * @returns Formatted text for embedding
 */
export function formatMaterialForEmbedding(
  topic: string,
  questions: Array<{ question: string; options: string[] }>
): string {
  const topicText = topic ? `Topic: ${topic}\n` : '';
  
  // Use first 3 questions as representative sample
  const questionSamples = questions
    .slice(0, 3)
    .map(q => q.question.substring(0, 150)) // Limit each question to 150 chars
    .join('\n');
  
  return `${topicText}${questionSamples}`;
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 (opposite) and 1 (identical)
 * Values > 0.7 indicate high similarity
 * 
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Cosine similarity score
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Vectors must have same dimension');
  }
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find most similar items from a list using embeddings
 * 
 * @param queryEmbedding - Embedding to compare against
 * @param items - Array of items with embeddings
 * @param topK - Number of top results to return
 * @returns Top K most similar items with similarity scores
 */
export function findMostSimilar<T extends { embedding: number[] }>(
  queryEmbedding: number[],
  items: T[],
  topK: number = 5
): Array<T & { similarity: number }> {
  // Calculate similarity for all items
  const withScores = items.map(item => ({
    ...item,
    similarity: cosineSimilarity(queryEmbedding, item.embedding)
  }));
  
  // Sort by similarity (highest first) and return top K
  return withScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Detect potential duplicate questions using embeddings
 * 
 * @param newQuestion - New question to check
 * @param existingQuestions - Array of existing questions with embeddings
 * @param threshold - Similarity threshold for duplicates (default 0.85)
 * @returns Array of potential duplicates
 */
export function findDuplicates<T extends { embedding: number[] }>(
  newQuestionEmbedding: number[],
  existingQuestions: T[],
  threshold: number = 0.85
): Array<T & { similarity: number }> {
  const similar = findMostSimilar(newQuestionEmbedding, existingQuestions, 10);
  return similar.filter(item => item.similarity >= threshold);
}
