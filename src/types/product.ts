export type SiteName = "amazon" | "rakuten" | "yahoo" | "unknown";

// 商品ページから取得できる「事実情報」
export type ProductInfo = {
  title: string;
  imageUrl: string | null;
  price: number | null;
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
