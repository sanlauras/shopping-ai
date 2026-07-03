import { detectSite, SUPPORTED_SITE_LABEL } from "@/lib/scraping/detectSite";
import { fetchHtml, ProductFetchError } from "@/lib/scraping/fetchHtml";
import { parseProductInfo } from "@/lib/scraping/parseProductInfo";
import { ProductInfo, SiteName } from "@/types/product";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Amazon等は自動アクセスをCAPTCHAページへ誘導することがある。
// その場合、見た目上はHTTP 200で返ってくるため、内容を見て検知する。
function looksBlocked(html: string): boolean {
  return /validateCaptcha|opfcaptcha|automated access|自動化されたデータ/i.test(html);
}

// タイトル・価格・画像が何も取れていない状態。ページ構成の変更のほか、
// 混雑時の一時的な案内ページなどでも起こりうる。
function gotNothing(info: ProductInfo): boolean {
  return (
    info.price === null &&
    info.imageUrl === null &&
    info.title === "商品名を取得できませんでした"
  );
}

async function fetchAndParseOnce(
  url: string,
  siteName: SiteName
): Promise<{ info: ProductInfo; html: string }> {
  const html = await fetchHtml(url);
  return { info: parseProductInfo(html, url, siteName), html };
}

export async function getProductInfo(url: string): Promise<ProductInfo> {
  const siteName = detectSite(url);

  if (siteName === "unknown") {
    throw new ProductFetchError(
      `対応していないショッピングサイトです(対応サイト: ${SUPPORTED_SITE_LABEL})`,
      "invalid_url"
    );
  }

  let { info, html } = await fetchAndParseOnce(url, siteName);

  // 一時的な混雑ページ・アクセス制限の可能性があるため、内容が空の場合は
  // 少し間を置いて1回だけ取り直す(相手サイトへの負荷を考え、リトライは1回のみ)。
  if (gotNothing(info) && !looksBlocked(html)) {
    console.error(
      `[getProductInfo] gotNothing (retrying) site=${siteName} len=${html.length} url=${url}`
    );
    await sleep(800);
    ({ info, html } = await fetchAndParseOnce(url, siteName));
  }

  if (looksBlocked(html)) {
    console.error(
      `[getProductInfo] looksBlocked site=${siteName} len=${html.length} url=${url}`
    );
    const hint =
      siteName === "amazon"
        ? "Amazonは自動アクセスを制限している場合があります。時間をおいて再度お試しいただくか、楽天市場・Yahoo!ショッピングのURLもお試しください。"
        : "サイト側でアクセスが制限されている可能性があります。";
    throw new ProductFetchError(`商品情報を取得できませんでした。${hint}`, "http_error");
  }

  if (gotNothing(info)) {
    const snippet = html.replace(/\s+/g, " ").slice(0, 500);
    console.error(
      `[getProductInfo] gotNothing (after retry) site=${siteName} len=${html.length} url=${url} snippet=${snippet}`
    );
    throw new ProductFetchError(
      "商品情報をうまく読み取れませんでした。ページの構成が変わったか、対応していない形式のページの可能性があります。",
      "http_error"
    );
  }

  return info;
}

export { ProductFetchError };
