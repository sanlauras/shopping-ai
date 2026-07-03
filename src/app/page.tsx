import { ProductUrlForm } from "@/components/features/ProductUrlForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          AIが商品レビューを分析
        </h1>
        <p className="text-gray-600 mb-2">
          商品のURLを貼り付けるだけで、AIが良い点・悪い点をまとめてお伝えします
        </p>
        <p className="text-gray-400 text-sm mb-10">
          対応サイト: Amazon / 楽天市場 / Yahoo!ショッピング
        </p>
        <ProductUrlForm />
      </div>
    </main>
  );
}