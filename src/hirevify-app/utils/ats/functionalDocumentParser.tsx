/**
 * Functional Document Parser - Enhanced Text Extraction
 * 
 * Provides robust text extraction from various document formats
 * with multiple fallback strategies for maximum reliability.
 */

interface ParseResult {
 success: boolean;
 rawText: string;
 metadata: {
 fileName: string;
 fileSize: number;
 fileType: string;
 wordCount: number;
 processingTime: number;
 };
 errors: string[];
}

class FunctionalDocumentParser {
 
 /**
 * Parse PDF files using multiple extraction strategies
 */
 async parsePDF(file: File): Promise<ParseResult> {
 const startTime = Date.now();
 const metadata = {
 fileName: file.name,
 fileSize: file.size,
 fileType: file.type,
 wordCount: 0,
 processingTime: 0
 };

 try {
 // Strategy 1: Try to import and use pdf-lib if available
 let text = '';
 
 try {
 // Attempt binary text extraction
 const arrayBuffer = await file.arrayBuffer();
 text = await this.extractTextFromPDFBuffer(arrayBuffer);
 } catch (error) {
 console.warn('PDF binary extraction failed:', error);
 }

 // Strategy 2: If no meaningful text, try alternative methods
 if (!text || text.length < 50) {
 text = await this.fallbackPDFExtraction(file);
 }

 // Validate and clean text
 const cleanedText = this.cleanExtractedText(text);
 const wordCount = this.countWords(cleanedText);

 metadata.wordCount = wordCount;
 metadata.processingTime = Date.now() - startTime;

 if (cleanedText.length < 20) {
 return {
 success: false,
 rawText: '',
 metadata,
 errors: ['PDF appears to be image-based or corrupted. Please try a text-based PDF or convert to DOCX.']
 };
 }

 return {
 success: true,
 rawText: cleanedText,
 metadata,
 errors: []
 };

 } catch (error) {
 return {
 success: false,
 rawText: '',
 metadata: {...metadata,
 processingTime: Date.now() - startTime
 },
 errors: [error instanceof Error? error.message: 'PDF parsing failed']
 };
 }
 }

 /**
 * Parse DOCX files 
 */
 async parseDOCX(file: File): Promise<ParseResult> {
 const startTime = Date.now();
 const metadata = {
 fileName: file.name,
 fileSize: file.size,
 fileType: file.type,
 wordCount: 0,
 processingTime: 0
 };

 try {
 // DOCX files are ZIP archives - we can extract the text from document.xml
 const arrayBuffer = await file.arrayBuffer();
 const text = await this.extractTextFromDOCX(arrayBuffer);
 
 const cleanedText = this.cleanExtractedText(text);
 const wordCount = this.countWords(cleanedText);

 metadata.wordCount = wordCount;
 metadata.processingTime = Date.now() - startTime;

 if (cleanedText.length < 20) {
 return {
 success: false,
 rawText: '',
 metadata,
 errors: ['DOCX file appears to be empty or corrupted.']
 };
 }

 return {
 success: true,
 rawText: cleanedText,
 metadata,
 errors: []
 };

 } catch (error) {
 return {
 success: false,
 rawText: '',
 metadata: {...metadata,
 processingTime: Date.now() - startTime
 },
 errors: [error instanceof Error? error.message: 'DOCX parsing failed']
 };
 }
 }

 /**
 * Parse DOC files (legacy Word format)
 */
 async parseDOC(file: File): Promise<ParseResult> {
 const startTime = Date.now();
 const metadata = {
 fileName: file.name,
 fileSize: file.size,
 fileType: file.type,
 wordCount: 0,
 processingTime: 0
 };

 try {
 // DOC files are binary - attempt basic text extraction
 const arrayBuffer = await file.arrayBuffer();
 const text = await this.extractTextFromDOC(arrayBuffer);
 
 const cleanedText = this.cleanExtractedText(text);
 const wordCount = this.countWords(cleanedText);

 metadata.wordCount = wordCount;
 metadata.processingTime = Date.now() - startTime;

 if (cleanedText.length < 20) {
 return {
 success: false,
 rawText: '',
 metadata,
 errors: ['DOC file parsing incomplete. Please save as DOCX or PDF for better results.']
 };
 }

 return {
 success: true,
 rawText: cleanedText,
 metadata,
 errors: wordCount < 50? ['DOC parsing may be incomplete - consider converting to DOCX']: []
 };

 } catch (error) {
 return {
 success: false,
 rawText: '',
 metadata: {...metadata,
 processingTime: Date.now() - startTime
 },
 errors: [error instanceof Error? error.message: 'DOC parsing failed']
 };
 }
 }

 /**
 * Parse plain text files
 */
 async parseText(file: File): Promise<ParseResult> {
 const startTime = Date.now();
 const metadata = {
 fileName: file.name,
 fileSize: file.size,
 fileType: file.type,
 wordCount: 0,
 processingTime: 0
 };

 try {
 const text = await file.text();
 const cleanedText = this.cleanExtractedText(text);
 const wordCount = this.countWords(cleanedText);

 metadata.wordCount = wordCount;
 metadata.processingTime = Date.now() - startTime;

 return {
 success: true,
 rawText: cleanedText,
 metadata,
 errors: []
 };

 } catch (error) {
 return {
 success: false,
 rawText: '',
 metadata: {...metadata,
 processingTime: Date.now() - startTime
 },
 errors: [error instanceof Error? error.message: 'Text file parsing failed']
 };
 }
 }

 /**
 * Extract text from PDF buffer using binary analysis
 */
 private async extractTextFromPDFBuffer(buffer: ArrayBuffer): Promise<string> {
 const uint8Array = new Uint8Array(buffer);
 const decoder = new TextDecoder('utf-8', { fatal: false });
 
 // Convert buffer to string
 let rawText = decoder.decode(uint8Array);
 
 // Extract text objects from PDF structure
 const textObjects: string[] = [];
 
 // Look for text streams in PDF
 const textStreamRegex = /BT\s+(.*?)\s+ET/gs;
 let match;
 
 while ((match = textStreamRegex.exec(rawText))!== null) {
 const textStream = match[1];
 
 // Extract text from Tj operators
 const tjRegex = /\((.*?)\)\s*Tj/g;
 let tjMatch;
 while ((tjMatch = tjRegex.exec(textStream))!== null) {
 textObjects.push(tjMatch[1]);
 }
 
 // Extract text from TJ operators (array format)
 const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
 let tjArrayMatch;
 while ((tjArrayMatch = tjArrayRegex.exec(textStream))!== null) {
 const arrayContent = tjArrayMatch[1];
 const stringRegex = /\((.*?)\)/g;
 let stringMatch;
 while ((stringMatch = stringRegex.exec(arrayContent))!== null) {
 textObjects.push(stringMatch[1]);
 }
 }
 }
 
 // Fallback: extract readable text patterns
 if (textObjects.length === 0) {
 const readableTextRegex = /[A-Za-z0-9@.\-\s(),]{15,}/g;
 const matches = rawText.match(readableTextRegex) || [];
 
 return matches.filter(match => this.isLikelyText(match)).join(' ').replace(/\s+/g, ' ').trim();
 }
 
 return textObjects.join(' ').replace(/\s+/g, ' ').trim();
 }

 /**
 * Fallback PDF extraction method
 */
 private async fallbackPDFExtraction(file: File): Promise<string> {
 const arrayBuffer = await file.arrayBuffer();
 const decoder = new TextDecoder('utf-8', { fatal: false });
 
 // Try different encodings
 const encodings = ['utf-8', 'latin1', 'ascii'];
 
 for (const encoding of encodings) {
 try {
 const text = new TextDecoder(encoding, { fatal: false }).decode(arrayBuffer);
 const extracted = this.extractReadableText(text);
 
 if (extracted.length > 100) {
 return extracted;
 }
 } catch (error) {
 continue;
 }
 }
 
 return '';
 }

 /**
 * Extract text from DOCX (ZIP-based format)
 */
 private async extractTextFromDOCX(buffer: ArrayBuffer): Promise<string> {
 // DOCX files are ZIP archives containing XML files
 // For a functional prototype, we'll do basic text extraction
 
 const decoder = new TextDecoder('utf-8', { fatal: false });
 const text = decoder.decode(buffer);
 
 // Look for document.xml content patterns
 const xmlTextRegex = /<w:t[^>]*>(.*?)<\/w:t>/gs;
 const textElements: string[] = [];
 
 let match;
 while ((match = xmlTextRegex.exec(text))!== null) {
 const content = match[1].replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&').replace(/&quot;/g, '"');
 
 if (content.trim()) {
 textElements.push(content.trim());
 }
 }
 
 if (textElements.length > 0) {
 return textElements.join(' ');
 }
 
 // Fallback: extract readable text patterns
 return this.extractReadableText(text);
 }

 /**
 * Extract text from DOC (binary format)
 */
 private async extractTextFromDOC(buffer: ArrayBuffer): Promise<string> {
 const decoder = new TextDecoder('utf-8', { fatal: false });
 const text = decoder.decode(buffer);
 
 // DOC files are complex binary format
 // This is a basic extraction that may not work perfectly
 return this.extractReadableText(text);
 }

 /**
 * Extract readable text patterns from any text
 */
 private extractReadableText(text: string): string {
 // Look for readable text patterns
 const readablePatterns = [
 // Email addresses
 /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
 // Phone numbers
 /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
 // URLs
 /https?:\/\/[^\s]+/g,
 // Words and sentences (at least 15 characters)
 /[A-Za-z][A-Za-z0-9\s.,!?;:()\-'"]{15,}/g
 ];
 
 const extractedTexts: string[] = [];
 
 for (const pattern of readablePatterns) {
 const matches = text.match(pattern) || [];
 extractedTexts.push(...matches);
 }
 
 // Remove duplicates and filter
 const uniqueTexts = [...new Set(extractedTexts)].filter(t => this.isLikelyText(t)).join(' ');
 
 return uniqueTexts.replace(/\s+/g, ' ').trim();
 }

 /**
 * Check if a string is likely to be meaningful text
 */
 private isLikelyText(text: string): boolean {
 // Filter out likely binary data or noise
 const cleanText = text.trim();
 
 if (cleanText.length < 10) return false;
 
 // Check character distribution
 const letterCount = (cleanText.match(/[a-zA-Z]/g) || []).length;
 const digitCount = (cleanText.match(/[0-9]/g) || []).length;
 const spaceCount = (cleanText.match(/\s/g) || []).length;
 
 const totalChars = cleanText.length;
 const letterRatio = letterCount / totalChars;
 const digitRatio = digitCount / totalChars;
 const spaceRatio = spaceCount / totalChars;
 
 // Good text should have reasonable letter ratio and some spaces
 return letterRatio > 0.3 && spaceRatio > 0.05 && spaceRatio < 0.5;
 }

 /**
 * Clean and normalize extracted text
 */
 private cleanExtractedText(text: string): string {
 return text.replace(/\r\n/g, '\n') // Normalize line endings.replace(/\r/g, '\n') // Normalize line endings.replace(/\t/g, ' ') // Replace tabs with spaces.replace(/\s{3,}/g, '\n') // Multiple spaces become line breaks.replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n').trim();
 }

 /**
 * Count words in text
 */
 private countWords(text: string): number {
 return text.split(/\s+/).filter(word => word.length > 0).length;
 }

 /**
 * Universal document processor that tries all strategies
 */
 async processDocument(file: File): Promise<ParseResult> {
 const fileType = file.type.toLowerCase();
 const fileName = file.name.toLowerCase();

 // Route to appropriate parser
 if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
 return this.parsePDF(file);
 }
 
 if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
 return this.parseDOCX(file);
 }
 
 if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
 return this.parseDOC(file);
 }
 
 if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
 return this.parseText(file);
 }

 // If we can't determine the type, try as text first
 try {
 const textResult = await this.parseText(file);
 if (textResult.success) {
 return textResult;
 }
 } catch (error) {
 // Fall through to error
 }

 return {
 success: false,
 rawText: '',
 metadata: {
 fileName: file.name,
 fileSize: file.size,
 fileType: file.type,
 wordCount: 0,
 processingTime: 0
 },
 errors: [`Unsupported file type: ${fileType}. Please use PDF, DOCX, DOC, or TXT files.`]
 };
 }
}

// Export singleton instance
export const functionalDocumentParser = new FunctionalDocumentParser();






