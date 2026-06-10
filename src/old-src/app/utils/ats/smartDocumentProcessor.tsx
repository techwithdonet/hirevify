/**
 * Smart Document Processor
 * 
 * Handles multiple file formats and converts them to text for AI processing
 * Supports PDF, DOC, DOCX, TXT with robust error handling
 */

interface ProcessingResult {
  success: boolean;
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount?: number;
    wordCount: number;
    processingTime: number;
  };
  errors: string[];
}

class SmartDocumentProcessor {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ];

  async processDocument(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          text: '',
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            wordCount: 0,
            processingTime: Date.now() - startTime
          },
          errors: validation.errors
        };
      }

      // Process based on file type
      let extractedText: string;
      let pageCount: number | undefined;

      switch (file.type) {
        case 'application/pdf':
          const pdfResult = await this.processPDF(file);
          extractedText = pdfResult.text;
          pageCount = pdfResult.pageCount;
          break;
          
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await this.processWord(file);
          break;
          
        case 'text/plain':
        case 'text/rtf':
          extractedText = await this.processText(file);
          break;
          
        default:
          // Try to process as text if type detection failed
          extractedText = await this.processText(file);
      }

      // Clean and validate extracted text
      const cleanedText = this.cleanExtractedText(extractedText);
      const wordCount = this.countWords(cleanedText);

      if (cleanedText.length < 50) {
        return {
          success: false,
          text: cleanedText,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            pageCount,
            wordCount,
            processingTime: Date.now() - startTime
          },
          errors: ['Document appears to be empty or corrupted']
        };
      }

      return {
        success: true,
        text: cleanedText,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          pageCount,
          wordCount,
          processingTime: Date.now() - startTime
        },
        errors: []
      };

    } catch (error) {
      console.error('Document processing error:', error);
      
      return {
        success: false,
        text: '',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          wordCount: 0,
          processingTime: Date.now() - startTime
        },
        errors: [error instanceof Error ? error.message : 'Unknown processing error']
      };
    }
  }

  private validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.MAX_FILE_SIZE)})`);
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check file type (flexible - allow unknown types to be processed as text)
    const isSupported = this.SUPPORTED_TYPES.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.pdf') ||
                       file.name.toLowerCase().endsWith('.doc') ||
                       file.name.toLowerCase().endsWith('.docx') ||
                       file.name.toLowerCase().endsWith('.txt') ||
                       file.name.toLowerCase().endsWith('.rtf');

    if (!isSupported) {
      // Don't fail - just warn and try to process as text
      console.warn(`Unsupported file type: ${file.type}. Attempting to process as text.`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async processPDF(file: File): Promise<{ text: string; pageCount: number }> {
    try {
      // For PDFs, we'll use a more robust approach
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Check if it's a real PDF file
      const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
      
      if (!isPDF) {
        throw new Error('Not a valid PDF file');
      }
      
      // Extract text from PDF using multiple strategies
      let extractedText = '';
      
      // Strategy 1: Look for text streams in the PDF
      const pdfString = new TextDecoder('latin1').decode(bytes);
      
      // ENHANCED: Multiple PDF extraction strategies
      // Find text objects in PDF
      const textObjects = pdfString.match(/BT[\s\S]*?ET/g) || [];
      
      for (const textObj of textObjects) {
        // Extract text from PDF text objects - multiple patterns
        const textMatches = [
          ...textObj.matchAll(/\((.*?)\)[\s]*Tj/g),
          ...textObj.matchAll(/\[(.*?)\][\s]*TJ/g),
          ...textObj.matchAll(/\((.*?)\)[\s]*'/g)
        ];
        
        for (const match of textMatches) {
          if (match[1]) {
            extractedText += match[1] + ' ';
          }
        }
      }
      
      // Strategy 2: Look for streams with FlateDecode
      const streamMatches = pdfString.match(/stream\s([\s\S]*?)\sendstream/g) || [];
      for (const stream of streamMatches) {
        // Look for readable text in streams
        const readableText = stream.match(/[A-Za-z0-9@\.\-\s]{5,}/g) || [];
        for (const text of readableText) {
          if (text.length > 10 && /[a-zA-Z]/.test(text)) {
            extractedText += text + ' ';
          }
        }
      }
      
      // Strategy 3: Look for plain text in the PDF (broader pattern)
      if (extractedText.length < 100) {
        const plainTextRegex = /[A-Za-z0-9@\.\-\s]{3,}/g;
        const plainTextMatches = pdfString.match(plainTextRegex) || [];
        
        for (const match of plainTextMatches) {
          if (match.length > 10 && /[a-zA-Z]/.test(match)) {
            extractedText += match + ' ';
          }
        }
      }
      
      // Strategy 4: Look for contact information patterns specifically
      if (extractedText.length < 200) {
        const contactPatterns = [
          /([A-Z][a-z]+ [A-Z][a-z]+)/, // Names
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, // Emails
          /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/, // Phones
          /([A-Z][a-z]+,\s*[A-Z]{2,})/, // Locations
        ];
        
        for (const pattern of contactPatterns) {
          const matches = pdfString.match(new RegExp(pattern.source, 'g')) || [];
          for (const match of matches) {
            extractedText += match + ' ';
          }
        }
      }
      
      // Clean up extracted text
      extractedText = extractedText
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-ASCII
        .trim();
      
      // If we got meaningful text, return it
      if (extractedText.length > 50 && /[a-zA-Z@\.]/.test(extractedText)) {
        return { text: extractedText, pageCount: 1 };
      }
      
      // Fallback: Return instructions for user with more guidance
      return {
        text: `PDF detected: ${file.name}. 

This appears to be a scanned PDF, image-based PDF, or password-protected PDF. 

For best results, please try one of these options:
1. Use a text-based PDF (not scanned images)
2. Convert to Word (.docx) or Plain Text (.txt) format
3. Copy and paste the content directly into a text file
4. If password-protected, unlock the PDF first
5. Try using PDF-to-Word converters online

The ATS scanner works best with machine-readable text rather than images of text.`,
        pageCount: 1
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Check if it's a real Word document
      const isDocx = bytes[0] === 0x50 && bytes[1] === 0x4B; // ZIP signature for DOCX
      const isDoc = bytes[0] === 0xD0 && bytes[1] === 0xCF; // OLE signature for DOC
      
      if (!isDocx && !isDoc) {
        // Try as plain text
        return await this.processText(file);
      }
      
      let extractedText = '';
      
      if (isDocx) {
        // Process DOCX file
        extractedText = await this.processDocx(bytes);
      } else {
        // Process DOC file
        extractedText = await this.processDoc(bytes);
      }
      
      if (extractedText.length < 50) {
        return `Word document detected: ${file.name}. The document appears to be empty or contains mainly images/formatting. For best results, please:
1. Ensure the document contains readable text
2. Save as Plain Text (.txt) format
3. Copy and paste the content directly

If this is a text-rich document and you're seeing this message, please try converting to a plain text file.`;
      }
      
      return extractedText;
    } catch (error) {
      throw new Error(`Word document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processDocx(bytes: Uint8Array): Promise<string> {
    try {
      // DOCX is a ZIP file containing XML documents
      // We'll extract text from the document.xml file
      
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(bytes);
      
      // Look for XML content that might contain text
      const xmlMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      let extractedText = '';
      
      for (const match of xmlMatches) {
        const text = match.replace(/<w:t[^>]*>|<\/w:t>/g, '');
        if (text.trim()) {
          extractedText += text + ' ';
        }
      }
      
      // Also look for paragraph content
      const paragraphMatches = content.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g) || [];
      
      for (const paragraph of paragraphMatches) {
        const textElements = paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
        for (const textEl of textElements) {
          const text = textEl.replace(/<w:t[^>]*>|<\/w:t>/g, '');
          if (text.trim()) {
            extractedText += text + ' ';
          }
        }
      }
      
      return this.cleanExtractedText(extractedText);
    } catch (error) {
      return await this.processDocFallback(bytes);
    }
  }

  private async processDoc(bytes: Uint8Array): Promise<string> {
    try {
      // DOC files are more complex - use fallback approach
      return await this.processDocFallback(bytes);
    } catch (error) {
      return await this.processDocFallback(bytes);
    }
  }

  private async processDocFallback(bytes: Uint8Array): Promise<string> {
    // Fallback: Extract readable text using character analysis
    let text = '';
    let consecutiveNulls = 0;
    
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      
      // Count consecutive null bytes
      if (char === 0) {
        consecutiveNulls++;
        if (consecutiveNulls < 3) {
          text += ' ';
        }
        continue;
      } else {
        consecutiveNulls = 0;
      }
      
      // Extract readable ASCII characters
      if (char >= 32 && char <= 126) {
        text += String.fromCharCode(char);
      } else if (char === 10) {
        text += '\n';
      } else if (char === 13) {
        text += '\r';
      } else if (char === 9) {
        text += '\t';
      }
    }
    
    // Clean up the extracted text
    text = text
      .replace(/\x00+/g, ' ') // Remove null characters
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/(.)\1{10,}/g, '$1') // Remove long repeated characters
      .trim();
    
    // Filter out gibberish - keep only sections with meaningful text
    const lines = text.split('\n');
    const meaningfulLines = lines.filter(line => {
      const cleanLine = line.trim();
      // Keep lines that have reasonable word patterns
      return cleanLine.length > 3 && 
             cleanLine.split(' ').length > 1 && 
             /[a-zA-Z]/.test(cleanLine) &&
             !(/^[^a-zA-Z]*$/.test(cleanLine)); // Not just symbols/numbers
    });
    
    return meaningfulLines.join('\n');
  }

  private async processText(file: File): Promise<string> {
    try {
      const text = await file.text();
      return text;
    } catch (error) {
      // Try reading as binary and converting
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        return decoder.decode(arrayBuffer);
      } catch (fallbackError) {
        throw new Error(`Text file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Batch processing for multiple files
  async processMultipleDocuments(files: File[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processDocument(file);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          text: '',
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            wordCount: 0,
            processingTime: 0
          },
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }
    
    return results;
  }

  // Get processing statistics
  getProcessingStats(results: ProcessingResult[]) {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const totalWords = results.reduce((sum, r) => sum + r.metadata.wordCount, 0);
    const totalSize = results.reduce((sum, r) => sum + r.metadata.fileSize, 0);
    const avgProcessingTime = results.reduce((sum, r) => sum + r.metadata.processingTime, 0) / results.length;

    return {
      totalFiles: results.length,
      successful,
      failed,
      successRate: results.length > 0 ? (successful / results.length) * 100 : 0,
      totalWords,
      totalSize: this.formatFileSize(totalSize),
      avgProcessingTime: Math.round(avgProcessingTime),
      supportedTypes: this.SUPPORTED_TYPES
    };
  }
}

// Export singleton instance
export const documentProcessor = new SmartDocumentProcessor();

// Export types
export type { ProcessingResult };