function scoreColor(score: number): string {
  if (score >= 80) return "bg-blue-50 text-blue-700";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className={`inline-flex items-baseline gap-1 px-4 py-2 rounded-lg ${scoreColor(
        score
      )}`}
    >
      <span className="text-3xl font-bold">{score}</span>
      <span className="text-sm">/ 100点</span>
    </div>
  );
}
