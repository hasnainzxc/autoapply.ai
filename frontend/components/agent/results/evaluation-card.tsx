"use client";

interface EvaluationCardProps {
  score: string;
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  reasoning: string;
}

const scoreColors: Record<string, string> = {
  A: "text-green-400 border-green-400/30 bg-green-400/10",
  B: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  C: "text-[#FACC15] border-[#FACC15]/30 bg-[#FACC15]/10",
  D: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  E: "text-red-400 border-red-400/30 bg-red-400/10",
  F: "text-red-500 border-red-500/30 bg-red-500/10",
};

export function EvaluationCard({
  score,
  matchPercentage,
  strengths,
  weaknesses,
  recommendations,
  reasoning,
}: EvaluationCardProps) {
  const colorClass = scoreColors[score] ?? scoreColors.F;

  return (
    <div className="space-y-4 p-4">
      {/* Score */}
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold ${colorClass}`}
        >
          {score}
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-[#6B6B6B]">Match</span>
            <span className="text-sm text-[#E4E2DD]">{matchPercentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FACC15] transition-all"
              style={{ width: `${matchPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <p className="text-sm text-[#6B6B6B] italic">{reasoning}</p>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <h4 className="text-xs text-green-400 mb-1 font-medium uppercase tracking-wide">
            Strengths
          </h4>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-[#E4E2DD] flex items-start gap-2">
                <span className="text-green-400 mt-0.5">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div>
          <h4 className="text-xs text-red-400 mb-1 font-medium uppercase tracking-wide">
            Weaknesses
          </h4>
          <ul className="space-y-1">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-[#E4E2DD] flex items-start gap-2">
                <span className="text-red-400 mt-0.5">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-xs text-[#FACC15] mb-1 font-medium uppercase tracking-wide">
            Recommendations
          </h4>
          <ul className="space-y-1">
            {recommendations.map((r, i) => (
              <li key={i} className="text-sm text-[#E4E2DD] flex items-start gap-2">
                <span className="text-[#FACC15] mt-0.5">&rarr;</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
