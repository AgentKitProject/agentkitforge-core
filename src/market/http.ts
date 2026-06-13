/**
 * Shared HTTP plumbing for hosted-AgentKitMarket operations.
 *
 * Pure/headless: networking goes through an injectable `fetch` (defaults to the
 * global `fetch`, Node 18+). The auth-token lifecycle is delegated to the
 * phase-1 `ensureAccessToken`/`refreshAccessToken` helpers via the supplied
 * {@link TokenStore}; this module only adds the once-on-401 refresh-and-retry
 * pattern around an already-issued token.
 *
 * Never log token values.
 */

import {
  ensureAccessToken,
  refreshAccessToken,
  ReconnectRequiredError,
  type EnsureAccessTokenOptions
} from "./auth.js";
import type { TokenStore } from "./types.js";

/** Minimal fetch surface used by the operations, for easy stubbing in tests. */
export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Uint8Array;
  }
) => Promise<FetchLikeResponse>;

export interface FetchLikeResponse {
  status: number;
  ok: boolean;
  text(): Promise<string>;
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** Options shared by every authenticated hosted-Market operation. */
export interface MarketRequestOptions extends EnsureAccessTokenOptions {
  /** Base URL of the hosted Market (e.g. https://market.agentkitproject.com). */
  marketBaseUrl?: string;
  /** Injectable fetch, defaults to the global `fetch`. */
  fetch?: FetchLike;
}

export const DEFAULT_MARKET_BASE_URL = "https://market.agentkitproject.com";

const ALLOWED_MARKET_HOST = "market.agentkitproject.com";

function resolveFetch(custom?: FetchLike): FetchLike {
  if (custom) return custom;
  if (typeof fetch === "function") {
    return fetch as unknown as FetchLike;
  }
  throw new Error("No global fetch available; pass options.fetch.");
}

/**
 * Validate + normalize the hosted-Market base URL. Mirrors the Rust
 * `normalize_hosted_market_base_url`: only https://market.agentkitproject.com
 * is accepted for direct hosted-Market traffic.
 */
export function normalizeMarketBaseUrl(baseUrl?: string): string {
  const trimmed = baseUrl?.trim();
  const candidate =
    trimmed && trimmed.length > 0 ? trimmed : DEFAULT_MARKET_BASE_URL;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Hosted Market base URL is invalid.");
  }
  if (parsed.protocol !== "https:" || parsed.host !== ALLOWED_MARKET_HOST) {
    throw new Error(
      "Direct hosted Market import only supports https://market.agentkitproject.com."
    );
  }
  return DEFAULT_MARKET_BASE_URL;
}

/**
 * Perform an authenticated hosted-Market request: send with the current token,
 * and if the response is 401 once, refresh the token and retry exactly once.
 * A second 401 (or a failed refresh) surfaces as {@link ReconnectRequiredError}.
 *
 * Mirrors the Rust `hosted_market_authed_request`.
 */
export async function authedRequest(
  store: TokenStore,
  options: MarketRequestOptions,
  send: (token: string) => Promise<FetchLikeResponse>
): Promise<FetchLikeResponse> {
  const token = await ensureAccessToken(store, options);
  const first = await send(token);
  if (first.status !== 401) {
    return first;
  }
  const refreshed = await refreshAccessToken(store, options);
  const second = await send(refreshed);
  if (second.status === 401) {
    throw new ReconnectRequiredError();
  }
  return second;
}

export { ReconnectRequiredError };
