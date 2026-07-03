import { detectSite, SUPPORTED_SITE_LABEL } from "@/lib/scraping/detectSite";
import { fetchHtml, ProductFetchError } from "@/lib/scraping/fetchHtml";
import { parseProductInfo } from "@/lib/scraping/parseProductInfo";
import { ProductInfo } from "@/types/product";

export async function getProductInfo(url: string): Promise<ProductInfo> {
  const siteName = detectSite(url);

  if (siteName === "unknown") {
    throw new ProductFetchError(
      `対応していないショッピングサイトです(対応サイト: ${SUPPORTED_SITE_LABEL})`,
      "invalid_url"
    );
  }

  const html = await fetchHtml(url);

  // Amazon等は自動アクセスをCAPTCHAページへ誘導することがある。
  // その場合、見た目上はHTTP 200で返ってくるため、内容を見て検知する。
  const looksBlocked = /validateCaptcha|opfcaptcha|automated access|自動化されたデータ/i.test(
    html
  );
  if (looksBlocked) {
    const hint =
      siteName === "amazon"
        ? "Amazonは自動アクセスを制限している場合があります。時間をおいて再度お試しいただくか、楽天市場・Yahoo!ショッピングのURLもお試しください。"
        : "サイト側でアクセスが制限されている可能性があります。";
    throw new ProductFetchError(`商品情報を取得できませんでした。${hint}`, "http_error");
  }

  const info = parseProductInfo(html, url, siteName);

  // タイトル・価格・画像が何も取れていない場合はページ構成の変更などが疑われるため、
  // 誤情報として表示せずエラーにする。
  const gotNothing =
    info.price === null &&
    info.imageUrl === null &&
    info.title === "商品名を取得できませんでした";

  if (gotNothing) {
    throw new ProductFetchError(
      "商品情報をうまく読み取れませんでした。ページの構成が変わったか、対応していない形式のページの可能性があります。",
      "http_error"
    );
  }

  return info;
}

export { ProductFetchError };
