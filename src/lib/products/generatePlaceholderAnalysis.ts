import { AnalysisContent } from "@/types/product";

// AI解析(フェーズ3)が未設定、またはAI呼び出しに失敗したときに使う仮の解析結果。
export function generatePlaceholderAnalysis(
  reason: "not_configured" | "ai_error" = "not_configured"
): AnalysisContent {
  const summary =
    reason === "not_configured"
      ? "AIによるレビュー解析はまだ設定されていません(GEMINI_API_KEYの設定後に有効になります)。"
      : "AI解析の呼び出しに失敗しました。しばらくしてから再度お試しください。";

  return {
    score: 0,
    summary,
    goodPoints: ["AI解析が有効になると、ここに良い点が表示されます"],
    badPoints: ["AI解析が有効になると、ここに悪い点が表示されます"],
    recommendedFor: ["AI解析が有効になると、ここに表示されます"],
    notRecommendedFor: ["AI解析が有効になると、ここに表示されます"],
  };
}
