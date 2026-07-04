import { fetchHtml, ProductFetchError } from "@/lib/scraping/fetchHtml";
import { parseProductInfo } from "@/lib/scraping/parseProductInfo";
import { ProductInfo, SiteName } from "@/types/product";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Amazon等は自動アクセスをCAPTCHAページへ誘導することがある。
// また楽天(Akamaiなどのセキュリティ装置)は、ブロック時に
// "Reference #18.xxxxx..." という数十文字だけの短い応答を返すことが
// 実際に確認できたため、その形式もブロック判定に含める。
// 番号部分は数字だけでなくa-fの英字(16進数)も混ざるため、
// "Reference #" という接頭辞だけで判定する(誤検知の心配はほぼない)。
// その場合、見た目上はHTTP 200で返ってくるため、内容を見て検知する。
function looksBlocked(html: string): boolean {
  return /validateCaptcha|opfcaptcha|automated access|自動化されたデータ|Reference #/i.test(
    html
  );
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

// 商品ページをスクレイピングで取得・解析する共通処理。
// Vercelなどサーバー環境からのアクセスだけ相手サイトが不安定なページ
// (空っぽの案内ページなど)を返すことがあるため、1回だけ待って取り直す
// (相手サイトへの負荷を考え、リトライはこの1回のみ)。
// 通常のAmazon・Yahoo!取得と、楽天APIの二段目(タイトル読み取り)の
// どちらからも呼び出される。
export async function fetchProductPage(
  url: string,
  siteName: SiteName
): Promise<ProductInfo> {
  let { info, html } = await fetchAndParseOnce(url, siteName);

  if (gotNothing(info) && !looksBlocked(html)) {
    console.error(
      `[fetchProductPage] gotNothing (retrying) site=${siteName} len=${html.length} url=${url}`
    );
    await sleep(800);
    ({ info, html } = await fetchAndParseOnce(url, siteName));
  }

  if (looksBlocked(html)) {
    console.error(
      `[fetchProductPage] looksBlocked site=${siteName} len=${html.length} url=${url}`
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
      `[fetchProductPage] gotNothing (after retry) site=${siteName} len=${html.length} url=${url} snippet=${snippet}`
    );
    throw new ProductFetchError(
      "商品情報をうまく読み取れませんでした。ページの構成が変わったか、対応していない形式のページの可能性があります。",
      "http_error"
    );
  }

  return info;
}
