import { decodeProductId } from "@/lib/products/productId";
import { getProductAnalysis } from "@/lib/products/getProductAnalysis";
import { ProductFetchError } from "@/lib/products/getProductInfo";
import { ScoreBadge } from "@/components/features/ScoreBadge";
import { SimilarProducts } from "@/components/features/SimilarProducts";

type Props = {
  params: Promise<{ id: string }>;
};

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

  let url: string;
  try {
    url = decodeProductId(id);
    new URL(url);
  } catch {
    return <ErrorCard message="商品ページのURLが正しくありません。" />;
  }

  let product;
  try {
    product = await getProductAnalysis(id, url);
  } catch (error) {
    const message =
      error instanceof ProductFetchError
        ? error.message
        : "予期しないエラーが発生しました。時間をおいて再度お試しください。";
    return <ErrorCard message={message} />;
  }

  return (
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
  );
}
