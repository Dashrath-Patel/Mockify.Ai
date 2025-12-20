/**
 * Complete Example: PDF Upload with Chunk-Based Embeddings
 * 
 * This example shows the full flow:
 * 1. Upload PDF (up to 10MB)
 * 2. Extract raw text using LangChain
 * 3. Split into uniform chunks
 * 4. Generate embeddings for each chunk
 * 5. Store chunks + embeddings in database
 * 6. Search similar chunks
 * 7. Generate questions from similar content
 */

import { extractAndChunkPDF, sanitizeChunkText } from '@/lib/pdf-chunking';
import { generateEmbedding } from '@/lib/huggingface-embeddings';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * STEP 1: Upload and process PDF
 */
export async function uploadAndProcessPDF(
  pdfFile: File,
  userId: string,
  topic?: string
) {
  try {
    console.log('🚀 Starting PDF upload and processing...');
    
    // Convert file to buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract and chunk the PDF
    const { rawText, chunks } = await extractAndChunkPDF(buffer);
    
    console.log(`📄 Extracted ${rawText.length} chars → ${chunks.length} chunks`);
    
    // Upload PDF to storage first
    const fileName = `${userId}/${Date.now()}_${pdfFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('study-materials')
      .upload(fileName, buffer, {
        contentType: pdfFile.type,
        upsert: false,
      });
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('study-materials')
      .getPublicUrl(fileName);
    
    // Create material record
    const { data: material, error: materialError } = await supabase
      .from('study_materials')
      .insert({
        user_id: userId,
        file_url: publicUrl,
        file_type: pdfFile.type,
        topic: topic || 'General',
        raw_text: sanitizeChunkText(rawText),
        chunk_count: chunks.length,
      })
      .select()
      .single();
    
    if (materialError) throw materialError;
    
    console.log(`✓ Material created: ${material.id}`);
    
    // Generate embeddings for each chunk
    console.log('🔮 Generating embeddings for chunks...');
    
    const chunkRecords = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      console.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
      
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(chunk.text);
      
      // Convert embedding to PostgreSQL vector format
      const embeddingStr = `[${embedding.join(',')}]`;
      
      chunkRecords.push({
        material_id: material.id,
        user_id: userId,
        chunk_index: chunk.index,
        chunk_text: sanitizeChunkText(chunk.text),
        start_char: chunk.start_char,
        end_char: chunk.end_char,
        char_count: chunk.char_count,
        word_count: chunk.word_count,
        embedding: embeddingStr,
      });
      
      // Batch insert every 10 chunks to avoid timeout
      if (chunkRecords.length >= 10 || i === chunks.length - 1) {
        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert(chunkRecords);
        
        if (insertError) {
          console.error('Error inserting chunks:', insertError);
          throw insertError;
        }
        
        console.log(`  ✓ Inserted ${chunkRecords.length} chunks`);
        chunkRecords.length = 0; // Clear array
      }
    }
    
    console.log('✅ Upload and processing complete!');
    
    return {
      success: true,
      material_id: material.id,
      chunks_created: chunks.length,
      total_chars: rawText.length,
    };
    
  } catch (error) {
    console.error('Upload and process error:', error);
    throw error;
  }
}

/**
 * STEP 2: Search similar chunks
 */
export async function searchSimilarChunks(
  query: string,
  userId: string,
  threshold: number = 0.5,
  limit: number = 5
) {
  try {
    console.log(`🔍 Searching for: "${query}"`);
    
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    
    // Search using database function
    const { data: results, error } = await supabase.rpc('search_similar_chunks', {
      query_embedding: embeddingStr,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: userId,
    });
    
    if (error) throw error;
    
    console.log(`✓ Found ${results?.length || 0} similar chunks`);
    
    return results || [];
    
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * STEP 3: Generate questions from similar chunks
 */
export async function generateQuestionsFromSimilarContent(
  query: string,
  userId: string
) {
  try {
    // Find similar chunks
    const similarChunks = await searchSimilarChunks(query, userId, 0.6, 5);
    
    if (similarChunks.length === 0) {
      return {
        success: false,
        message: 'No similar content found',
        questions: [],
      };
    }
    
    // Combine chunk texts as context
    const context = similarChunks
      .map((chunk: any, i: number) => `Context ${i + 1}:\n${chunk.chunk_text}`)
      .join('\n\n');
    
    console.log(`📝 Generating questions from ${similarChunks.length} chunks...`);
    
    // Call your LLM to generate questions
    const prompt = `Based on the following context, generate 5 multiple-choice questions:

${context}

Generate questions in JSON format:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "..."
  }
]`;
    
    // Call your LLM API (Gemini, OpenAI, etc.)
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert question generator.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    const questions = JSON.parse(data.choices[0].message.content);
    
    console.log(`✅ Generated ${questions.length} questions`);
    
    return {
      success: true,
      questions,
      source_chunks: similarChunks.map((c: any) => ({
        material_id: c.material_id,
        chunk_index: c.chunk_index,
        similarity: c.similarity,
      })),
    };
    
  } catch (error) {
    console.error('Question generation error:', error);
    throw error;
  }
}

/**
 * STEP 4: Retrieve all chunks for a document
 */
export async function getDocumentChunks(materialId: string) {
  try {
    const { data, error } = await supabase.rpc('get_document_chunks', {
      doc_material_id: materialId,
    });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Get chunks error:', error);
    throw error;
  }
}

/**
 * Example Usage in API Route:
 * 
 * ```typescript
 * // In /api/upload/route.ts
 * export async function POST(request: NextRequest) {
 *   const formData = await request.formData();
 *   const file = formData.get('file') as File;
 *   const userId = await getUserId(request);
 *   
 *   const result = await uploadAndProcessPDF(file, userId, 'Physics');
 *   
 *   return NextResponse.json(result);
 * }
 * 
 * // In /api/search/route.ts
 * export async function POST(request: NextRequest) {
 *   const { query } = await request.json();
 *   const userId = await getUserId(request);
 *   
 *   const chunks = await searchSimilarChunks(query, userId);
 *   
 *   return NextResponse.json({ chunks });
 * }
 * 
 * // In /api/generate-questions/route.ts
 * export async function POST(request: NextRequest) {
 *   const { query } = await request.json();
 *   const userId = await getUserId(request);
 *   
 *   const result = await generateQuestionsFromSimilarContent(query, userId);
 *   
 *   return NextResponse.json(result);
 * }
 * ```
 */

/**
 * Chunking Strategy Recommendations:
 * 
 * 1. Small PDFs (< 5000 chars):
 *    - Use 2000 char chunks with 400 char overlap
 *    - Fewer chunks, more context per chunk
 * 
 * 2. Medium PDFs (5k-50k chars):
 *    - Use 1000 char chunks with 200 char overlap
 *    - Balanced approach
 * 
 * 3. Large PDFs (> 50k chars):
 *    - Use 500 char chunks with 100 char overlap
 *    - More chunks, better search granularity
 * 
 * 4. For embeddings:
 *    - Max 1500 chars per chunk (model limit ~2000)
 *    - Use 300 char overlap for context
 */
