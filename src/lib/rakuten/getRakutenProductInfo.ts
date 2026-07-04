import { ProductFetchError } from "@/lib/scraping/fetchHtml";
import { extractRakutenItemCode } from "@/lib/rakuten/extractItemCode";
import {
  RakutenApiItem,
  searchRakutenItem,
  searchRakutenItemByUrlCode,
} from "@/lib/rakuten/searchRakutenItem";
import { ProductInfo } from "@/types/product";

function toProductInfo(item: RakutenApiItem, sourceUrl: string): ProductInfo {
  return {
    title: item.itemName,
    imageUrl: item.imageUrl,
    price: item.itemPrice,
    description: item.itemCaption || null,
    reviewAverage: item.reviewAverage,
    reviewCount: item.reviewCount,
    sourceUrl,
    siteName: "rakuten",
  };
}

// 第一段階(URLのコードを直接指定)で見つからない場合、第二段階として
// お店の商品一覧をAPIでページ送りしながらitemUrlが一致する商品を探す
// (searchRakutenItemByUrlCode)。スクレイピングは一切行わず、公式APIの
// 範囲内だけで完結させている。
export async function getRakutenProductInfo(url: string): Promise<ProductInfo> {
  const code = extractRakutenItemCode(url);

  try {
    const item = await searchRakutenItem(code);
    return toProductInfo(item, url);
  } catch (error) {
    // アプリID/アクセスキー未設定・通信タイムアウトなどは、やり直しても解決しないため
    // そのまま呼び出し元へ伝える。「見つからなかった」場合(http_error)だけ次の手段を試す。
    if (!(error instanceof ProductFetchError) || error.reason !== "http_error") {
      throw error;
    }

    console.error(
      `[getRakutenProductInfo] itemCode lookup failed, falling back to shop listing search: ${url}`
    );

    const item = await searchRakutenItemByUrlCode(code.shopCode, code.itemCode);
    return toProductInfo(item, url);
  }
}
