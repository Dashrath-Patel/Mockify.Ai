'use client';

import { useState } from 'react';
import { Search, Loader2, FileText, ExternalLink, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

interface SearchResult {
  id: string;
  topic: string;
  file_url: string;
  similarity: number;
  similarityPercent: number;
  matchedChunks: Array<{
    text: string;
    similarity: number;
    similarityPercent: number;
    chunkIndex: number;
    position?: string;
  }>;
  totalMatchedChunks: number;
  preview: string;
}

export default function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    exam_type: '',
    topic: '',
    threshold: 0.4 // Lowered to 40% - semantic similarity rarely exceeds 60%
  });
  const [searchStats, setSearchStats] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setSearchStats(null);
    
    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please login to search materials');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/search-materials', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          query: query.trim(),
          ...filters
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setSearchStats(data.stats);
      
      if (data.results.length === 0) {
        toast.info('No matching materials found. Try a different query or adjust filters.');
      } else {
        toast.success(`Found ${data.results.length} relevant material${data.results.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed. Please try again.';
      toast.error(errorMessage);
      
      // Check if it's a configuration error
      if (errorMessage.includes('not configured')) {
        toast.error('Semantic search needs setup. Please run the SQL migration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearchStats(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Search Form */}
      <div className="bg-white border-3 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">🔍 Semantic Search</h2>
            <p className="text-gray-600 text-sm mt-1">
              Search by concept, topic, or question type. AI understands meaning, not just keywords!
            </p>
          </div>
          {results.length > 0 && (
            <button
              onClick={clearSearch}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'electric potential energy', 'thermodynamics', 'capacitor circuits'..."
              className="w-full px-4 py-3 pr-32 border-3 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title="Toggle filters"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Exam Type</label>
                  <select
                    value={filters.exam_type}
                    onChange={(e) => setFilters({ ...filters, exam_type: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white"
                  >
                    <option value="">All Exams</option>
                    <option value="neet">NEET</option>
                    <option value="jee">JEE</option>
                    <option value="upsc">UPSC</option>
                    <option value="gate">GATE</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Topic Filter</label>
                  <input
                    type="text"
                    value={filters.topic}
                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                    placeholder="e.g., Physics"
                    className="w-full px-3 py-2 border-2 border-black rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Match Threshold: {Math.round(filters.threshold * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={filters.threshold}
                    onChange={(e) => setFilters({ ...filters, threshold: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Broad (50%)</span>
                    <span>Precise (95%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Search Stats */}
        {searchStats && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
            <span>⚡ Search completed in {searchStats.totalTime}</span>
            <span>•</span>
            <span>Embedding: {searchStats.embeddingTime}</span>
            <span>•</span>
            <span>Vector search: {searchStats.searchTime}</span>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Search Results ({results.length})
            </h3>
            <p className="text-sm text-gray-600">
              Showing materials sorted by relevance
            </p>
          </div>
          
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{result.topic}</h4>
                  <p className="text-sm text-gray-500">
                    Uploaded {new Date(result.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                    result.similarityPercent >= 85 
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : result.similarityPercent >= 70
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-500'
                  }`}>
                    {result.similarityPercent}% match
                  </span>
                  
                  <a
                    href={result.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    title="View original PDF"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <FileText className="w-4 h-4" />
                <span>{result.totalMatchedChunks} matched chunks</span>
              </div>

              {result.matchedChunks && result.matchedChunks.length > 0 ? (
                <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    📄 Matched Content ({result.matchedChunks.length} chunks):
                  </p>
                  <ul className="space-y-3">
                    {result.matchedChunks.map((chunk, idx) => (
                      <li key={idx} className="text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-blue-600">Chunk {chunk.chunkIndex}:</span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                            {chunk.similarityPercent}% match
                          </span>
                        </div>
                        <div className="font-medium text-gray-800 mb-1">
                          {chunk.text.length > 200 
                            ? chunk.text.substring(0, 200) + '...' 
                            : chunk.text}
                        </div>
                        {chunk.position && (
                          <div className="text-xs text-gray-500 italic">
                            {chunk.position}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-600">
                  {result.preview}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-12 text-gray-500 bg-white border-3 border-black rounded-lg">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold mb-2">No results found for "{query}"</p>
          <p className="text-sm">
            Try different keywords or adjust your similarity threshold in filters
          </p>
        </div>
      )}

      {/* Initial State */}
      {!loading && results.length === 0 && !query && (
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 border-3 border-black rounded-lg">
          <Search className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-bold mb-2">Smart Semantic Search</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Search your study materials using AI. Our system understands concepts and meanings,
            not just exact word matches.
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
            <button
              onClick={() => setQuery('electric potential')}
              className="px-3 py-1 bg-white border-2 border-black rounded-full text-sm hover:bg-blue-50"
            >
              electric potential
            </button>
            <button
              onClick={() => setQuery('thermodynamics')}
              className="px-3 py-1 bg-white border-2 border-black rounded-full text-sm hover:bg-blue-50"
            >
              thermodynamics
            </button>
            <button
              onClick={() => setQuery('capacitor circuits')}
              className="px-3 py-1 bg-white border-2 border-black rounded-full text-sm hover:bg-blue-50"
            >
              capacitor circuits
            </button>
            <button
              onClick={() => setQuery('Newton laws')}
              className="px-3 py-1 bg-white border-2 border-black rounded-full text-sm hover:bg-blue-50"
            >
              Newton laws
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
