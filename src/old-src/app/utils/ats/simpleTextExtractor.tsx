/**
 * Simple Text Extractor for Various File Formats
 * 
 * This utility provides basic text extraction capabilities without requiring
 * external libraries. It's designed as a fallback for the working document parser.
 */

export class SimpleTextExtractor {

  /**
   * Attempts to extract text from any file using multiple strategies
   */
  static async extractText(file: File): Promise<string> {
    console.log('📄 SimpleTextExtractor: Processing file:', file.name, file.type);

    try {
      // Strategy 1: Try reading as UTF-8 text
      const textResult = await this.tryReadAsText(file);
      if (textResult.success && textResult.text.length > 50) {
        console.log('✅ Successfully extracted text via UTF-8 reading');
        return textResult.text;
      }

      // Strategy 2: Try reading as different encodings
      const encodings = ['utf-8', 'windows-1252', 'iso-8859-1'];
      for (const encoding of encodings) {
        try {
          const encodedResult = await this.readFileWithEncoding(file, encoding);
          if (encodedResult && encodedResult.length > 50) {
            console.log(`✅ Successfully extracted text via ${encoding} encoding`);
            return encodedResult;
          }
        } catch (error) {
          console.log(`❌ Failed to read with ${encoding} encoding:`, error.message);
        }
      }

      // Strategy 3: Try to extract text from binary data (for simple PDFs)
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pdfText = await this.extractFromSimplePDF(file);
        if (pdfText && pdfText.length > 50) {
          console.log('✅ Successfully extracted text from simple PDF');
          return pdfText;
        }
      }

      throw new Error('Unable to extract readable text from this file format');

    } catch (error) {
      console.error('❌ SimpleTextExtractor failed:', error);
      throw error;
    }
  }

  /**
   * Tries to read file as plain text
   */
  private static async tryReadAsText(file: File): Promise<{ success: boolean; text: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target?.result as string;
        
        // Check if the result looks like readable text
        if (text && this.isReadableText(text)) {
          resolve({ success: true, text });
        } else {
          resolve({ success: false, text: '' });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: false, text: '' });
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Reads file with specific encoding
   */
  private static async readFileWithEncoding(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && this.isReadableText(text)) {
          resolve(text);
        } else {
          reject(new Error('No readable text found'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file, encoding);
    });
  }

  /**
   * Simple PDF text extraction for text-based PDFs
   */
  private static async extractFromSimplePDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        const text = this.extractTextFromPDFBytes(bytes);
        
        if (text && text.length > 50) {
          resolve(text);
        } else {
          reject(new Error('No text content found in PDF'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read PDF file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extracts text from PDF byte array (very basic approach)
   */
  private static extractTextFromPDFBytes(bytes: Uint8Array): string {
    const text = new TextDecoder('utf-8').decode(bytes);
    
    // Look for text content between common PDF text markers
    const textPatterns = [
      /BT\s*(.*?)\s*ET/gs,  // Text objects
      /\((.*?)\)/g,         // Text in parentheses
      /\[(.*?)\]/g          // Text in brackets
    ];
    
    let extractedText = '';
    
    for (const pattern of textPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanText = match
            .replace(/[()[\]]/g, '')
            .replace(/BT|ET/g, '')
            .replace(/Tf|Td|TD|Tm|TL|Tc|Tw|Tz|TJ|Tj|'/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (cleanText.length > 3 && this.isReadableText(cleanText)) {
            extractedText += cleanText + ' ';
          }
        }
      }
    }
    
    return extractedText.trim();
  }

  /**
   * Checks if text appears to be readable (not binary data)
   */
  private static isReadableText(text: string): boolean {
    if (!text || text.length < 10) return false;
    
    // Check for binary data indicators
    if (text.includes('\0') || text.includes('\u0001') || text.includes('\u0002')) {
      return false;
    }
    
    // Check for PDF binary markers
    if (text.includes('%PDF') && text.includes('endobj')) {
      return false;
    }
    
    // Check for Word document binary markers
    if (text.includes('PK\x03\x04') || text.includes('Microsoft Office')) {
      return false;
    }
    
    // Check for reasonable text content
    const printableChars = text.replace(/[^\x20-\x7E\n\r\t]/g, '').length;
    const totalChars = text.length;
    const printableRatio = printableChars / totalChars;
    
    // Should be mostly printable characters
    return printableRatio > 0.7;
  }

  /**
   * Cleans extracted text by removing common artifacts
   */
  static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common PDF artifacts
      .replace(/[^\x20-\x7E\n\r\t]/g, '')
      // Remove numbers that are likely page numbers or formatting
      .replace(/^\d+\s*$/gm, '')
      // Clean up line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Validates that extracted text is a reasonable resume
   */
  static validateResumeText(text: string): { isValid: boolean; reason?: string } {
    if (!text || text.length < 100) {
      return { isValid: false, reason: 'Text too short to be a resume' };
    }

    // Check for common resume indicators
    const resumeIndicators = [
      /email|@/i,
      /phone|tel|mobile/i,
      /experience|work|employment/i,
      /education|university|college|degree/i,
      /skills|abilities/i
    ];

    const indicatorCount = resumeIndicators.filter(pattern => pattern.test(text)).length;
    
    if (indicatorCount < 2) {
      return { isValid: false, reason: 'Text does not appear to contain resume content' };
    }

    return { isValid: true };
  }
}