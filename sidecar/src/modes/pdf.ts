import type { PdfInput, PdfResult } from './schema.js';

export async function handlePdf(args: PdfInput): Promise<PdfResult> {
  const { template, outputPath, format } = args;

  const cmdArgs: string[] = [];
  if (template) cmdArgs.push(`--template`, template);
  if (outputPath) cmdArgs.push(`--output`, outputPath);
  if (format) cmdArgs.push(`--format`, format);

  const rawOutput: string = JSON.stringify({
    _meta: { command: 'career-ops-pdf', args: cmdArgs },
    result: null as PdfResult | null,
  });

  return parsePdfOutput(rawOutput);
}

export function parsePdfOutput(raw: string): PdfResult {
  try {
    const parsed = JSON.parse(raw);
    const result = parsed.result ?? parsed;
    if (result.filePath || result.file_path) {
      return {
        filePath: result.filePath ?? result.file_path ?? '',
        pages: result.pages ?? 1,
        fileSize: result.fileSize ?? result.file_size ?? 0,
      };
    }
  } catch {
    // fallthrough
  }

  return { filePath: '', pages: 0, fileSize: 0 };
}
