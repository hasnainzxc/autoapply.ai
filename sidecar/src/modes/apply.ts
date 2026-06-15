import type { ApplyInput, ApplyOutput } from './schema.js';

export async function handleApply(args: ApplyInput): Promise<ApplyOutput> {
  const { jobUrl, cvPath, coverLetter } = args;

  const cmdArgs: string[] = [`--url`, jobUrl];
  if (cvPath) cmdArgs.push(`--cv`, cvPath);
  if (coverLetter) cmdArgs.push(`--cover-letter`, coverLetter);

  const rawOutput: string = JSON.stringify({
    _meta: { command: 'career-ops-apply', args: cmdArgs },
    result: null as ApplyOutput | null,
  });

  return parseApplyOutput(rawOutput);
}

export function parseApplyOutput(raw: string): ApplyOutput {
  try {
    const parsed = JSON.parse(raw);
    const result = parsed.result ?? parsed;
    if (result.status) {
      return {
        status: result.status,
        confirmationUrl: result.confirmation_url ?? result.confirmationUrl ?? undefined,
        errorMessage: result.error_message ?? result.errorMessage ?? undefined,
      };
    }
  } catch {
    // fallthrough
  }

  return { status: 'failed', errorMessage: 'could not parse apply result' };
}
