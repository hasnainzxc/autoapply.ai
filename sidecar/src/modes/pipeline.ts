import type { PipelineInput, PipelineOutput, PipelineEntry } from './schema.js';

export async function handlePipeline(args: PipelineInput): Promise<PipelineOutput> {
  const { limit, url } = args;

  const cmdArgs: string[] = [];
  if (limit) cmdArgs.push(`--limit`, String(limit));
  if (url) cmdArgs.push(`--url`, url);

  const rawOutput: string = JSON.stringify({
    _meta: { command: 'career-ops-pipeline', args: cmdArgs },
    result: null as PipelineOutput | null,
  });

  return parsePipelineOutput(rawOutput);
}

export function parsePipelineOutput(raw: string): PipelineOutput {
  try {
    const parsed = JSON.parse(raw);
    const result = parsed.result ?? parsed;
    if (typeof result.processed === 'number') {
      return {
        processed: result.processed,
        failed: result.failed ?? 0,
        skipped: result.skipped ?? 0,
        summary: result.summary ?? `processed ${result.processed} entries`,
        entries: normalizePipelineEntries(result.entries ?? []),
      };
    }
  } catch {
    // fallthrough
  }

  return { processed: 0, failed: 0, skipped: 0, summary: 'no results', entries: [] };
}

function normalizePipelineEntries(raw: any[]): PipelineEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e: any) => ({
    url: e.url ?? '',
    title: e.title ?? undefined,
    company: e.company ?? undefined,
    status: e.status ?? 'skipped',
    error: e.error ?? undefined,
  }));
}
