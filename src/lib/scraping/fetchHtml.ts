export class ProductFetchError extends Error {
  constructor(
    message: string,
    public readonly reason:
      | "invalid_url"
      | "timeout"
      | "http_error"
      | "network_error"
  ) {
    super(message);
    this.name = "ProductFetchError";
  }
}

const FETCH_TIMEOUT_MS = 8000;

// 楽天市場など一部サイトは今でもEUC-JP/Shift_JISでページを返すため、
// UTF-8決め打ちでデコードすると文字化けする。charsetを検出してから読む。
function detectCharset(contentTypeHeader: string | null, headBytes: Uint8Array): string {
  const fromHeader = contentTypeHeader?.match(/charset=["']?([\w-]+)/i)?.[1];
  if (fromHeader) return fromHeader.toLowerCase();

  const headText = Buffer.from(headBytes).toString("latin1");
  const fromMeta = headText.match(/charset=["']?([\w-]+)/i)?.[1];
  if (fromMeta) return fromMeta.toLowerCase();

  return "utf-8";
}

// 通常のブラウザからのアクセスに近いヘッダーを付けて取得する。
// (Botブロックが厳しいサイトでは失敗することがあり、その場合は http_error/network_error を投げる)
export async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ProductFetchError(
        `商品ページの取得に失敗しました(HTTP ${response.status})`,
        "http_error"
      );
    }

    const buffer = new Uint8Array(await response.arrayBuffer());
    const charset = detectCharset(
      response.headers.get("content-type"),
      buffer.slice(0, 1024)
    );

    try {
      return new TextDecoder(charset).decode(buffer);
    } catch {
      return new TextDecoder("utf-8").decode(buffer);
    }
  } catch (error) {
    if (error instanceof ProductFetchError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProductFetchError(
        "商品ページの取得がタイムアウトしました",
        "timeout"
      );
    }
    throw new ProductFetchError(
      "商品ページに接続できませんでした",
      "network_error"
    );
  } finally {
    clearTimeout(timeout);
  }
}
