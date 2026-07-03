// 商品URLをページのID(URLパスの一部)として使えるように可逆変換する。
// ブラウザ・サーバーどちらでも動くように btoa/atob ベースの base64url を使う。

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeProductId(url: string): string {
  return toBase64Url(new TextEncoder().encode(url));
}

export function decodeProductId(id: string): string {
  return new TextDecoder().decode(fromBase64Url(id));
}
