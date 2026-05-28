import { z } from "zod";

export const agentKitSkillSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  description: z.string().min(1),
  triggers: z.array(z.string().min(1)).min(1)
});

export const agentKitPromptSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens"),
  path: z.string().min(1),
  description: z.string().min(1)
});

export const agentKitManifestSchema = z
  .object({
    schemaVersion: z.string().min(1),
    kind: z.string().min(1),
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().min(1),
    author: z.object({
      name: z.string().min(1)
    }),
    license: z.string().min(1),
    entrypoints: z.object({
      human: z.string().min(1),
      agent: z.string().min(1)
    }),
    userExperience: z.object({
      setupLevel: z.string().min(1)
    }),
    compatibility: z.object({
      targets: z.array(z.string().min(1)).min(1)
    }),
    risk: z.object({
      level: z.string().min(1)
    }),
    skills: z.array(agentKitSkillSchema).min(1),
    prompts: z.array(agentKitPromptSchema).optional(),
    scripts: z
      .array(
        z.union([
          z.string().min(1),
          z.object({
            id: z.string().min(1).optional(),
            path: z.string().min(1),
            description: z.string().min(1).optional()
          })
        ])
      )
      .optional()
  })
  .passthrough();

export type AgentKitManifestInput = z.input<typeof agentKitManifestSchema>;
