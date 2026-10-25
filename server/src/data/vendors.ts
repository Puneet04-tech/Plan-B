"use strict";

import type { EventType, VendorItem } from "@shared/types";

// Estimated costs are DEFAULTS, recalculated against the budget at plan time
// (each item's cost is pulled from its mapped budget line, split across items).

interface VendorTemplate extends Omit<VendorItem, "id" | "estimatedCost"> {
  id: string;
}

const VENDOR_TEMPLATES: Record<EventType, VendorTemplate[]> = {
  community: [
    {
      id: "venue",
      category: "Venue",
      budgetKey: "venue",
      questions: [
        "What is the capacity and seating layout?",
        "Is stage and power supply included?",
        "What are the access hours for setup and cleanup?",
      ],
      documents: ["Booking confirmation letter", "Venue usage agreement"],
      advancePaymentGuidance: "25% advance, balance after the event",
      confirmLeadDays: 21,
      riskLevel: "high",
      needsBackup: true,
    },
    {
      id: "caterer",
      category: "Caterer",
      budgetKey: "catering",
      questions: [
        "Per-plate price and menu flexibility?",
        "How many serving counters for our guest count?",
        "Water arrangement and hygiene certification?",
      ],
      documents: ["FSSAI license copy", "Quotation with menu"],
      advancePaymentGuidance: "30% advance with menu confirmation",
      confirmLeadDays: 14,
      riskLevel: "high",
      needsBackup: true,
    },
    {
      id: "soundLights",
      category: "Sound & Lights",
      budgetKey: "soundLights",
      questions: [
        "What equipment is included (mics, speakers, lights)?",
        "Is a technician on-site included?",
        "Backup power plan?",
      ],
      documents: ["Equipment list", "Quotation"],
      advancePaymentGuidance: "50% advance, balance on event day",
      confirmLeadDays: 10,
      riskLevel: "medium",
      needsBackup: false,
    },
    {
      id: "security",
      category: "Security & First Aid",
      budgetKey: "permitsSecurity",
      questions: [
        "How many guards for the expected crowd?",
        "Is first-aid support included?",
        "Coordination with local police station done?",
      ],
      documents: ["Guard deployment list", "First-aid certificate"],
      advancePaymentGuidance: "Full payment usually on event day",
      confirmLeadDays: 10,
      riskLevel: "medium",
      needsBackup: false,
      complianceNote:
        "Check your local rules: venue permission, loudspeaker permission (A-phase), police intimation and first-aid requirements vary by city and state.",
    },
  ],
  birthday: [
    {
      id: "venue",
      category: "Venue",
      budgetKey: "venue",
      questions: [
        "What is the kids-friendly capacity?",
        "Is decoration allowed or restricted?",
        "What is the slot timing and overtime cost?",
      ],
      documents: ["Booking confirmation", "Slot receipt"],
      advancePaymentGuidance: "50% advance to lock the slot",
      confirmLeadDays: 14,
      riskLevel: "high",
      needsBackup: true,
    },
    {
      id: "caterer",
      category: "Caterer",
      budgetKey: "catering",
      questions: [
        "Kids menu options and per-plate price?",
        "Cake-cutting coordination included?",
        "Allergy handling?",
      ],
      documents: ["Menu card", "Quotation"],
      advancePaymentGuidance: "30% advance with menu confirmation",
      confirmLeadDays: 10,
      riskLevel: "high",
      needsBackup: true,
    },
    {
      id: "decorator",
      category: "Decorator",
      budgetKey: "decor",
      questions: [
        "Theme-based decoration options?",
        "Setup and teardown timing?",
        "Balloon/props alternatives for allergies?",
      ],
      documents: ["Design mock", "Quotation"],
      advancePaymentGuidance: "40% advance, balance after setup",
      confirmLeadDays: 7,
      riskLevel: "medium",
      needsBackup: false,
    },
    {
      id: "entertainer",
      category: "Entertainment",
      budgetKey: "entertainment",
      questions: [
        "Magician/DJ/games host packages?",
        "Duration and interaction style for kids?",
        "Own sound system?",
      ],
      documents: ["Package details"],
      advancePaymentGuidance: "Full payment on the day is common",
      confirmLeadDays: 7,
      riskLevel: "low",
      needsBackup: false,
    },
    {
      id: "photographer",
      category: "Photographer",
      budgetKey: "photography",
      questions: [
        "Hours covered and candid style?",
        "Delivery timeline for edited photos?",
      ],
      documents: ["Package details", "Sample gallery"],
      advancePaymentGuidance: "25% advance, balance on delivery",
      confirmLeadDays: 7,
      riskLevel: "low",
      needsBackup: false,
    },
  ],
  wedding: [
    {
      id: "venue",
      category: "Venue",
      budgetKey: "venue",
      questions: [
        "Guest capacity across functions (mehendi, sangeet, wedding)?",
        "Rooms included for family?",
        "Catering policy — in-house or external allowed?",
      ],
      documents: [
        "Booking agreement",
        "Advance receipt",
        "Cancellation policy in writing",
      ],
      advancePaymentGuidance:
        "25–40% advance; get cancellation terms in writing",
      confirmLeadDays: 60,
      riskLevel: "high",
      needsBackup: true,
    },
    {
      id: "caterer",
      category: "Caterer",
      budgetKey: "catering",
      questions: [
        "Menu tasting included?",
        "Live counters vs buffet pricing?",
        "Staff-to-guest ratio?",
      ],
      documents: ["FSSAI license", "Menu tasting notes", "Quotation"],
      advancePaymentGuidance: "30% advance at booking, 40% a week before",
      confirmLeadDays: 45,
      riskLevel: "high",
      needsBackup: true,
    },
    {
      id: "decorator",
      category: "Decorator",
      budgetKey: "decor",
      questions: [
        "Mandap and stage design options?",
        "Flower freshness guarantee?",
        "Setup completed before haldi/mehendi functions?",
      ],
      documents: ["Design mock-ups", "Quotation"],
      advancePaymentGuidance: "40% advance, balance after setup",
      confirmLeadDays: 30,
      riskLevel: "medium",
      needsBackup: false,
    },
    {
      id: "photographer",
      category: "Photographer",
      budgetKey: "photography",
      questions: [
        "Team size across functions?",
        "Pre-wedding shoot included?",
        "Same-day edit option?",
      ],
      documents: ["Portfolio", "Contract with deliverables list"],
      advancePaymentGuidance: "30% advance, balance on delivery",
      confirmLeadDays: 30,
      riskLevel: "medium",
      needsBackup: false,
    },
    {
      id: "entertainer",
      category: "Entertainment",
      budgetKey: "entertainment",
      questions: [
        "Band/DJ availability for sangeet?",
        "Song list coordination?",
        "Own equipment and backup?",
      ],
      documents: ["Package details"],
      advancePaymentGuidance: "50% advance to lock the date",
      confirmLeadDays: 21,
      riskLevel: "medium",
      needsBackup: false,
    },
  ],
};

export { VENDOR_TEMPLATES };
