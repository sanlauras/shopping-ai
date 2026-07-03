import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo/getBaseUrl";
import { listRecentProducts } from "@/lib/products/productRepository";

const MAX_PRODUCT_URLS = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  // Supabase未設定の間はlistRecentProductsが空配列を返すので、トップページのみになる。
  const products = await listRecentProducts(MAX_PRODUCT_URLS);

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    ...products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
