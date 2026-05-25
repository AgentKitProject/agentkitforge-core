#!/usr/bin/env node
import { Command } from "commander";
import { exportOneFile } from "../export/onefile.js";
import { packageAgentKit } from "../package/packager.js";
import type { AgentKitValidationProfile } from "../types.js";
import { validateAgentKit } from "../validation/validator.js";

const profiles = ["local-valid", "publishable", "trusted", "verified"];

const program = new Command()
  .name("agentkitforge")
  .description("AgentKitForge core CLI")
  .version("0.1.0");

program
  .command("validate")
  .argument("<path>", "Agent Kit folder")
  .option("--profile <profile>", "Validation profile", "local-valid")
  .action(async (kitPath: string, options: { profile: string }) => {
    if (!profiles.includes(options.profile)) {
      throw new Error(`Invalid profile: ${options.profile}`);
    }

    const report = await validateAgentKit(
      kitPath,
      options.profile as AgentKitValidationProfile
    );

    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.valid ? 0 : 1;
  });

program
  .command("export-onefile")
  .argument("<path>", "Agent Kit folder")
  .requiredOption("--out <file>", "Output Markdown file")
  .action(async (kitPath: string, options: { out: string }) => {
    const outPath = await exportOneFile(kitPath, options.out);
    console.log(outPath);
  });

program
  .command("package")
  .argument("<path>", "Agent Kit folder")
  .requiredOption("--out <file>", "Output .agentkit.zip file")
  .action(async (kitPath: string, options: { out: string }) => {
    const outPath = await packageAgentKit(kitPath, options.out);
    console.log(outPath);
  });

await program.parseAsync();
