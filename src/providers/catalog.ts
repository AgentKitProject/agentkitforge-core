import type {
  AiProviderType,
  KnownModel,
  ProviderCapabilities
} from "./types.js";

export const aiProviderTypes: AiProviderType[] = [
  "openai",
  "anthropic",
  "gemini",
  "ollama",
  "openai-compatible"
];

export const modelCatalog: Record<AiProviderType, KnownModel[]> = {
  openai: [
    {
      id: "gpt-4.1",
      label: "GPT-4.1",
      providerTypes: ["openai"],
      recommendedFor: ["kit-use", "draft-generation"],
      supportsStructuredJson: true,
      notes: "Starter catalog suggestion. Consumers must allow custom OpenAI model IDs."
    },
    {
      id: "gpt-4.1-mini",
      label: "GPT-4.1 Mini",
      providerTypes: ["openai"],
      recommendedFor: ["kit-use", "fast", "cheap"],
      supportsStructuredJson: true,
      notes: "Starter catalog suggestion for lower-cost workflows."
    }
  ],
  anthropic: [
    {
      id: "claude-sonnet-4-5",
      label: "Claude Sonnet 4.5",
      providerTypes: ["anthropic"],
      recommendedFor: ["kit-use", "draft-generation"],
      supportsStructuredJson: true,
      notes: "Starter catalog suggestion. Verify availability with the Anthropic account used by the app."
    },
    {
      id: "claude-haiku-4-5",
      label: "Claude Haiku 4.5",
      providerTypes: ["anthropic"],
      recommendedFor: ["kit-use", "fast", "cheap"],
      supportsStructuredJson: true,
      notes: "Starter catalog suggestion for faster workflows."
    }
  ],
  gemini: [
    {
      id: "gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      providerTypes: ["gemini"],
      recommendedFor: ["kit-use", "draft-generation"],
      supportsStructuredJson: true,
      notes: "Starter catalog suggestion. Verify availability with the Gemini API account used by the app."
    },
    {
      id: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      providerTypes: ["gemini"],
      recommendedFor: ["kit-use", "fast", "cheap"],
      supportsStructuredJson: true,
      notes: "Starter catalog suggestion for faster workflows."
    }
  ],
  ollama: [
    {
      id: "llama3.1",
      label: "Llama 3.1",
      providerTypes: ["ollama"],
      recommendedFor: ["kit-use", "local"],
      supportsStructuredJson: false,
      notes: "Example local model name. Installed Ollama model IDs vary by machine."
    },
    {
      id: "mistral",
      label: "Mistral",
      providerTypes: ["ollama"],
      recommendedFor: ["fast", "cheap", "local"],
      supportsStructuredJson: false,
      notes: "Example local model name. Consumers must allow custom local model IDs."
    }
  ],
  "openai-compatible": []
};

const providerCapabilities: Record<AiProviderType, ProviderCapabilities> = {
  openai: {
    providerType: "openai",
    apiKeyRequired: true,
    baseUrlRequired: false,
    supportsCustomModels: true,
    supportsStructuredJson: true
  },
  anthropic: {
    providerType: "anthropic",
    apiKeyRequired: true,
    baseUrlRequired: false,
    supportsCustomModels: true,
    supportsStructuredJson: true
  },
  gemini: {
    providerType: "gemini",
    apiKeyRequired: true,
    baseUrlRequired: false,
    supportsCustomModels: true,
    supportsStructuredJson: true
  },
  ollama: {
    providerType: "ollama",
    apiKeyRequired: false,
    baseUrlRequired: true,
    supportsCustomModels: true,
    supportsStructuredJson: false,
    notes: "Local model JSON reliability depends on the installed model and runtime options."
  },
  "openai-compatible": {
    providerType: "openai-compatible",
    apiKeyRequired: true,
    baseUrlRequired: true,
    supportsCustomModels: true,
    supportsStructuredJson: false,
    notes: "Structured JSON support depends on the compatible server and selected model."
  }
};

export const structuredOutputGuidance = {
  draftGeneration:
    "Agent Kit draft generation must return valid JSON matching the AgentKitDraft schema.",
  reliability:
    "Providers and models vary in JSON reliability. Validate every returned draft before rendering it.",
  localModelWarning:
    "Local and custom models should warn users when structured JSON support is not known or explicitly disabled."
} as const;

export function getKnownModelsForProvider(providerType: AiProviderType): KnownModel[] {
  return [...modelCatalog[providerType]];
}

export function getDefaultModelForProvider(providerType: AiProviderType): string | undefined {
  return modelCatalog[providerType][0]?.id;
}

export function getProviderCapabilities(providerType: AiProviderType): ProviderCapabilities {
  return { ...providerCapabilities[providerType] };
}

export function isApiKeyRequiredForProvider(providerType: AiProviderType): boolean {
  return providerCapabilities[providerType].apiKeyRequired;
}

export function isBaseUrlRequiredForProvider(providerType: AiProviderType): boolean {
  return providerCapabilities[providerType].baseUrlRequired;
}

export function normalizeBaseUrl(
  providerType: AiProviderType,
  baseUrl?: string
): string | undefined {
  const trimmed = baseUrl?.trim();
  if (trimmed) {
    return trimmed.replace(/\/+$/, "");
  }

  if (providerType === "ollama") {
    return "http://localhost:11434";
  }

  return undefined;
}

export function providerSupportsStructuredJson(
  providerType: AiProviderType,
  modelId?: string,
  explicitOverride?: boolean
): boolean {
  if (explicitOverride !== undefined) {
    return explicitOverride;
  }

  const knownModel = modelCatalog[providerType].find((model) => model.id === modelId);
  if (knownModel?.supportsStructuredJson !== undefined) {
    return knownModel.supportsStructuredJson;
  }

  return providerCapabilities[providerType].supportsStructuredJson;
}
