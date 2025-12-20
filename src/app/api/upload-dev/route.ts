import { NextRequest, NextResponse } from 'next/server'
import { processFileServerSide } from '@/lib/server-ocr'
import { isDevMode, getDevUser, logDevModeStatus } from '@/lib/dev-mode'

// Development-friendly upload API that works without Supabase
export async function POST(request: NextRequest) {
  try {
    logDevModeStatus();
    
    if (!isDevMode()) {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      )
    }

    console.log('🔧 Processing file upload in development mode...')

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, image, or text files.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    console.log(`📁 Processing file: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Process file for text extraction
    try {
      console.log('🔍 Starting server-side OCR processing...')
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const ocrResult = await processFileServerSide(fileBuffer, file.type, file.name)
      
      console.log(`✅ OCR completed: ${ocrResult.text.length} chars, ${ocrResult.confidence}% confidence`)

      // Create mock material record for development
      const mockMaterial = {
        id: `dev-material-${Date.now()}`,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence,
        processingMethod: ocrResult.method,
        processingStatus: 'completed',
        uploadedAt: new Date().toISOString(),
        user: getDevUser()
      }

      return NextResponse.json({
        success: true,
        message: 'File processed successfully in development mode',
        material: mockMaterial,
        devMode: true,
        ocr: {
          method: ocrResult.method,
          confidence: ocrResult.confidence,
          textLength: ocrResult.text.length,
          pageCount: ocrResult.pageCount
        }
      })

    } catch (ocrError) {
      console.error('❌ OCR processing error:', ocrError)
      
      return NextResponse.json({
        success: false,
        error: 'Text extraction failed',
        details: ocrError instanceof Error ? ocrError.message : 'Unknown OCR error',
        devMode: true
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in development upload API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        devMode: true
      },
      { status: 500 }
    )
  }
}