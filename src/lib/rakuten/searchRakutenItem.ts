import https from "node:https";
import { ProductFetchError } from "@/lib/scraping/fetchHtml";
import { extractRakutenItemCode, RakutenItemCode } from "@/lib/rakuten/extractItemCode";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 2026年2〜5月の楽天API移行に伴い、ドメイン・パスが変更された
// (app.rakuten.co.jp/services/api/ → openapi.rakuten.co.jp/ichibams/api/)。
const API_HOST = "openapi.rakuten.co.jp";
const API_PATH = "/ichibams/api/IchibaItem/Search/20220601";
const API_TIMEOUT_MS = 10000;

// 新API移行後、Refererが楽天の管理画面で登録した「利用予定サイト」のドメインと
// 一致している必要があるため、開発環境で試す場合も本番URLを固定で送る。
// 標準のfetch()は仕様上Refererヘッダーを送信できない(ブラウザと同じ制限が
// Node.jsのfetchにもかかっているため)ので、httpsモジュールで直接送る。
const RAKUTEN_REFERER = "https://shopping-ai-peach.vercel.app";

export type RakutenApiItem = {
  itemName: string;
  itemPrice: number;
  itemCaption: string;
  reviewAverage: number;
  reviewCount: number;
  imageUrl: string | null;
  itemUrl: string;
  shopCode: string;
  shopName: string;
};

// formatVersion=2を指定しているため、Items配列の要素は
// { Item: {...} } ではなく商品データが直接フラットに入っている。
type RakutenSearchResponse = {
  count?: number;
  Items?: Record<string, unknown>[];
  error?: string;
  error_description?: string;
  errors?: { errorCode: number; errorMessage: string };
};

// RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEYは呼び出し時点で読む(モジュール読み込み時ではなく)。
// テストなどでprocess.envを後から差し替えるケースにも対応するため。
function getAppId(): string {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) {
    throw new ProductFetchError(
      "楽天APIのアプリID(RAKUTEN_APP_ID)が設定されていません。.env.local、または本番環境の環境変数を確認してください。",
      "not_configured"
    );
  }
  return appId;
}

function getAccessKey(): string {
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  if (!accessKey) {
    throw new ProductFetchError(
      "楽天APIのアクセスキー(RAKUTEN_ACCESS_KEY)が設定されていません。.env.local、または本番環境の環境変数を確認してください。",
      "not_configured"
    );
  }
  return accessKey;
}

type RawResponse = { status: number; body: string };

function requestJson(path: string): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path,
        method: "GET",
        headers: {
          Referer: RAKUTEN_REFERER,
          Origin: RAKUTEN_REFERER,
        },
        timeout: API_TIMEOUT_MS,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

// applicationId/accessKeyの付与、通信、HTTPエラー判定までを共通化した窓口。
// itemCode指定・keyword指定のどちらの検索でもここを通す。
async function callRakutenSearchApi(
  extraParams: Record<string, string>
): Promise<RakutenSearchResponse> {
  const params = new URLSearchParams({
    applicationId: getAppId(),
    accessKey: getAccessKey(),
    formatVersion: "2",
    ...extraParams,
  });

  let raw: RawResponse;
  try {
    raw = await requestJson(`${API_PATH}?${params.toString()}`);
  } catch (error) {
    if (error instanceof Error && error.message === "timeout") {
      console.error(`[rakuten] timeout after ${API_TIMEOUT_MS}ms`);
      throw new ProductFetchError("楽天APIへの接続がタイムアウトしました", "timeout");
    }
    console.error("[rakuten] network_error", error);
    throw new ProductFetchError("楽天APIに接続できませんでした", "network_error");
  }

  const data = JSON.parse(raw.body) as RakutenSearchResponse;

  if (raw.status !== 200) {
    const description =
      data.error_description ?? data.errors?.errorMessage ?? `HTTP ${raw.status}`;
    console.error(`[rakuten] HTTP ${raw.status} desc=${description}`);
    throw new ProductFetchError(`楽天APIがエラーを返しました(${description})`, "http_error");
  }

  return data;
}

// formatVersion=2ではmediumImageUrlsは文字列URLの配列そのもの
// (formatVersion=1では { imageUrl: "..." } のオブジェクト配列だった)。
function toApiItem(item: Record<string, unknown>): RakutenApiItem {
  return {
    itemName: String(item.itemName ?? ""),
    itemPrice: Number(item.itemPrice ?? 0),
    itemCaption: String(item.itemCaption ?? ""),
    reviewAverage: Number(item.reviewAverage ?? 0),
    reviewCount: Number(item.reviewCount ?? 0),
    imageUrl:
      Array.isArray(item.mediumImageUrls) && item.mediumImageUrls.length > 0
        ? String(item.mediumImageUrls[0])
        : null,
    itemUrl: String(item.itemUrl ?? ""),
    shopCode: String(item.shopCode ?? ""),
    shopName: String(item.shopName ?? ""),
  };
}

// 第一段階: URLから取り出した shopCode:itemCode で直接問い合わせる。
export async function searchRakutenItem(
  code: RakutenItemCode
): Promise<RakutenApiItem> {
  const data = await callRakutenSearchApi({
    itemCode: `${code.shopCode}:${code.itemCode}`,
  });

  const item = data.Items?.[0];
  if (!item) {
    throw new ProductFetchError(
      "この商品コードに該当する商品が楽天APIで見つかりませんでした(削除された商品の可能性があります)。",
      "http_error"
    );
  }

  return toApiItem(item);
}

// 1ページあたりの最大件数(APIの上限)。
const ITEMS_PER_PAGE = 30;
// 探索する最大ページ数。これ以上探すとAPIのレート制限にかかりやすく、
// 利用者を待たせすぎてしまうため、ここで見つからなければ諦める。
const MAX_SEARCH_PAGES = 5;
// ページ間の間隔。連続で叩くとAPI側のレート制限(1秒あたりの上限)に
// かかることを実際に確認したため、間を空ける。
const PAGE_INTERVAL_MS = 1100;

// 第二段階: スクレイピングを一切使わず、お店の商品一覧をAPIでページ送りしながら、
// 各商品の本来のURL(itemUrl)がURLコードと一致するものを探す。
// キーワード検索(商品名で探す)ではなく、お店の中身を総当たりで確認するため、
// お店コードが違う商品を誤って採用してしまう心配がない。
export async function searchRakutenItemByUrlCode(
  shopCode: string,
  urlCode: string
): Promise<RakutenApiItem> {
  for (let page = 1; page <= MAX_SEARCH_PAGES; page++) {
    if (page > 1) await sleep(PAGE_INTERVAL_MS);

    const data = await callRakutenSearchApi({
      shopCode,
      page: String(page),
      hits: String(ITEMS_PER_PAGE),
    });

    const items = data.Items ?? [];
    for (const item of items) {
      const itemUrl = String(item.itemUrl ?? "");
      try {
        const parsed = extractRakutenItemCode(itemUrl);
        if (parsed.shopCode === shopCode && parsed.itemCode === urlCode) {
          return toApiItem(item);
        }
      } catch {
        // itemUrlが想定外の形式の場合はスキップして次の商品を見る
      }
    }

    if (items.length < ITEMS_PER_PAGE) break; // 最後のページまで確認済み
  }

  console.error(
    `[rakuten] urlCode search: not found within ${MAX_SEARCH_PAGES} pages (shopCode=${shopCode}, urlCode=${urlCode})`
  );
  throw new ProductFetchError(
    `お店の商品一覧(最大${MAX_SEARCH_PAGES}ページ)を確認しましたが、該当する商品が見つかりませんでした。`,
    "http_error"
  );
}
