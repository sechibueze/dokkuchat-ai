// import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
}

export function detectFormat(filename: string): SupportedFormat {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'txt':
      return 'text';
    case 'md':
      return 'markdown';
    case 'pdf':
      return 'pdf';
    default:
      throw new Error(`Unsupported file format: .${ext}`);
  }
}

export interface TextExtractor {
  extract(buffer: Buffer, mimeType: string): Promise<ExtractedDocument>;
}

export class BasicTextExtractor implements TextExtractor {
  async extract(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();

      return {
        text: result.text,
        pageCount: result.total,
      };
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });

      return { text: result.value };
    }

    if (mimeType === 'text/plain') {
      return { text: buffer.toString('utf8') };
    }

    throw new Error('Unsupported document type');
  }
}
