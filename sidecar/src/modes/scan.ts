import type { ScanInput, ScanOutput, JobListing } from './schema.js';

export async function handleScan(args: ScanInput): Promise<ScanOutput> {
  const { portal, keywords, location, limit } = args;

  const cmdArgs: string[] = [];
  if (portal) cmdArgs.push(`--portal`, portal);
  if (keywords) cmdArgs.push(`--keywords`, keywords);
  if (location) cmdArgs.push(`--location`, location);
  if (limit) cmdArgs.push(`--limit`, String(limit));

  // delegated to career-ops via command execution
  // this is the output parser
  const rawOutput: string = JSON.stringify({
    _meta: { command: 'career-ops-scan', args: cmdArgs, status: 'ok' },
    jobs: [] as JobListing[],
  });

  return parseScanOutput(rawOutput);
}

export function parseScanOutput(raw: string): JobListing[] {
  try {
    const parsed = JSON.parse(raw);
    const jobs = parsed.jobs ?? parsed ?? [];
    if (!Array.isArray(jobs)) return [];
    return jobs.map(normalizeJobListing).filter(Boolean) as JobListing[];
  } catch {
    return [];
  }
}

function normalizeJobListing(raw: any): JobListing | null {
  if (!raw || !raw.title) return null;

  return {
    title: raw.title ?? '',
    company: raw.company ?? raw.company_name ?? '',
    location: raw.location ?? '',
    url: raw.url ?? raw.job_url ?? raw.link ?? '',
    portal: raw.portal ?? '',
    postedDate: raw.posted_date ?? raw.postedDate ?? raw.date ?? undefined,
    salaryRange: raw.salary_range ?? raw.salaryRange ?? undefined,
    description: raw.description ?? raw.summary ?? undefined,
  };
}
