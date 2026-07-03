import { AnalysisContent } from "@/types/product";

// AI解析(フェーズ3)が未設定のときに使う仮の解析結果。
// 商品ごとの実データではなく、UIの見た目を確認するためのプレースホルダー。
export function generatePlaceholderAnalysis(): AnalysisContent {
  return {
    score: 0,
    summary:
      "AIによるレビュー解析はまだ設定されていません(フェーズ3で有効になります)。",
    goodPoints: ["AI解析が有効になると、ここに良い点が表示されます"],
    badPoints: ["AI解析が有効になると、ここに悪い点が表示されます"],
    recommendedFor: ["AI解析が有効になると、ここに表示されます"],
    notRecommendedFor: ["AI解析が有効になると、ここに表示されます"],
  };
}
