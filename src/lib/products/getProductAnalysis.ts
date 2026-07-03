import { getProductInfo } from "@/lib/products/getProductInfo";
import { generatePlaceholderAnalysis } from "@/lib/products/generatePlaceholderAnalysis";
import { findProductById, saveProduct } from "@/lib/products/productRepository";
import {
  analyzeProductWithAi,
  isAiConfigured,
} from "@/lib/ai/analyzeProductWithAi";
import { AnalysisContent, ProductAnalysis, ProductInfo } from "@/types/product";

async function getAnalysisContent(info: ProductInfo): Promise<AnalysisContent> {
  if (!isAiConfigured()) {
    return generatePlaceholderAnalysis("not_configured");
  }

  try {
    return await analyzeProductWithAi(info);
  } catch {
    return generatePlaceholderAnalysis("ai_error");
  }
}

// Supabase未設定の間はキャッシュが常に空、GEMINI_API_KEY未設定の間はAI解析がプレースホルダーになる。
// どちらも設定すると、初回はスクレイピング+AI解析、2回目以降はDBキャッシュから即返す。
export async function getProductAnalysis(
  id: string,
  url: string
): Promise<ProductAnalysis> {
  const cached = await findProductById(id);
  if (cached) return cached;

  const info = await getProductInfo(url);
  const analysisContent = await getAnalysisContent(info);

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
