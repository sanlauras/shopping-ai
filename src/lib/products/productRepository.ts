import { getSupabaseClient } from "@/lib/supabase/client";
import { ProductAnalysis } from "@/types/product";

type ProductRow = {
  id: string;
  source_url: string;
  site_name: ProductAnalysis["siteName"];
  title: string;
  image_url: string | null;
  price: number | null;
  score: number;
  summary: string;
  good_points: string[];
  bad_points: string[];
  recommended_for: string[];
  not_recommended_for: string[];
};

function rowToAnalysis(row: ProductRow): ProductAnalysis {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    siteName: row.site_name,
    title: row.title,
    imageUrl: row.image_url,
    price: row.price,
    score: row.score,
    summary: row.summary,
    goodPoints: row.good_points,
    badPoints: row.bad_points,
    recommendedFor: row.recommended_for,
    notRecommendedFor: row.not_recommended_for,
  };
}

// Supabase未設定の間はnullを返し、呼び出し側は毎回スクレイピング/AI解析にフォールバックする。
export async function findProductById(
  id: string
): Promise<ProductAnalysis | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToAnalysis(data as ProductRow);
}

// 保存に失敗してもページ表示自体は続けたいため、呼び出し側でエラーを握りつぶす想定。
export async function saveProduct(analysis: ProductAnalysis): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("products").upsert({
    id: analysis.id,
    source_url: analysis.sourceUrl,
    site_name: analysis.siteName,
    title: analysis.title,
    image_url: analysis.imageUrl,
    price: analysis.price,
    score: analysis.score,
    summary: analysis.summary,
    good_points: analysis.goodPoints,
    bad_points: analysis.badPoints,
    recommended_for: analysis.recommendedFor,
    not_recommended_for: analysis.notRecommendedFor,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function listRecentProducts(
  limit: number,
  excludeId?: string
): Promise<ProductAnalysis[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as ProductRow[]).map(rowToAnalysis);
}
