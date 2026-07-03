export type ProductAnalysis = {
  id: string;
  productName: string;
  imageUrl: string;
  score: number; // 0〜100点
  summary: string;
  goodPoints: string[];
  badPoints: string[];
  recommendedFor: string[];
  notRecommendedFor: string[];
};