import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  method: string;
}

/**
 * Extract text from images using Tesseract.js
 */
export async function extractTextFromImage(imageFile: File): Promise<OCRResult> {
  try {
    console.log('Processing image with Tesseract.js...');
    
    const result = await Tesseract.recognize(imageFile, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`Tesseract Progress: ${(m.progress * 100).toFixed(1)}%`);
        }
      }
    });

    return {
      text: cleanExtractedText(result.data.text),
      confidence: result.data.confidence,
      method: 'tesseract'
    };
  } catch (error) {
    console.error('Image OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text from PDF files
 * Uses native PDF text extraction
 */
export async function extractTextFromPDF(pdfFile: File): Promise<OCRResult> {
  try {
    console.log('Extracting text from PDF...');
    
    // For browser environment, we'll use the file's text method
    // which works for text-based PDFs
    const text = await pdfFile.text();
    
    if (text && text.length > 50) {
      const cleanedText = cleanExtractedText(text);
      console.log(`PDF text extracted: ${cleanedText.length} characters`);
      
      return {
        text: cleanedText,
        confidence: 90,
        method: 'pdf-text-extraction'
      };
    }
    
    throw new Error('PDF appears to be image-based or empty');
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Failed to extract text from PDF. Please ensure it contains selectable text.');
  }
}

/**
 * Extract text from DOCX files
 */
export async function extractTextFromDOCX(docxFile: File): Promise<OCRResult> {
  try {
    console.log('Extracting text from DOCX...');
    
    // For browser, we'll need to send to server-side
    // For now, return a message
    throw new Error('DOCX processing requires server-side handling');
  } catch (error) {
    console.error('DOCX extraction failed:', error);
    throw error;
  }
}

/**
 * Clean extracted text to remove problematic characters
 */
export function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control chars
    .replace(/\uFEFF/g, '') // Remove BOM
    .replace(/[\u2028\u2029]/g, '') // Remove line/paragraph separators
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\n+/g, '\n') // Collapse multiple newlines
    .trim();
}

/**
 * Main function to process uploaded files
 */
export async function processUploadedFile(file: File): Promise<OCRResult> {
  const fileType = file.type.toLowerCase();
  
  try {
    if (fileType.includes('image/')) {
      return await extractTextFromImage(file);
    } else if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (fileType.includes('wordprocessingml')) {
      return await extractTextFromDOCX(file);
    } else if (fileType.includes('text/')) {
      const text = await file.text();
      return {
        text: cleanExtractedText(text),
        confidence: 100,
        method: 'direct-text'
      };
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}
