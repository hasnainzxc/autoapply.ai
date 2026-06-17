"use client";

import { ExternalLink } from "lucide-react";

interface ScanResultJob {
  title: string;
  company: string;
  location: string;
  url: string;
  portal: string;
  postedDate?: string;
  salaryRange?: string;
}

interface ScanResultsProps {
  jobs: ScanResultJob[];
}

export function ScanResults({ jobs }: ScanResultsProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="p-4 text-center text-[#6B6B6B] text-sm">No jobs found</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-3 text-[#6B6B6B] font-medium">Title</th>
            <th className="text-left py-2 px-3 text-[#6B6B6B] font-medium">Company</th>
            <th className="text-left py-2 px-3 text-[#6B6B6B] font-medium">Location</th>
            <th className="text-left py-2 px-3 text-[#6B6B6B] font-medium">Portal</th>
            <th className="text-left py-2 px-3 text-[#6B6B6B] font-medium">Date</th>
            <th className="text-left py-2 px-3 text-[#6B6B6B] font-medium">Link</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-2 px-3 text-[#E4E2DD]">{job.title}</td>
              <td className="py-2 px-3 text-[#E4E2DD]">{job.company}</td>
              <td className="py-2 px-3 text-[#6B6B6B]">{job.location}</td>
              <td className="py-2 px-3 text-[#6B6B6B]">{job.portal}</td>
              <td className="py-2 px-3 text-[#6B6B6B] text-xs">
                {job.postedDate ?? "-"}
              </td>
              <td className="py-2 px-3">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FACC15] hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
