import { afterEach, describe, expect, it } from "vitest";
import { FallbackProvider } from "../src/llm/fallback";
import { CloudflareProvider, enforceCaps, sanitizeTheme } from "../src/llm/cloudflare";
import { createIdeasProvider } from "../src/llm/factory";
import type { IdeasInput } from "../src/llm/provider";

const input: IdeasInput = {
  eventType: "wedding",
  city: "Mumbai",
  guests: 100,
  budget: 500000,
  theme: "Classic Elegance",
  caps: { decor: 60000, menu: 1500, activities: 30000, entertainment: 35000 },
};

describe("FallbackProvider", () => {
  it("produces ideas for every category without any API key", async () => {
    const result = await new FallbackProvider().generate(input);
    expect(result.source).toBe("fallback");
    const categories = new Set(result.ideas.items.map((item) => item.category));
    expect(categories).toEqual(new Set(["decor", "menu", "activities", "entertainment"]));
  });

  it("marks every fallback idea as fitting the budget", async () => {
    const result = await new FallbackProvider().generate(input);
    expect(result.ideas.items.every((item) => item.fitsBudget)).toBe(true);
    expect(result.ideas.themeConcept.length).toBeGreaterThan(0);
  });

  it("returns qualitative recovery tips with no numbers", async () => {
    const tips = await new FallbackProvider().recoveryTips("Rain expected", "wedding");
    expect(tips.length).toBeGreaterThan(0);
    for (const tip of tips) {
      expect(tip).not.toMatch(/\d/);
    }
  });
});

describe("enforceCaps", () => {
  const caps = { decor: 1000, menu: 500, activities: 800, entertainment: 900 };

  it("keeps ideas that fit the cap", () => {
    const ideas = enforceCaps(
      {
        themeConcept: "Test",
        items: [
          { title: "Fits", description: "d", estimatedCost: 900, category: "decor" },
        ],
      },
      caps,
    );
    expect(ideas.items).toHaveLength(1);
    expect(ideas.items[0]?.estimatedCost).toBe(900);
  });

  it("trims an idea that is only slightly over the cap", () => {
    const ideas = enforceCaps(
      {
        themeConcept: "Test",
        items: [
          {
            title: "Slightly over",
            description: "d",
            estimatedCost: 1200,
            category: "decor",
          },
        ],
      },
      caps,
    );
    expect(ideas.items).toHaveLength(1);
    expect(ideas.items[0]?.estimatedCost).toBeLessThanOrEqual(1000);
  });

  it("drops an idea that is far over the cap", () => {
    const ideas = enforceCaps(
      {
        themeConcept: "Test",
        items: [
          { title: "Way over", description: "d", estimatedCost: 5000, category: "decor" },
        ],
      },
      caps,
    );
    expect(ideas.items).toHaveLength(0);
  });
});

describe("createIdeasProvider", () => {
  const originalToken = process.env.CLOUDFLARE_API_TOKEN;
  const originalAccount = process.env.CLOUDFLARE_ACCOUNT_ID;

  afterEach(() => {
    process.env.CLOUDFLARE_API_TOKEN = originalToken;
    process.env.CLOUDFLARE_ACCOUNT_ID = originalAccount;
    if (originalToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
    if (originalAccount === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID;
  });

  it("uses the offline provider when credentials are missing", () => {
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    expect(createIdeasProvider()).toBeInstanceOf(FallbackProvider);
  });

  it("ignores placeholder credentials from .env.example", () => {
    process.env.CLOUDFLARE_API_TOKEN = "your-cloudflare-api-token-here";
    process.env.CLOUDFLARE_ACCOUNT_ID = "your-cloudflare-account-id-here";
    expect(createIdeasProvider()).toBeInstanceOf(FallbackProvider);
  });

  it("uses Workers AI when real credentials are present", () => {
    process.env.CLOUDFLARE_API_TOKEN = "cf-token";
    process.env.CLOUDFLARE_ACCOUNT_ID = "account-id";
    expect(createIdeasProvider()).toBeInstanceOf(CloudflareProvider);
  });
});

describe("sanitizeTheme", () => {
  it("strips control characters and code fences", () => {
    expect(sanitizeTheme("  ```\nRoyal\u0000 wedding ``` ")).toBe("Royal wedding");
  });

  it("caps the length at 60 characters", () => {
    expect(sanitizeTheme("a".repeat(120))).toHaveLength(60);
  });

  it("handles an undefined theme", () => {
    expect(sanitizeTheme(undefined)).toBe("");
  });
});
