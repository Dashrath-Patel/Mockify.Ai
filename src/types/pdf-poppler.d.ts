// Type definitions for pdf-poppler
// Project: https://github.com/Dalai-Mah/pdf-poppler
// Definitions by: MockifyAI Team

declare module 'pdf-poppler' {
  export interface ConvertOptions {
    format?: 'png' | 'jpeg' | 'tiff' | 'ps' | 'eps' | 'pdf' | 'svg';
    out_dir?: string;
    out_prefix?: string;
    page?: number | null;
    scale?: number;
    width?: number;
    height?: number;
  }

  export interface InfoOptions {
    firstPageToConvert?: number;
    lastPageToConvert?: number;
  }

  export function convert(
    pdfPath: string | Buffer,
    opts?: ConvertOptions
  ): Promise<string[]>;

  export function info(
    pdfPath: string,
    opts?: InfoOptions
  ): Promise<any>;
}
