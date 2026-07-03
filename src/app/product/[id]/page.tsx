import { cache } from "react";
import type { Metadata } from "next";
import { decodeProductId } from "@/lib/products/productId";
import { getProductAnalysis } from "@/lib/products/getProductAnalysis";
import { ProductFetchError } from "@/lib/products/getProductInfo";
import { ScoreBadge } from "@/components/features/ScoreBadge";
import { SimilarProducts } from "@/components/features/SimilarProducts";
import { getBaseUrl } from "@/lib/seo/getBaseUrl";

type Props = {
  params: Promise<{ id: string }>;
};

// スクレイピング(最大15秒)+AI解析(最大12秒)を待つ可能性があるため、
// Vercelのデフォルト実行時間制限より長めに設定する。
export const maxDuration = 30;

// generateMetadataとページ本体で同じ商品を取りに行くため、
// React.cacheでリクエスト単位にメモ化して二重にスクレイピングしないようにする。
const resolveProduct = cache(async (id: string) => {
  const url = decodeProductId(id);
  new URL(url); // 不正な値なら例外を投げてinvalid_url扱いにする
  return getProductAnalysis(id, url);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await resolveProduct(id);
    return {
      title: `${product.title} のAI分析 | shopping-ai`,
      description: product.summary,
      alternates: { canonical: `${getBaseUrl()}/product/${id}` },
      openGraph: {
        title: product.title,
        description: product.summary,
        images: product.imageUrl ? [product.imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "商品情報を取得できませんでした | shopping-ai",
      robots: { index: false, follow: false },
    };
  }
}

function ErrorCard({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl bg-white rounded-xl p-8 shadow-sm text-center">
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          商品情報を取得できませんでした
        </h1>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </main>
  );
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  let product;
  try {
    product = await resolveProduct(id);
  } catch (error) {
    const message =
      error instanceof ProductFetchError
        ? error.message
        : "商品ページのURLが正しくないか、予期しないエラーが発生しました。";
    return <ErrorCard message={message} />;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
    ...(product.price !== null
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "JPY",
            url: product.sourceUrl,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* 商品情報 */}
        <div className="flex flex-col sm:flex-row gap-6 bg-white rounded-xl p-6 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl ?? "https://placehold.co/400x400?text=No+Image"}
            alt={product.title}
            className="w-full sm:w-40 h-40 object-cover rounded-lg mx-auto sm:mx-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
            <p className="text-gray-900 font-semibold mb-2">
              {product.price !== null
                ? `¥${product.price.toLocaleString()}`
                : "価格情報を取得できませんでした"}
            </p>
            <p className="text-gray-600 text-sm mb-4">{product.summary}</p>

            {/* スコア */}
            <ScoreBadge score={product.score} />
          </div>
        </div>

        {/* 良い点・悪い点 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-green-700 mb-3">良い点</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {product.goodPoints.map((point, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green-600">◯</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-red-700 mb-3">悪い点</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {product.badPoints.map((point, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-600">×</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* おすすめな人・おすすめしない人 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">
              こんな人におすすめ
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {product.recommendedFor.map((point, i) => (
                <li key={i}>・{point}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">
              おすすめしない人
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {product.notRecommendedFor.map((point, i) => (
                <li key={i}>・{point}</li>
              ))}
            </ul>
          </div>
        </div>

        <SimilarProducts excludeId={product.id} />
      </div>
    </main>
    </>
  );
}
