import { ProductFetchError } from "@/lib/scraping/fetchHtml";

export type RakutenItemCode = {
  shopCode: string;
  itemCode: string;
};

const ITEM_HOST_PATTERN = /^(m\.)?item\.rakuten\.co\.jp$/;
// お店コード・商品コードは英数字・ハイフン・アンダースコアのみで構成される想定。
const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

// 楽天の商品URLには対応していない形式(短縮URL、検索結果ページなど)が
// 多数あるため、それらは商品コードが取れない旨のエラーとして扱う。
function unsupportedFormatError(): ProductFetchError {
  return new ProductFetchError(
    "この楽天URLの形式には対応していません(item.rakuten.co.jpの通常の商品ページURLのみ対応しています)。",
    "invalid_url"
  );
}

export function extractRakutenItemCode(url: string): RakutenItemCode {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw unsupportedFormatError();
  }

  if (!ITEM_HOST_PATTERN.test(parsed.hostname)) {
    throw unsupportedFormatError();
  }

  const segments = parsed.pathname.split("/").filter((segment) => segment.length > 0);
  const [shopCode, itemCode] = segments;

  if (!shopCode || !itemCode) {
    throw unsupportedFormatError();
  }

  if (!CODE_PATTERN.test(shopCode) || !CODE_PATTERN.test(itemCode)) {
    throw unsupportedFormatError();
  }

  return { shopCode, itemCode };
}
