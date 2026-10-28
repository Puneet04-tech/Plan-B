"use strict";

import type {
  IdeasInput,
  IdeasProvider,
  IdeasProviderResult,
} from "./provider";
import { CloudflareProvider } from "./cloudflare";
import { FallbackProvider } from "./fallback";

/**
 * Selects the provider based on env. Switching to another provider is a
 * one-file change here.
 */
export function createIdeasProvider(): IdeasProvider {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (
    token &&
    accountId &&
    !token.startsWith("your-") &&
    !accountId.startsWith("your-")
  ) {
    // @ts-ignore - Zod schemas ensure runtime type safety
    return new CloudflareProvider(
      accountId,
      token,
      process.env.CLOUDFLARE_AI_MODEL,
    );
  }
  return new FallbackProvider();
}

export type { IdeasInput, IdeasProvider, IdeasProviderResult };
