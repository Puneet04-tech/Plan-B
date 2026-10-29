"use strict";

import type { Ideas, IdeaCategory } from "@shared/types";
import type { IdeasInput, IdeasProvider, IdeasProviderResult } from "./provider";

interface FallbackTemplate {
  title: string;
  description: string;
  /** fraction of the category cap this idea costs */
  shareOfCap: number;
}

const FALLBACKS: Record<string, FallbackTemplate[]> = {
  decor: [
    {
      title: "Marigold & fabric drapes",
      description:
        "Classic Indian entrance decor with marigold strings and draped fabric arches.",
      shareOfCap: 0.5,
    },
    {
      title: "Lantern & fairy-light corner",
      description:
        "Warm lighting corner with paper lanterns — works indoors and outdoors.",
      shareOfCap: 0.4,
    },
  ],
  menu: [
    {
      title: "Live chaat counter",
      description:
        "A crowd-pleasing live counter with 3 chaat varieties; scales well for large groups.",
      shareOfCap: 0.4,
    },
    {
      title: "Two-dish main course",
      description:
        "One veg and one non-veg main with rice/roti keeps per-plate cost predictable.",
      shareOfCap: 0.5,
    },
  ],
  activities: [
    {
      title: "Photo booth with props",
      description:
        "A themed photo corner with printed props — memorable and budget-friendly.",
      shareOfCap: 0.4,
    },
    {
      title: "Games corner",
      description: "2–3 traditional games with small prizes keep guests engaged cheaply.",
      shareOfCap: 0.3,
    },
  ],
  entertainment: [
    {
      title: "Local acoustic duo",
      description: "A two-person acoustic set fits most budgets and venues.",
      shareOfCap: 0.5,
    },
    {
      title: "Curated playlist + emcee",
      description:
        "A good emcee with a well-planned playlist often beats a DJ on budget.",
      shareOfCap: 0.3,
    },
  ],
};

const THEME_CONCEPTS: Record<string, string> = {
  wedding: "Warm traditional celebration with modern touches",
  birthday: "Playful, colorful and high-energy",
  community: "Inclusive neighborhood gathering with local flavor",
};

/** Works with no API key at all. Marks everything as fitting the budget caps. */
export class FallbackProvider implements IdeasProvider {
  async generate(input: IdeasInput): Promise<IdeasProviderResult> {
    const items: Ideas["items"] = [];
    const categories: IdeaCategory[] = ["decor", "menu", "activities", "entertainment"];
    const cityNote = input.city ? ` tuned for ${input.city}` : "";
    for (const category of categories) {
      const cap = input.caps[category] ?? 0;
      for (const template of FALLBACKS[category]) {
        const isMenu = category === "menu";
        const cost = isMenu
          ? Math.floor((cap / Math.max(1, input.guests)) * template.shareOfCap)
          : Math.floor(cap * template.shareOfCap);
        if (cost <= 0) continue;
        items.push({
          title: template.title,
          description: `${template.description}${cityNote}.`,
          estimatedCost: isMenu
            ? Math.floor(input.caps.menu / Math.max(1, input.guests))
            : cost,
          category,
          fitsBudget: true,
        });
      }
    }
    const ideas: Ideas = {
      themeConcept: THEME_CONCEPTS[input.eventType] ?? "A memorable celebration",
      items,
    };
    return { ideas, source: "fallback" };
  }

  /** Static, qualitative-only tips — no numbers, safe without any API key. */
  async recoveryTips(scenarioLabel: string, _eventType: string): Promise<string[]> {
    void _eventType;
    return [
      `Act on "${scenarioLabel}" immediately: confirm replacements in writing before announcing anything to guests.`,
      "Assign one decision-maker for the disrupted vendor category so messages stay consistent.",
      "Update the vendor checklist notes and inform affected vendors the same day.",
    ];
  }
}
