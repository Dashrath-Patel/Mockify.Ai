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

/**
 * Comprehensive word dictionary for fixing PDF extraction issues
 */
const WORD_DICTIONARY = new Set([
  // Common English words
  'the', 'of', 'and', 'in', 'to', 'for', 'with', 'by', 'on', 'at', 'from', 'as', 'is', 'are', 'was', 'were',
  'a', 'an', 'or', 'not', 'but', 'be', 'can', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would',
  'this', 'that', 'these', 'those', 'their', 'its', 'using', 'between', 'into', 'through', 'during',
  
  // Scientific terms - Physics
  'physics', 'measurement', 'motion', 'force', 'forces', 'energy', 'work', 'power', 'momentum',
  'rotational', 'gravitation', 'gravity', 'properties', 'matter', 'thermodynamics', 'kinetic',
  'theory', 'gases', 'oscillations', 'waves', 'electrostatics', 'current', 'electricity',
  'magnetic', 'magnetism', 'electromagnetic', 'induction', 'alternating', 'optics', 'ray',
  'wave', 'dual', 'nature', 'radiation', 'atoms', 'nuclei', 'electronic', 'devices',
  'semiconductor', 'communication', 'systems', 'units', 'dimensions', 'kinematics', 'dynamics',
  'conservation', 'collision', 'elasticity', 'surface', 'tension', 'viscosity', 'fluid',
  'thermal', 'expansion', 'calorimetry', 'heat', 'transfer', 'specific', 'capacity', 'latent',
  'laws', 'entropy', 'simple', 'harmonic', 'pendulum', 'resonance', 'sound', 'doppler', 'effect',
  'superposition', 'standing', 'beats', 'electric', 'field', 'potential', 'capacitance',
  'dielectrics', 'resistance', 'ohms', 'law', 'cells', 'kirchhoffs', 'wheatstone', 'bridge',
  'potentiometer', 'biot', 'savart', 'amperes', 'circuital', 'solenoid', 'toroid', 'faradays',
  'lenzs', 'eddy', 'currents', 'self', 'mutual', 'inductance', 'transformers', 'generators',
  'motors', 'phasors', 'impedance', 'resonant', 'circuits', 'power', 'factor', 'wattless',
  'reflection', 'refraction', 'total', 'internal', 'mirrors', 'lenses', 'magnification',
  'microscope', 'telescope', 'interference', 'diffraction', 'polarization', 'photoelectric',
  'photon', 'de', 'broglie', 'wavelength', 'heisenberg', 'uncertainty', 'bohr', 'model',
  'hydrogen', 'spectrum', 'x', 'rays', 'radioactivity', 'alpha', 'beta', 'gamma', 'decay',
  'half', 'life', 'nuclear', 'fission', 'fusion', 'binding', 'mass', 'defect',
  'intrinsic', 'extrinsic', 'semiconductors', 'junction', 'diode', 'transistor', 'logic', 'gates',
  'integral', 'derivative', 'anti', 'conservative', 'non',
  
  // Chemistry terms
  'chemistry', 'chemical', 'atomic', 'structure', 'periodic', 'table', 'classification', 'elements',
  'bonding', 'molecular', 'states', 'equilibrium', 'ionic', 'solutions', 'redox', 'reactions',
  'electrochemistry', 'kinetics', 'surface', 'chemistry', 'general', 'principles', 'processes',
  'isolation', 'metals', 'block', 'compounds', 'organic', 'hydrocarbons', 'haloalkanes', 'haloarenes',
  'alcohols', 'phenols', 'ethers', 'aldehydes', 'ketones', 'carboxylic', 'acids', 'amines',
  'biomolecules', 'polymers', 'environmental', 'everyday', 'life', 'solid', 'state', 'liquid',
  'gaseous', 'colligative', 'thermochemistry', 'spontaneity', 'catalysis', 'adsorption',
  'metallurgy', 'coordination', 'organometallics', 'nitrogen', 'oxygen', 'halogens', 'noble',
  'alkanes', 'alkenes', 'alkynes', 'aromatic', 'isomerism', 'stereochemistry', 'functional', 'groups',
  'purification', 'qualitative', 'analysis', 'proteins', 'carbohydrates', 'lipids', 'nucleic',
  'vitamins', 'hormones', 'drugs', 'synthetic', 'natural', 'rubber', 'plastics', 'fibres',
  'atmosphere', 'water', 'pollution', 'green', 'sustainable', 'medicines', 'fertilizers', 'soaps',
  'concentration', 'dilute', 'electrochemical', 'different', 'methods', 'expressing',
  
  // Biology terms  
  'biology', 'living', 'world', 'plant', 'kingdom', 'animal', 'cell', 'unit', 'biomolecules',
  'division', 'transport', 'plants', 'mineral', 'nutrition', 'photosynthesis', 'respiration',
  'growth', 'development', 'digestion', 'absorption', 'breathing', 'exchange', 'body', 'fluids',
  'circulation', 'excretory', 'products', 'elimination', 'locomotion', 'movement', 'neural',
  'control', 'coordination', 'endocrine', 'system', 'reproduction', 'organisms', 'flowering',
  'human', 'reproductive', 'health', 'genetics', 'principles', 'inheritance', 'variation',
  'molecular', 'basis', 'evolution', 'health', 'disease', 'strategies', 'enhancement', 'food',
  'production', 'microbes', 'welfare', 'biotechnology', 'application', 'ecology', 'environment',
  'issues', 'biodiversity', 'organisms', 'populations', 'ecosystem',
  
  // Common scientific words
  'given', 'method', 'principle', 'characteristics', 'determination', 'experiment', 'practical',
  'study', 'verification', 'identification', 'collection', 'mixed', 'resistor', 'LED', 'plot',
  'graph', 'curve', 'curves', 'finding', 'reverse', 'breakdown', 'zener', 'carbon', 'focal',
  'length', 'mirror', 'lens', 'prism', 'angle', 'incidence', 'deviation', 'parallel', 'carrying',
  'conductors', 'centre', 'two', 'three', 'particle', 'vernier', 'calipers', 'screw', 'gauge',
  'external', 'internal', 'diameter', 'meter', 'temperature', 'room', 'using', 'resonance', 'tube',
  'speed', 'air', 'dissipation', 'plotting', 'acceleration', 'due', 'coefficient', 'restitution',
  'measuring', 'liquid', 'capillary', 'rise'
]);

/**
 * Fix PDF extraction issues - both broken words (Integr al → Integral) 
 * and concatenated words (Specificheat → Specific heat)
 */
export function fixPDFTextIssues(text: string): string {
  if (!text || text.length < 3) return text;
  
  let result = text;
  
  // Step 1: Fix broken words (words split by random spaces like "Integr al" → "Integral")
  result = fixBrokenWords(result);
  
  // Step 2: Fix concatenated words (words stuck together like "Specificheat" → "Specific heat")
  result = fixConcatenatedWords(result);
  
  return result;
}

/**
 * Fix words that were incorrectly split by PDF extraction
 * e.g., "Integr al" → "Integral", "dimensi ons" → "dimensions"
 */
function fixBrokenWords(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Split into potential word parts
  const parts = result.split(/\s+/);
  const fixedParts: string[] = [];
  
  let i = 0;
  while (i < parts.length) {
    let currentPart = parts[i];
    
    // Try to merge with next parts if they form a known word
    let merged = false;
    for (let j = 1; j <= 3 && i + j < parts.length; j++) {
      // Build candidate by joining current and next j parts
      const candidateParts = parts.slice(i, i + j + 1);
      const candidate = candidateParts.join('').toLowerCase();
      
      // Check if merged word is in dictionary
      if (WORD_DICTIONARY.has(candidate)) {
        // Found a match! Use proper casing
        const firstPart = parts[i];
        const isUpperCase = firstPart === firstPart.toUpperCase() && firstPart.length > 1;
        const isCapitalized = firstPart[0] === firstPart[0].toUpperCase();
        
        if (isUpperCase) {
          fixedParts.push(candidate.toUpperCase());
        } else if (isCapitalized) {
          fixedParts.push(candidate.charAt(0).toUpperCase() + candidate.slice(1));
        } else {
          fixedParts.push(candidate);
        }
        i += j + 1;
        merged = true;
        break;
      }
    }
    
    if (!merged) {
      fixedParts.push(currentPart);
      i++;
    }
  }
  
  return fixedParts.join(' ');
}

/**
 * Fix concatenated words that have no spaces (common in PDF extraction)
 * e.g., "Specificheatcapacity" → "Specific heat capacity"
 */
export function fixConcatenatedWords(text: string): string {
  if (!text || text.length < 10) return text;
  
  // If text already has enough spaces, it's likely fine
  const spaceCount = (text.match(/\s/g) || []).length;
  const wordEstimate = text.length / 6; // Average word is ~6 chars
  if (spaceCount > wordEstimate * 0.5) {
    return text; // More than half expected spaces exist
  }
  
  let result = text;
  
  // Insert spaces before capital letters that follow lowercase letters (camelCase)
  result = result.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Convert dictionary to sorted array for matching (longest first)
  const sortedWords = Array.from(WORD_DICTIONARY).sort((a, b) => b.length - a.length);
  
  // Insert spaces before common words (case-insensitive)
  for (const word of sortedWords) {
    if (word.length < 3) continue; // Skip very short words
    const pattern = new RegExp(`([a-zA-Z])(?=${word})`, 'gi');
    result = result.replace(pattern, '$1 ');
  }
  
  // Clean up: remove multiple spaces, trim
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

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

**YOUR TASK**: Extract ONLY the official syllabus topic names as they appear in the ${examType} curriculum.

**IMPORTANT - PDF TEXT QUALITY ISSUE**: 
The document text may have PDF extraction errors where words are incorrectly spaced:
- Broken words like "Integr al" should be "Integral"
- Broken words like "dimensi ons" should be "dimensions"  
- Broken words like "p ar allel" should be "parallel"
- Broken words like "conduc t ors" should be "conductors"
YOU MUST FIX these broken words when extracting topics. Return properly spelled, correctly spaced topic names.

**SYLLABUS DOCUMENT**:
"""
${truncatedText}
"""

**CRITICAL REQUIREMENTS**:

1. **ONLY Extract Real Topic Names**: Extract actual subject topics like "PHYSICS AND MEASUREMENT", "LAWS OF MOTION", "THERMODYNAMICS", etc.

2. **FIX BROKEN WORDS**: If you see topics with broken spacing like "Specific he at capacity" or "Vernier c alipers", FIX them to "Specific heat capacity" and "Vernier calipers"

3. **DO NOT Extract**:
   - Random sentences from the document
   - Partial sentences or incomplete text
   - Administrative text like "The detailed syllabus..." or "has been uploaded..."
   - URLs, website names, dates, or contact information
   - Instructions, notes, or disclaimers
   - Cover page text or headers/footers

4. **Topic Format**: 
   - Each topic should be a clear, complete topic name with CORRECT SPELLING
   - Format: "SUBJECT - TOPIC NAME" or just "TOPIC NAME"
   - Examples: "PHYSICS AND MEASUREMENT", "Chemistry - Chemical Bonding", "HUMAN PHYSIOLOGY"
   - Keep topic names SHORT (3-100 characters)

4. **Skip Empty or Invalid Entries**:
   - Do NOT include empty strings
   - Do NOT include single words like "The", "and", "for"
   - Do NOT include sentences that describe the syllabus

5. **JSON Output**: Return ONLY valid JSON:
{
  "topics": ["TOPIC 1", "TOPIC 2", "TOPIC 3"],
  "subtopics": {
    "TOPIC 1": ["Subtopic A", "Subtopic B"]
  },
  "sections": ["Section 1", "Section 2"]
}

Return ONLY the JSON object, no additional text or explanation.`;

    // Model fallback list - try multiple models if one is rate limited
    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let result: any = null;
    let lastError: any = null;
    
    for (const modelName of models) {
      try {
        console.log(`📤 Trying model: ${modelName}...`);
        result = await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.3, // Lower temperature for more consistent extraction
            maxOutputTokens: 16384, // Increased for larger syllabi with many topics
            responseMimeType: 'application/json', // Force JSON response
          }
        });
        console.log(`✓ Model ${modelName} succeeded`);
        break; // Success, exit loop
      } catch (modelError: any) {
        lastError = modelError;
        console.warn(`⚠️ Model ${modelName} failed:`, modelError.message || modelError);
        
        // If rate limited (429), wait and try next model
        if (modelError.status === 429 || modelError.message?.includes('429') || modelError.message?.includes('quota')) {
          console.log(`⏳ Rate limited on ${modelName}, trying next model...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before trying next
          continue;
        }
        
        // For other errors, try next model
        continue;
      }
    }
    
    // If all models failed, return failure (don't throw - let caller use fallback)
    if (!result) {
      console.error('❌ All Gemini models failed - returning failure for fallback handling');
      return {
        success: false,
        topics: [],
        error: lastError?.message || 'All AI models are rate limited or unavailable. Using pattern matching instead.',
        extractedAt: new Date().toISOString()
      };
    }

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

    // Comprehensive topic validation and cleanup
    const invalidPatterns = [
      /^the\s+(detailed|same|above|following|below)/i,  // "The detailed...", "The same..."
      /^(include|includes|including|for\s+the)/i,       // "include description...", "for the..."
      /^(has\s+been|have\s+been|is\s+being)/i,          // "has been uploaded..."
      /^\d+\s*$/,                                        // Just numbers
      /^page\s*\d+/i,                                    // "Page 1"
      /^(section|unit|chapter)\s*$/i,                   // Just "Section" without a name
      /^(a|an|the|in|on|at|to|for|of|with|by)\s*$/i,   // Just prepositions
      /^\s*[-–—:;,\.\(\)]\s*$/,                         // Just punctuation
      /uploaded|website|nmc|notification|eligibility/i, // Administrative text
      /www\.|http|@|\.com|\.org|\.in/i,                 // URLs/emails
      /^\d{4}[-\/]\d{2}[-\/]\d{2}/,                     // Dates
      /phone|email|contact|address|apply/i,             // Contact info
    ];
    
    const uniqueTopics = [...new Set(parsed.topics)]
      .filter((t): t is string => {
        // Must be a string
        if (typeof t !== 'string') return false;
        
        const trimmed = t.trim();
        
        // Must have meaningful length (3-150 chars)
        if (trimmed.length < 3 || trimmed.length > 150) return false;
        
        // Must have at least one letter
        if (!/[a-zA-Z]/.test(trimmed)) return false;
        
        // Must not match invalid patterns
        for (const pattern of invalidPatterns) {
          if (pattern.test(trimmed)) {
            console.log(`  ⚠️ Filtered out invalid topic: "${trimmed.substring(0, 50)}..."`);
            return false;
          }
        }
        
        // Must have at least 2 characters that are letters
        const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
        if (letterCount < 2) return false;
        
        return true;
      })
      .map(t => fixPDFTextIssues(t.trim()));
    
    console.log(`✓ Filtered topics: ${parsed.topics.length} → ${uniqueTopics.length} valid topics`);

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
