// ---- Job Listing ----

export interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  portal: string;
  postedDate?: string;
  salaryRange?: string;
  description?: string;
}

// ---- Evaluation Result ----

export interface EvaluationResult {
  score: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  reasoning: string;
}

// ---- Apply Result ----

export interface ApplyResult {
  status: 'submitted' | 'failed' | 'requires_manual';
  confirmationUrl?: string;
  errorMessage?: string;
}

// ---- PDF Result ----

export interface PdfResult {
  filePath: string;
  pages: number;
  fileSize: number;
}

// ---- Pipeline Result ----

export interface PipelineResult {
  processed: number;
  failed: number;
  skipped: number;
  summary: string;
  entries: PipelineEntry[];
}

export interface PipelineEntry {
  url: string;
  title?: string;
  company?: string;
  status: 'processed' | 'failed' | 'skipped';
  error?: string;
}

// ---- Mode Inputs ----

export interface ScanInput {
  portal?: string;
  keywords?: string;
  location?: string;
  limit?: number;
}

export interface EvaluateInput {
  jobUrl: string;
  company?: string;
  jobTitle?: string;
}

export interface ApplyInput {
  jobUrl: string;
  cvPath?: string;
  coverLetter?: string;
}

export interface PdfInput {
  template?: string;
  outputPath?: string;
  format?: 'pdf' | 'latex';
}

export interface PipelineInput {
  limit?: number;
  url?: string;
}

// ---- Mode Outputs ----

export type ScanOutput = JobListing[];
export type EvaluateOutput = EvaluationResult;
export type ApplyOutput = ApplyResult;
export type PdfOutput = PdfResult;
export type PipelineOutput = PipelineResult;
