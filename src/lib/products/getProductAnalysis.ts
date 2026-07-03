import { getProductInfo } from "@/lib/products/getProductInfo";
import { generatePlaceholderAnalysis } from "@/lib/products/generatePlaceholderAnalysis";
import { ProductAnalysis } from "@/types/product";

// フェーズ2でDBキャッシュ、フェーズ3で本物のAI解析に差し替える予定の窓口関数。
export async function getProductAnalysis(
  id: string,
  url: string
): Promise<ProductAnalysis> {
  const info = await getProductInfo(url);
  const analysisContent = generatePlaceholderAnalysis();

  return {
    id,
    ...info,
    ...analysisContent,
  };
}
