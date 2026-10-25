"use strict";

export interface PersonalizedIdeas {
  themes: ThemeSuggestion[];
  decor: DecorSuggestion[];
  menu: MenuSuggestion[];
  activities: ActivitySuggestion[];
}

export interface ThemeSuggestion {
  name: string;
  description: string;
  estimatedCost: number;
  suitability: number;
}

export interface DecorSuggestion {
  name: string;
  description: string;
  estimatedCost: number;
  setupTime: string;
}

export interface MenuSuggestion {
  name: string;
  description: string;
  perPersonCost: number;
  dietaryOptions: string[];
}

export interface ActivitySuggestion {
  name: string;
  description: string;
  duration: string;
  estimatedCost: number;
}

// Plain JSON Schema for Gemini responseSchema (no additionalProperties — Gemini rejects it)
export const IdeasJsonSchema = {
  type: "object",
  properties: {
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          estimatedCost: { type: "number" },
          suitability: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["name", "description", "estimatedCost", "suitability"],
      },
    },
    decor: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          estimatedCost: { type: "number" },
          setupTime: { type: "string" },
        },
        required: ["name", "description", "estimatedCost", "setupTime"],
      },
    },
    menu: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          perPersonCost: { type: "number" },
          dietaryOptions: { type: "array", items: { type: "string" } },
        },
        required: ["name", "description", "perPersonCost", "dietaryOptions"],
      },
    },
    activities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          duration: { type: "string" },
          estimatedCost: { type: "number" },
        },
        required: ["name", "description", "duration", "estimatedCost"],
      },
    },
  },
  required: ["themes", "decor", "menu", "activities"],
};

export const FallbackIdeas: PersonalizedIdeas = {
  themes: [
    {
      name: "Classic Elegance",
      description: "Traditional wedding theme with timeless charm",
      estimatedCost: 50000,
      suitability: 0.8,
    },
    {
      name: "Modern Romance",
      description: "Contemporary style with romantic touches",
      estimatedCost: 75000,
      suitability: 0.9,
    },
    {
      name: "Rustic Chic",
      description: "Natural elements with rustic finishes",
      estimatedCost: 45000,
      suitability: 0.7,
    },
  ],
  decor: [
    {
      name: "Floral Wonderland",
      description: "Elegant floral arrangements throughout venue",
      estimatedCost: 30000,
      setupTime: "2-3 hours",
    },
    {
      name: "LED Lighting Setup",
      description: "Modern LED lighting for ambiance",
      estimatedCost: 25000,
      setupTime: "1-2 hours",
    },
  ],
  menu: [
    {
      name: "Three-Course Deluxe",
      description: "Appetizer, main course, and dessert",
      perPersonCost: 2500,
      dietaryOptions: ["Vegetarian", "Non-Vegetarian", "Vegan"],
    },
    {
      name: "Gourmet Buffet",
      description: "Variety of dishes for all guests",
      perPersonCost: 3000,
      dietaryOptions: ["Vegetarian", "Non-Vegetarian", "Gluten-Free"],
    },
  ],
  activities: [
    {
      name: "Live Music Band",
      description: "Professional wedding band for ceremony and reception",
      duration: "3 hours",
      estimatedCost: 40000,
    },
    {
      name: "Photo Booth",
      description: "Interactive photo booth with instant prints",
      duration: "2 hours",
      estimatedCost: 15000,
    },
  ],
};
