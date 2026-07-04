import { extractRakutenItemCode } from "@/lib/rakuten/extractItemCode";
import { findCheaperOffers } from "@/lib/rakuten/findCheaperOffers";

export async function CheaperOffers({
  sourceUrl,
  title,
  price,
}: {
  sourceUrl: string;
  title: string;
  price: number | null;
}) {
  if (price === null) return null;

  let code;
  try {
    code = extractRakutenItemCode(sourceUrl);
  } catch {
    return null;
  }

  // 価格比較は「おまけ」の機能なので、何らかの理由(レート制限等)で
  // 失敗しても、商品ページ本体の表示には影響させない。
  let offers;
  try {
    offers = await findCheaperOffers({
      shopCode: code.shopCode,
      itemCode: code.itemCode,
      title,
      price,
    });
  } catch (error) {
    console.error("[CheaperOffers] failed, hiding section", error);
    return null;
  }

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm mt-4 text-sm text-gray-500">
        他の店舗でこれより安い価格は見つかりませんでした(検索できた範囲内)。
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
      <h2 className="font-semibold text-gray-900 mb-3">他の店舗での価格</h2>
      <ul className="space-y-2 text-sm">
        {offers.map((offer, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <a
              href={offer.itemUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-blue-600 hover:underline truncate"
            >
              {offer.shopName}
            </a>
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              ¥{offer.price.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400 mt-3">
        ※商品名の類似度から自動的に判定しているため、実際には異なる商品が含まれる場合があります。
      </p>
    </div>
  );
}
