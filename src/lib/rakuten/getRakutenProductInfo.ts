import { fetchHtml, ProductFetchError } from "@/lib/scraping/fetchHtml";
import { parseProductInfo } from "@/lib/scraping/parseProductInfo";
import { extractRakutenItemCode } from "@/lib/rakuten/extractItemCode";
import {
  RakutenApiItem,
  searchRakutenItem,
  searchRakutenItemByKeyword,
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

// 楽天のページタイトルは「【楽天市場】商品名...：店舗名」という形式で、
// 前後の飾り(サイト名・店舗名)は商品名そのものではなくAPI側の商品データにも
// 含まれないため、そのままキーワードにすると0件になる。取り除いてから使う。
// 長さについても実際に試したところ65文字ではAPIに通り80文字では拒否されたため、
// 余裕を持って50文字に切り詰める(キーワード自体は多少短くても検索は機能する)。
const MAX_KEYWORD_LENGTH = 50;

function toSearchKeyword(title: string): string {
  return title
    .replace(/^【楽天市場】/, "")
    .replace(/[:：][^:：]*$/, "")
    .trim()
    .slice(0, MAX_KEYWORD_LENGTH);
}

// 第二段階: 商品ページのタイトルだけ軽く読み取り(価格・画像はAPIから取るので不要)、
// それをキーワードにして商品名+お店コードでAPI検索する。
async function findByScrapedTitle(
  url: string,
  shopCode: string
): Promise<RakutenApiItem> {
  const html = await fetchHtml(url);
  const scraped = parseProductInfo(html, url, "rakuten");

  if (scraped.title === "商品名を取得できませんでした") {
    throw new ProductFetchError(
      "商品ページから商品名を読み取れず、キーワード検索もできませんでした。",
      "http_error"
    );
  }

  const keyword = toSearchKeyword(scraped.title);
  return searchRakutenItemByKeyword(shopCode, keyword);
}

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
      `[getRakutenProductInfo] itemCode lookup failed, falling back to keyword search: ${url}`
    );

    try {
      const item = await findByScrapedTitle(url, code.shopCode);
      return toProductInfo(item, url);
    } catch {
      throw new ProductFetchError(
        "楽天APIでこの商品を見つけられませんでした。URLの形式が特殊であるか、商品が削除された可能性があります。",
        "http_error"
      );
    }
  }
}
