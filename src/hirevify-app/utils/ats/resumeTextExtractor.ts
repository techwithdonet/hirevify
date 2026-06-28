export type ResumeTextExtractionResult = {
  text: string;
  method: string;
  warnings: string[];
};

export const RESUME_UPLOAD_MAX_SIZE_MB = 30;
export const RESUME_UPLOAD_MAX_SIZE_BYTES = RESUME_UPLOAD_MAX_SIZE_MB * 1024 * 1024;
export const RESUME_EXTRACT_MAX_CHARS = 30000;

function cleanExtractedText(text: string) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u0000/g, '')
    .replace(/[ \f\v]{3,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function extractTextFile(file: File) {
  return cleanExtractedText(await file.text());
}

async function extractDocx(file: File) {
  const mammothModule: any = await import('mammoth');
  const mammoth = mammothModule.default || mammothModule;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return cleanExtractedText(result.value || '');
}

async function extractPdf(file: File) {
  const pdfjsLib: any = await import('pdfjs-dist');

  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: { str?: string }) => item.str || '')
      .filter(Boolean)
      .join(' ');

    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  return cleanExtractedText(pages.join('\n\n'));
}

async function extractBinaryFallback(file: File) {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  // Limit matches considered so a 30MB PDF binary doesn't produce megabytes of pseudo-text.
  const limitedSlice = text.slice(0, 2 * 1024 * 1024);
  const useful = limitedSlice.match(/[A-Za-z0-9@.,;:()/'"+#&\-\s]{20,}/g) || [];
  const joined = useful.join(' ').slice(0, RESUME_EXTRACT_MAX_CHARS);
  return cleanExtractedText(joined);
}

export async function extractResumeText(file: File): Promise<ResumeTextExtractionResult> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const warnings: string[] = [];

  if (!file || file.size === 0) {
    throw new Error('The selected file is empty.');
  }

  if (file.size > RESUME_UPLOAD_MAX_SIZE_BYTES) {
    throw new Error(`File is too large. Please upload a file under ${RESUME_UPLOAD_MAX_SIZE_MB}MB.`);
  }

  const attempts: Array<{ method: string; run: () => Promise<string> }> = [];

  if (type.includes('pdf') || name.endsWith('.pdf')) {
    attempts.push({ method: 'PDF.js text extraction', run: () => extractPdf(file) });
  }

  if (type.includes('wordprocessingml') || name.endsWith('.docx')) {
    attempts.push({ method: 'Mammoth DOCX extraction', run: () => extractDocx(file) });
  }

  attempts.push({ method: 'Plain text extraction', run: () => extractTextFile(file) });
  attempts.push({ method: 'Binary text fallback', run: () => extractBinaryFallback(file) });

  for (const attempt of attempts) {
    try {
      const text = await attempt.run();

      if (text && text.replace(/\s/g, '').length >= 40) {
        return {
          text: text.slice(0, RESUME_EXTRACT_MAX_CHARS),
          method: attempt.method,
          warnings
        };
      }

      warnings.push(`${attempt.method} returned too little readable text.`);
    } catch (error) {
      warnings.push(`${attempt.method} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new Error(
    'Could not extract readable resume text from this file. Please upload a text-based PDF, DOCX, or TXT file.',
  );
}
