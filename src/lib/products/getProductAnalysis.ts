import { getProductInfo } from "@/lib/products/getProductInfo";
import { generatePlaceholderAnalysis } from "@/lib/products/generatePlaceholderAnalysis";
import { findProductById, saveProduct } from "@/lib/products/productRepository";
import { ProductAnalysis } from "@/types/product";

// フェーズ3で本物のAI解析に差し替える予定の窓口関数。
// Supabase未設定の間はキャッシュが常に空なので、毎回スクレイピングし直すだけで動作する。
export async function getProductAnalysis(
  id: string,
  url: string
): Promise<ProductAnalysis> {
  const cached = await findProductById(id);
  if (cached) return cached;

  const info = await getProductInfo(url);
  const analysisContent = generatePlaceholderAnalysis();

  const analysis: ProductAnalysis = {
    id,
    ...info,
    ...analysisContent,
  };

  try {
    await saveProduct(analysis);
  } catch {
    // 保存に失敗しても表示は継続する(次回アクセス時に再取得されるだけ)
  }

  return analysis;
}
