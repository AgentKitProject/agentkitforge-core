/**
 * `agentkitforge market …` CLI commands — the headless-friendly hosted
 * AgentKitMarket client (login / logout / submit / import), wiring the pure
 * `@agentkitforge/core/market` operations to a terminal.
 *
 * This is the CLI ↔ market boundary: the spec engine stays pure and never
 * imports from here. All network/auth work goes through `src/market/`.
 *
 * Never log token values.
 */

import { Command } from "commander";

import { getAgentKitSummary } from "../app/summary.js";
import {
  createDefaultTokenStore,
  DEFAULT_MARKET_BASE_URL,
  ensureAccessToken,
  importKit,
  login,
  logout,
  ReconnectRequiredError,
  submitKit,
  type DeviceLoginPrompt
} from "../market/index.js";

const profiles = ["local-valid", "publishable", "trusted", "verified"];

/**
 * Mirrors the Rust `missing_auth_config_message`: the WorkOS client id is the
 * only required piece of configuration for hosted-Market auth.
 */
export const MISSING_CLIENT_ID_MESSAGE =
  "Forge account connection is not configured. " +
  "Set AGENTKITPROJECT_WORKOS_CLIENT_ID to the WorkOS client id for your " +
  "AgentKitProject deployment, then retry.";

/**
 * Resolve the WorkOS client id from a `--client-id` override, falling back to
 * the `AGENTKITPROJECT_WORKOS_CLIENT_ID` environment variable. Throws a clear,
 * actionable error when neither is present.
 */
export function resolveClientId(override?: string): string {
  const candidate = override?.trim() || process.env.AGENTKITPROJECT_WORKOS_CLIENT_ID?.trim();
  if (!candidate) {
    throw new Error(MISSING_CLIENT_ID_MESSAGE);
  }
  return candidate;
}

/**
 * Single source of truth for the hosted Market base URL: explicit flag →
 * `AGENTKITFORGE_MARKET_BASE_URL` env → the default hosted constant.
 */
export function resolveMarketBaseUrl(flag?: string): string {
  const candidate = flag?.trim() || process.env.AGENTKITFORGE_MARKET_BASE_URL?.trim();
  return candidate && candidate.length > 0 ? candidate : DEFAULT_MARKET_BASE_URL;
}

function describeUser(user?: { email?: string; id?: string }): string {
  if (!user) return "your AgentKitProject account";
  return user.email?.trim() || user.id?.trim() || "your AgentKitProject account";
}

/** Register the `market` command group onto an existing program. */
export function registerMarketCommands(program: Command): void {
  const market = program
    .command("market")
    .description("Hosted AgentKitMarket: login, submit, import");

  market
    .command("login")
    .description("Connect your AgentKitProject account via WorkOS device flow")
    .option("--client-id <id>", "WorkOS client id (overrides AGENTKITPROJECT_WORKOS_CLIENT_ID)")
    .action(async (options: { clientId?: string }) => {
      const clientId = resolveClientId(options.clientId);
      const store = createDefaultTokenStore();
      const result = await login(
        {
          clientId,
          onPrompt: (prompt: DeviceLoginPrompt) => {
            console.log("To connect your AgentKitProject account:");
            console.log(`  1. Visit: ${prompt.verificationUri}`);
            console.log(`  2. Enter code: ${prompt.userCode}`);
            if (prompt.verificationUriComplete) {
              console.log(`  Or open directly: ${prompt.verificationUriComplete}`);
            }
            console.log("Waiting for approval…");
          }
        },
        store
      );
      console.log(`Connected as ${describeUser(result.user)}.`);
    });

  market
    .command("logout")
    .description("Disconnect your AgentKitProject account (clears the stored session)")
    .action(async () => {
      const store = createDefaultTokenStore();
      await logout(store);
      console.log("Disconnected from hosted AgentKitMarket.");
    });

  market
    .command("submit")
    .description("Validate, package, and submit an Agent Kit to hosted AgentKitMarket")
    .argument("<kitPath>", "Agent Kit folder")
    .option("--market-url <url>", "Hosted Market base URL")
    .option("--profile <profile>", "Validation profile", "publishable")
    .option("--publisher-id <name>", "AgentKitProfile display name (publisher id)")
    .action(
      async (
        kitPath: string,
        options: { marketUrl?: string; profile: string; publisherId?: string }
      ) => {
        if (!profiles.includes(options.profile)) {
          throw new Error(`Invalid profile: ${options.profile}`);
        }
        const clientId = resolveClientId();
        const marketBaseUrl = resolveMarketBaseUrl(options.marketUrl);
        const store = createDefaultTokenStore();

        try {
          await ensureAccessToken(store, { clientId });
        } catch (error) {
          if (error instanceof ReconnectRequiredError) {
            throw new ReconnectRequiredError(
              "Not connected to hosted AgentKitMarket. Run `agentkitforge market login` first."
            );
          }
          throw error;
        }

        const publisherId =
          options.publisherId?.trim() || (await store.get())?.user?.email?.trim() || "";

        const result = await submitKit(store, {
          clientId,
          marketBaseUrl,
          rootPath: kitPath,
          publisherId
        });
        console.log(`Submission id: ${result.submissionId}`);
        console.log(`Status:        ${result.status}`);
        console.log(`Market link:   ${result.marketLink}`);
        console.log(`sha256:        ${result.sha256}`);
      }
    );

  market
    .command("import")
    .description("Import a kit from hosted AgentKitMarket by slug, ID, or URL")
    .argument("<slugOrIdOrUrl>", "Market kit slug, kit ID, or Market URL")
    .option("--market-url <url>", "Hosted Market base URL")
    .option("--target <dir>", "Directory to extract the kit into")
    .action(
      async (slugOrIdOrUrl: string, options: { marketUrl?: string; target?: string }) => {
        const clientId = resolveClientId();
        const marketBaseUrl = resolveMarketBaseUrl(options.marketUrl);
        const store = createDefaultTokenStore();

        try {
          await ensureAccessToken(store, { clientId });
        } catch (error) {
          if (error instanceof ReconnectRequiredError) {
            throw new ReconnectRequiredError(
              "Not connected to hosted AgentKitMarket. Run `agentkitforge market login` first."
            );
          }
          throw error;
        }

        const result = await importKit(store, {
          clientId,
          marketBaseUrl,
          slug: slugOrIdOrUrl,
          targetDir: options.target
        });
        let name = result.provenance.marketSlug;
        let version = result.provenance.version ?? "unknown";
        try {
          const summary = await getAgentKitSummary(result.rootPath);
          name = summary.name;
          version = summary.version;
        } catch {
          // Fall back to provenance if the extracted kit can't be summarized.
        }
        console.log(`Imported: ${name} (v${version})`);
        console.log(`Location: ${result.rootPath}`);
        console.log(`Source:   ${result.provenance.source}`);
        console.log(`Version:  ${result.provenance.version ?? "unknown"}`);
        console.log(`sha256:   ${result.provenance.sha256 ?? "unknown"}`);
      }
    );
}
