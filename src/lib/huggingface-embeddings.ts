/**
 * HuggingFace Embeddings Service
 * Uses HuggingFace Inference API - FREE tier: 30k requests/month
 * More reliable than local models in server environments
 */

import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Using sentence-transformers/paraphrase-MiniLM-L6-v2
// 384 dimensions - fast and efficient for semantic search
// Alternative 512-dim models don't exist in HuggingFace, so we'll use 384 or 768
// Let's use 768 for better quality: sentence-transformers/all-mpnet-base-v2
const EMBEDDING_MODEL = 'sentence-transformers/all-mpnet-base-v2';

/**
 * Generate embedding vector for text using HuggingFace API with retry logic
 * @param text - Text to embed (max ~512 tokens recommended)
 * @param retries - Number of retry attempts (default: 3)
 * @returns 768-dimensional embedding vector
 */
export async function generateEmbedding(text: string, retries: number = 3): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  // Model has 512 token limit (~2000 chars, but can handle up to 8000 with truncation)
  const truncatedText = text.slice(0, 8000);
  
  console.log(`Generating embedding via HuggingFace API (${truncatedText.length} chars)...`);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const embedding = await hf.featureExtraction({
        model: EMBEDDING_MODEL,
        inputs: truncatedText
      });

      // Convert to number array (handle both array and nested array responses)
      const embeddingArray = Array.isArray(embedding[0]) ? embedding[0] : embedding;
      
      console.log(`✓ Embedding generated (${embeddingArray.length} dimensions, expected: 768)`);
      
      return embeddingArray as number[];
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log attempt failure
      console.warn(`⚠️ Attempt ${attempt}/${retries} failed:`, error?.message || error);
      
      // Don't retry on certain errors
      if (error?.message?.includes('Invalid API key') || 
          error?.message?.includes('unauthorized')) {
        throw new Error('Invalid HuggingFace API key');
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
  console.error('❌ All retry attempts failed for HuggingFace embedding');
  throw new Error(
    `Failed to generate embedding after ${retries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Generate embeddings for multiple texts in batch with rate limiting
 * Processes chunks sequentially with delays to avoid overwhelming the API
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    throw new Error('Texts array cannot be empty');
  }

  console.log(`Generating ${texts.length} embeddings via HuggingFace API...`);

  const embeddings: number[][] = [];
  const batchSize = 5; // Process 5 at a time
  const delayBetweenBatches = 1000; // 1 second delay between batches

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} items)...`);
    
    try {
      // Process batch in parallel
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateEmbedding(text))
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
 * Format study material for embedding generation
 * Combines topic + key questions for semantic representation
 */
export function formatMaterialForEmbedding(
  topic: string, 
  questions: Array<{ question: string; options?: string[] }>
): string {
  const questionTexts = questions
    .slice(0, 3) // Top 3 questions
    .map(q => q.question)
    .join(' ');
  
  return `Topic: ${topic}. ${questionTexts}`.slice(0, 2000);
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
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
 * Extract key phrases and summary from text using HuggingFace summarization
 * Uses facebook/bart-large-cnn for high-quality extractive summarization
 * Handles large documents (up to 10MB PDFs) by chunking and summarizing
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
    
    // For large documents, chunk and summarize each part
    const chunkSize = 3000; // BART can handle ~4000, use 3000 for safety
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    
    console.log(`Processing ${chunks.length} chunks...`);
    
    // Summarize each chunk (process up to 10 chunks to avoid rate limits)
    const summaries: string[] = [];
    const chunksToProcess = Math.min(chunks.length, 10);
    
    for (let i = 0; i < chunksToProcess; i++) {
      try {
        const summary = await hf.summarization({
          model: 'facebook/bart-large-cnn',
          inputs: chunks[i],
          parameters: {
            max_length: 150,
            min_length: 30,
            do_sample: false
          }
        });
        summaries.push(summary.summary_text);
      } catch (err) {
        console.warn(`Chunk ${i} summarization failed:`, err);
        // Use beginning of chunk as fallback
        summaries.push(chunks[i].slice(0, 200));
      }
    }

    console.log(`✓ Generated ${summaries.length} summaries`);
    
    // Extract important terms from FULL text
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
    
    // Combine: All summaries + Important terms
    const combined = `${summaries.join(' ')} ${importantWords}`;
    
    return combined.slice(0, maxLength);
  } catch (error) {
    console.error('Key content extraction error:', error);
    // Fallback: Extract from full text without AI
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    const wordFreq = new Map<string, number>();
    words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
    
    const importantWords = Array.from(wordFreq.entries())
      .filter(([_, freq]) => freq >= 2 && freq <= 15)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 150)
      .map(([word]) => word)
      .join(' ');
    
    return importantWords.slice(0, maxLength);
  }
}
