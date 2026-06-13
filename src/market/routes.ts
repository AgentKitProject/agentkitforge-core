/**
 * Forge ↔ Market (Seam A) route builders.
 *
 * These mirror `forgeMarketRoutes` from `@agentkitproject/contracts`
 * (`agentkitproject-contracts/src/market.ts`) EXACTLY. We intentionally do not
 * yet depend on the contracts package from core (it is a git dep elsewhere);
 * adding that dependency + a contract test is a tracked follow-up. Until then
 * these paths are the canonical Seam-A shapes and must stay in lockstep.
 */

export const forgeMarketRoutes = {
  download: (slug: string): string =>
    `/api/forge/kits/${encodeURIComponent(slug)}/download`,
  submissionUploadUrl: (): string => "/api/forge/submissions/upload-url",
  submissionValidate: (submissionId: string): string =>
    `/api/forge/submissions/${encodeURIComponent(submissionId)}/validate`,
  publisherProfile: (): string => "/api/forge/publisher-profile"
} as const;
