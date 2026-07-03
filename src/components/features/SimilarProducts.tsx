import { listRecentProducts } from "@/lib/products/productRepository";

export async function SimilarProducts({
  excludeId,
}: {
  excludeId: string;
}) {
  const products = await listRecentProducts(6, excludeId);

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm mt-4 text-sm text-gray-500">
        類似商品はまだありません。解析された商品が増えると、ここに表示されます。
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
      <h2 className="font-semibold text-gray-900 mb-3">類似商品</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((product) => (
          <a
            key={product.id}
            href={`/product/${product.id}`}
            className="block rounded-lg border border-gray-100 p-2 hover:border-blue-300 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl ?? "https://placehold.co/200x200?text=No+Image"}
              alt={product.title}
              className="w-full aspect-square object-cover rounded-md mb-2"
            />
            <p className="text-xs text-gray-700 line-clamp-2">{product.title}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
