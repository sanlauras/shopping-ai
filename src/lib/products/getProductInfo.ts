import { detectSite, SUPPORTED_SITE_LABEL } from "@/lib/scraping/detectSite";
import { ProductFetchError } from "@/lib/scraping/fetchHtml";
import { fetchProductPage } from "@/lib/scraping/fetchProductPage";
import { getRakutenProductInfo } from "@/lib/rakuten/getRakutenProductInfo";
import { ProductInfo } from "@/types/product";

export async function getProductInfo(url: string): Promise<ProductInfo> {
  const siteName = detectSite(url);

  if (siteName === "unknown") {
    throw new ProductFetchError(
      `対応していないショッピングサイトです(対応サイト: ${SUPPORTED_SITE_LABEL})`,
      "invalid_url"
    );
  }

  // 楽天だけは公式APIを使う(Amazon・Yahoo!は引き続きスクレイピングのまま)。
  if (siteName === "rakuten") {
    return getRakutenProductInfo(url);
  }

  return fetchProductPage(url, siteName);
}

export { ProductFetchError };
