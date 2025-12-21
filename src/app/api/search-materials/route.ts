import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/huggingface-embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - missing auth header' }, 
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please login' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      query, 
      exam_type, 
      topic, 
      threshold = 0.4, // Lowered from 0.7 - semantic similarity rarely exceeds 60%
      limit = 10 
    } = body;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' }, 
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for: "${query}"`);
    console.log(`   User: ${user.id}`);
    console.log(`   Filters: exam_type=${exam_type || 'any'}, topic=${topic || 'any'}, threshold=${threshold}`);

    // Generate embedding for search query
    const startTime = Date.now();
    let queryEmbedding;
    let embeddingTime = 0;
    try {
      queryEmbedding = await generateEmbedding(query);
      embeddingTime = Date.now() - startTime;
      console.log(`✓ Query embedding generated in ${embeddingTime}ms`);
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
      return NextResponse.json(
        { 
          error: 'Search temporarily unavailable',
          details: 'HuggingFace API error. Please check your API key.'
        },
        { status: 503 }
      );
    }

    // Use Supabase RPC function for CHUNK-LEVEL vector similarity search
    const searchStartTime = Date.now();
    
    // Format embedding as PostgreSQL vector literal
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;
    console.log(`🔍 Searching CHUNKS with vector: ${vectorLiteral.substring(0, 50)}... (${vectorLiteral.length} chars)`);
    
    // Search at CHUNK level for better precision
    const { data: chunks, error: searchError } = await supabase
      .rpc('search_similar_chunks', {
        query_embedding: vectorLiteral,
        match_threshold: threshold,
        match_count: limit * 3, // Get more chunks, then group by material
        filter_user_id: user.id
      });

    const searchTime = Date.now() - searchStartTime;

    if (searchError) {
      console.error('Search error:', searchError);
      
      // Check if pgvector extension is missing
      if (searchError.message?.includes('function search_similar_chunks')) {
        return NextResponse.json(
          { 
            error: 'Semantic search not configured',
            details: 'Please run the SQL migration in backend/database/add-document-chunks.sql'
          },
          { status: 500 }
        );
      }
      
      throw searchError;
    }

    console.log(`✓ Chunk search completed in ${searchTime}ms, found ${chunks?.length || 0} chunks`);
    
    // Group chunks by material and get top results
    const materialMap = new Map<string, any>();
    chunks?.forEach((chunk: any) => {
      if (!materialMap.has(chunk.material_id)) {
        materialMap.set(chunk.material_id, {
          material_id: chunk.material_id,
          topic: chunk.metadata?.material_topic || 'Unknown',
          file_url: chunk.metadata?.material_name || '',
          maxSimilarity: chunk.similarity,
          chunks: []
        });
      }
      
      const material = materialMap.get(chunk.material_id)!;
      material.chunks.push({
        text: chunk.chunk_text,
        similarity: chunk.similarity,
        chunk_index: chunk.chunk_index,
        start_char: chunk.metadata?.start_char,
        end_char: chunk.metadata?.end_char
      });
      
      // Update max similarity if this chunk is more similar
      if (chunk.similarity > material.maxSimilarity) {
        material.maxSimilarity = chunk.similarity;
      }
    });
    
    // Convert map to array and sort by max similarity
    const materials = Array.from(materialMap.values())
      .sort((a, b) => b.maxSimilarity - a.maxSimilarity)
      .slice(0, limit);
    
    console.log(`✓ Grouped into ${materials.length} materials`);
    
    // Debug: Log similarity scores
    if (materials && materials.length > 0) {
      console.log('📊 Similarity scores:', materials.map((m: any) => 
        `${m.topic}: ${(m.maxSimilarity * 100).toFixed(1)}% (${m.chunks.length} chunks)`
      ));
    }
    
    // Debug: Check actual similarity scores if no results
    if (!materials || materials.length === 0) {
      console.log('🔬 Checking actual chunk similarity scores (threshold=0)...');
      const { data: allScores } = await supabase
        .rpc('search_similar_chunks', {
          query_embedding: vectorLiteral,
          match_threshold: 0.0,
          match_count: 5,
          filter_user_id: user.id
        });
      
      if (allScores && allScores.length > 0) {
        console.log('📊 Actual chunk scores:', allScores.map((c: any) => 
          `${c.topic || 'Unknown'}: ${(c.similarity * 100).toFixed(1)}% (chunk ${c.chunk_index})`
        ).join(', '));
      } else {
        console.log('❌ No chunks found even with threshold=0');
      }
      console.log(`⚠️ No chunks found with similarity > ${threshold * 100}%`);
    }

    // Format results with matched chunks
    const resultsWithQuestions = materials?.map((material: any) => {
      // Sort chunks by similarity (best matches first)
      const sortedChunks = material.chunks.sort((a: any, b: any) => b.similarity - a.similarity);
      
      return {
        id: material.material_id,
        topic: material.topic,
        file_url: material.file_url,
        similarity: material.maxSimilarity,
        similarityPercent: Math.round(material.maxSimilarity * 100),
        matchedChunks: sortedChunks.slice(0, 3).map((chunk: any) => ({
          text: chunk.text,
          similarity: chunk.similarity,
          similarityPercent: Math.round(chunk.similarity * 100),
          chunkIndex: chunk.chunk_index,
          position: chunk.start_char ? `chars ${chunk.start_char}-${chunk.end_char}` : undefined
        })),
        totalMatchedChunks: material.chunks.length,
        preview: sortedChunks[0]?.text?.substring(0, 200) + '...' || 'No preview available'
      };
    }) || [];

    const totalTime = Date.now() - startTime;
    console.log(`✓ Total search time: ${totalTime}ms (embedding: ${embeddingTime}ms, search: ${searchTime}ms)`);

    return NextResponse.json({
      success: true,
      results: resultsWithQuestions,
      query,
      count: resultsWithQuestions.length,
      stats: {
        embeddingTime: `${embeddingTime}ms`,
        searchTime: `${searchTime}ms`,
        totalTime: `${totalTime}ms`
      }
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking if semantic search is available
export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Check if user has any materials with embeddings
    const { data: materials, error } = await supabase
      .from('study_materials')
      .select('id')
      .eq('user_id', user.id)
      .not('embedding', 'is', null)
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      available: true,
      materialsWithEmbeddings: materials?.length || 0,
      message: materials && materials.length > 0 
        ? 'Semantic search is ready'
        : 'No materials with embeddings yet. Upload materials to enable search.'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
