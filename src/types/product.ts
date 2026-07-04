export type SiteName = "amazon" | "rakuten" | "yahoo" | "unknown";

// 商品ページから取得できる「事実情報」
// description/reviewAverage/reviewCountは楽天APIでのみ取得できる項目のため、
// Amazon・Yahoo!(スクレイピング)ではnull(=情報なし)になる。
export type ProductInfo = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  description: string | null;
  reviewAverage: number | null;
  reviewCount: number | null;
  sourceUrl: string;
  siteName: SiteName;
};

// AIによる解析結果(現時点ではプレースホルダー、フェーズ3で実データに置き換え)
export type AnalysisContent = {
  score: number; // 0〜100点
  summary: string;
  goodPoints: string[];
  badPoints: string[];
  recommendedFor: string[];
  notRecommendedFor: string[];
};

export type ProductAnalysis = ProductInfo &
  AnalysisContent & {
    id: string;
  };
