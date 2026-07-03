"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProductId } from "@/lib/products/productId";
import { detectSite, SUPPORTED_SITE_LABEL } from "@/lib/scraping/detectSite";

export function ProductUrlForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) {
      setError("商品のURLを入力してください");
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setError("正しいURL形式で入力してください");
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError("正しいURL形式で入力してください");
      return;
    }

    if (detectSite(trimmed) === "unknown") {
      setError(`対応していないショッピングサイトです(対応サイト: ${SUPPORTED_SITE_LABEL})`);
      return;
    }

    router.push(`/product/${encodeProductId(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          placeholder="https://www.amazon.co.jp/dp/..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          AIで解析する
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
