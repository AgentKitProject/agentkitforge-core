/**
 * `@agentkitforge/core/market` — hosted-AgentKitMarket integration.
 *
 * Phase 1 (this module): the AUTH FOUNDATION — cross-platform token storage,
 * WorkOS device-auth login, proactive refresh, and pure expiry helpers.
 *
 * This is the ONLY place in the package that performs network/auth work. The
 * pure spec engine (validate/package/export) must never import from here.
 *
 * Later phases will add submit/download/import operations and CLI commands.
 */

export type {
  StoredSession,
  TokenStore,
  WorkosUser
} from "./types.js";

export {
  ACCESS_TOKEN_REFRESH_BUFFER_SECONDS,
  decodeJwtExp,
  epochSeconds,
  isTokenExpired,
  tokenNeedsRefresh
} from "./jwt.js";

export {
  configDir,
  createDefaultTokenStore,
  FileTokenStore,
  SERVICE_NAME,
  SESSION_ACCOUNT,
  type FileTokenStoreOptions
} from "./store.js";

export {
  WORKOS_DEVICE_AUTH_SCOPE,
  WORKOS_DEVICE_AUTH_URL,
  WORKOS_DEVICE_TOKEN_URL,
  buildDeviceAuthorizationRequest,
  buildDeviceTokenRequest,
  buildRefreshTokenRequest,
  parseDeviceAuthorizationResponse,
  parseDeviceTokenResponse,
  type DeviceAuthorizationResponse,
  type DeviceTokenResponse,
  type WorkosConfig,
  type WorkosHttpRequest
} from "./workos.js";

export {
  ensureAccessToken,
  login,
  logout,
  refreshAccessToken,
  ReconnectRequiredError,
  RECONNECT_REQUIRED_ERROR,
  type DeviceLoginPrompt,
  type EnsureAccessTokenOptions,
  type LoginOptions,
  type LoginResult,
  type RefreshOptions
} from "./auth.js";
