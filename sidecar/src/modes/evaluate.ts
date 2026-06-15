import type { EvaluateInput, EvaluateOutput } from './schema.js';

export async function handleEvaluate(args: EvaluateInput): Promise<EvaluateOutput> {
  const { jobUrl, company, jobTitle } = args;

  const cmdArgs: string[] = [`--url`, jobUrl];
  if (company) cmdArgs.push(`--company`, company);
  if (jobTitle) cmdArgs.push(`--title`, jobTitle);

  const rawOutput: string = JSON.stringify({
    _meta: { command: 'career-ops-evaluate', args: cmdArgs },
    result: null as EvaluateOutput | null,
  });

  return parseEvaluateOutput(rawOutput, jobUrl);
}

export function parseEvaluateOutput(raw: string, _fallbackUrl: string): EvaluateOutput {
  try {
    const parsed = JSON.parse(raw);
    const result = parsed.result ?? parsed;

    if (result.score && result.matchPercentage !== undefined) {
      return {
        score: result.score,
        matchPercentage: result.matchPercentage,
        strengths: result.strengths ?? [],
        weaknesses: result.weaknesses ?? [],
        recommendations: result.recommendations ?? [],
        reasoning: result.reasoning ?? '',
      };
    }
  } catch {
    // fallthrough
  }

  return {
    score: 'F',
    matchPercentage: 0,
    strengths: [],
    weaknesses: ['could not parse evaluation result'],
    recommendations: [],
    reasoning: 'parse failure',
  };
}
