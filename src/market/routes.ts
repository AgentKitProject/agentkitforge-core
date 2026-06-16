/**
 * Forge ↔ Market (Seam A) route builders.
 *
 * Single source of truth: re-exported from the public
 * `@agentkitforge/contracts` package (a real runtime dependency now that both
 * core and contracts are published). The previous hand-mirrored copy is gone —
 * `forgeMarketRoutes` here is the contracts definition verbatim, so submit /
 * download / update consumers all share one canonical Seam-A shape.
 */

export { forgeMarketRoutes, forgePricingRoutes } from "@agentkitforge/contracts";
