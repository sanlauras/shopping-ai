import { ProductAnalysis } from "@/types/product";

// TODO: 将来はここをSupabaseからの取得 or AI解析処理に差し替える
export function getDummyProduct(id: string): ProductAnalysis {
  return {
    id,
    productName: "ワイヤレスイヤホン Xシリーズ Pro",
    imageUrl: "https://placehold.co/400x400?text=Product+Image",
    score: 82,
    summary:
      "音質とバッテリー持ちの評価が高い一方、装着感については好みが分かれるイヤホンです。",
    goodPoints: [
      "低音がしっかりしていて音質満足度が高い",
      "1回の充電で長時間使える",
      "ノイズキャンセリング性能が価格帯以上",
    ],
    badPoints: [
      "耳が小さい人はフィット感が合わないことがある",
      "専用アプリの動作が不安定という声がある",
    ],
    recommendedFor: [
      "通勤・通学中に音楽をよく聴く人",
      "長時間の使用でバッテリー切れを気にしたくない人",
    ],
    notRecommendedFor: [
      "耳が小さめで装着感を重視する人",
      "細かいアプリ設定にこだわりたい人",
    ],
  };
}