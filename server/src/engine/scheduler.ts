"use strict";

import type {
  EventType,
  ScheduledTask,
  TaskTemplateItem,
  TaskCriticality,
  TimelinePlan,
} from "@shared/types";
import {
  DAY_MS,
  daysBetween,
  formatDisplayDate,
  toIstIso,
  tryParseIstDate,
} from "../lib/dates";

export class SchedulerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchedulerError";
  }
}

/** Parse a yyyy-mm-dd string as midnight IST, returned as UTC millis. */
export function parseEventDate(iso: string): number {
  const ms = tryParseIstDate(iso);
  if (Number.isNaN(ms)) {
    throw new SchedulerError(
      `Invalid date: ${iso} (expected a real calendar date as yyyy-mm-dd)`,
    );
  }
  return ms;
}

const CRITICALITY_ORDER: Record<TaskCriticality, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const TASK_TEMPLATES: Record<EventType, TaskTemplateItem[]> = {
  community: [
    {
      id: "getPermissions",
      title: "Get event permissions",
      category: "compliance",
      leadDays: 30,
      dependsOn: [],
      criticality: "high",
    },
    {
      id: "bookVenue",
      title: "Book venue",
      category: "venue",
      leadDays: 28,
      dependsOn: ["getPermissions"],
      criticality: "high",
      vendorCategory: "venue",
    },
    {
      id: "bookCaterer",
      title: "Book caterer",
      category: "catering",
      leadDays: 21,
      dependsOn: ["bookVenue"],
      criticality: "high",
      vendorCategory: "caterer",
    },
    {
      id: "bookSoundLights",
      title: "Book sound & lights",
      category: "equipment",
      leadDays: 14,
      dependsOn: ["bookVenue"],
      criticality: "medium",
      vendorCategory: "sound-lights",
    },
    {
      id: "arrangeSecurity",
      title: "Arrange security & first aid",
      category: "compliance",
      leadDays: 14,
      dependsOn: ["getPermissions"],
      criticality: "high",
      vendorCategory: "security",
    },
    {
      id: "promoteEvent",
      title: "Promote the event",
      category: "planning",
      leadDays: 21,
      dependsOn: ["bookVenue"],
      criticality: "medium",
    },
    {
      id: "sendInvitations",
      title: "Send invitations",
      category: "planning",
      leadDays: 14,
      dependsOn: [],
      criticality: "medium",
    },
    {
      id: "recruitVolunteers",
      title: "Recruit volunteers",
      category: "planning",
      leadDays: 14,
      dependsOn: [],
      criticality: "medium",
    },
    {
      id: "confirmVendors",
      title: "Confirm all vendors",
      category: "planning",
      leadDays: 3,
      dependsOn: ["bookCaterer", "bookSoundLights"],
      criticality: "high",
    },
    {
      id: "finalSetup",
      title: "Final venue setup",
      category: "logistics",
      leadDays: 1,
      dependsOn: ["confirmVendors"],
      criticality: "high",
    },
    {
      id: "eventDay",
      title: "Event day",
      category: "event",
      leadDays: 0,
      dependsOn: ["finalSetup"],
      criticality: "high",
    },
    {
      id: "postEventCleanup",
      title: "Post-event cleanup",
      category: "logistics",
      leadDays: -1,
      dependsOn: ["eventDay"],
      criticality: "low",
    },
  ],
  birthday: [
    {
      id: "bookVenue",
      title: "Book party venue",
      category: "venue",
      leadDays: 21,
      dependsOn: [],
      criticality: "high",
      vendorCategory: "venue",
    },
    {
      id: "orderCake",
      title: "Order the cake",
      category: "catering",
      leadDays: 7,
      dependsOn: ["bookVenue"],
      criticality: "high",
      vendorCategory: "caterer",
    },
    {
      id: "bookCaterer",
      title: "Book catering & menu",
      category: "catering",
      leadDays: 14,
      dependsOn: ["bookVenue"],
      criticality: "high",
      vendorCategory: "caterer",
    },
    {
      id: "bookEntertainment",
      title: "Book entertainment (games/DJ/magician)",
      category: "fun",
      leadDays: 14,
      dependsOn: ["bookVenue"],
      criticality: "medium",
      vendorCategory: "entertainer",
    },
    {
      id: "planDecor",
      title: "Plan & order decor",
      category: "decor",
      leadDays: 10,
      dependsOn: ["bookVenue"],
      criticality: "medium",
      vendorCategory: "decorator",
    },
    {
      id: "buyReturnGifts",
      title: "Buy return gifts",
      category: "shopping",
      leadDays: 7,
      dependsOn: [],
      criticality: "low",
    },
    {
      id: "bookPhotographer",
      title: "Book photographer",
      category: "photography",
      leadDays: 10,
      dependsOn: ["bookVenue"],
      criticality: "medium",
      vendorCategory: "photographer",
    },
    {
      id: "sendInvitations",
      title: "Send invitations",
      category: "planning",
      leadDays: 10,
      dependsOn: ["bookVenue"],
      criticality: "high",
    },
    {
      id: "confirmHeadcount",
      title: "Confirm final headcount",
      category: "planning",
      leadDays: 3,
      dependsOn: ["sendInvitations", "bookCaterer"],
      criticality: "high",
    },
    {
      id: "finalSetup",
      title: "Decor & setup at venue",
      category: "logistics",
      leadDays: 1,
      dependsOn: ["planDecor", "confirmHeadcount"],
      criticality: "high",
    },
    {
      id: "eventDay",
      title: "Party day",
      category: "event",
      leadDays: 0,
      dependsOn: ["finalSetup"],
      criticality: "high",
    },
  ],
  wedding: [
    {
      id: "bookVenue",
      title: "Book wedding venue",
      category: "venue",
      leadDays: 120,
      dependsOn: [],
      criticality: "high",
      vendorCategory: "venue",
    },
    {
      id: "bookCaterer",
      title: "Book caterer & menu tasting",
      category: "catering",
      leadDays: 90,
      dependsOn: ["bookVenue"],
      criticality: "high",
      vendorCategory: "caterer",
    },
    {
      id: "bookDecorator",
      title: "Book decorator",
      category: "decor",
      leadDays: 75,
      dependsOn: ["bookVenue"],
      criticality: "high",
      vendorCategory: "decorator",
    },
    {
      id: "bookPhotographer",
      title: "Book photographer & videographer",
      category: "photography",
      leadDays: 75,
      dependsOn: ["bookVenue"],
      criticality: "high",
      vendorCategory: "photographer",
    },
    {
      id: "bookEntertainment",
      title: "Book entertainment (band/DJ)",
      category: "fun",
      leadDays: 60,
      dependsOn: ["bookVenue"],
      criticality: "medium",
      vendorCategory: "entertainer",
    },
    {
      id: "shopAttire",
      title: "Shop attire & makeup",
      category: "shopping",
      leadDays: 45,
      dependsOn: [],
      criticality: "medium",
    },
    {
      id: "sendInvitations",
      title: "Send invitations",
      category: "planning",
      leadDays: 30,
      dependsOn: ["bookVenue"],
      criticality: "high",
    },
    {
      id: "bookLogistics",
      title: "Book guest transport & stay",
      category: "logistics",
      leadDays: 30,
      dependsOn: ["bookVenue"],
      criticality: "medium",
    },
    {
      id: "finalFitting",
      title: "Final attire fitting",
      category: "shopping",
      leadDays: 7,
      dependsOn: ["shopAttire"],
      criticality: "medium",
    },
    {
      id: "confirmVendors",
      title: "Reconfirm all vendors",
      category: "planning",
      leadDays: 3,
      dependsOn: [
        "bookCaterer",
        "bookDecorator",
        "bookPhotographer",
        "bookEntertainment",
      ],
      criticality: "high",
    },
    {
      id: "finalSetup",
      title: "Mandap & venue setup",
      category: "logistics",
      leadDays: 1,
      dependsOn: ["confirmVendors"],
      criticality: "high",
    },
    {
      id: "eventDay",
      title: "Wedding day",
      category: "event",
      leadDays: 0,
      dependsOn: ["finalSetup"],
      criticality: "high",
    },
    {
      id: "postEventWrapUp",
      title: "Post-wedding wrap-up",
      category: "logistics",
      leadDays: -1,
      dependsOn: ["eventDay"],
      criticality: "low",
    },
  ],
};

/** Max leadDays per event type, used for the schedule scale factor. */
function maxLead(eventType: EventType): number {
  return Math.max(...TASK_TEMPLATES[eventType].map((t) => t.leadDays), 1);
}

const SOON_WINDOW_DAYS = 3;

/**
 * Build the timeline. `today` is injected (UTC millis) for testability.
 * All date arithmetic is UTC-millis; display is IST.
 */
export function buildTimeline(
  eventType: EventType,
  eventDateIso: string,
  today: number,
): TimelinePlan {
  const template = TASK_TEMPLATES[eventType];
  if (!template) throw new SchedulerError(`Unsupported event type: ${eventType}`);

  const eventMs = parseEventDate(eventDateIso);
  const todayMs = parseEventDate(toIstIso(today));

  const daysAvailable = daysBetween(todayMs, eventMs);
  if (daysAvailable < 0) {
    throw new SchedulerError(`Event date ${eventDateIso} is in the past`);
  }

  const maxLeadDays = maxLead(eventType);
  const scale = Math.min(1, daysAvailable / maxLeadDays);
  const rushMode = scale < 1;
  const rushMessage = rushMode
    ? `Only ${daysAvailable} days left: rush plan, high-risk tasks moved to the first 48 hours`
    : undefined;

  // Compute raw due dates.
  const raw = new Map<string, number>();
  for (const t of template) {
    const offsetDays = Math.round(t.leadDays * scale);
    let due = eventMs - offsetDays * DAY_MS;
    // Never schedule before "today".
    if (due < todayMs) due = todayMs;
    raw.set(t.id, due);
  }

  // Enforce dependencies: prerequisite can never be due after its dependent.
  // Iterate until stable (templates are small; the graphs are shallow).
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const t of template) {
      const own = raw.get(t.id)!;
      for (const depId of t.dependsOn) {
        const dep = raw.get(depId);
        if (dep === undefined) continue; // defensive; templates are self-consistent
        if (dep > own) {
          raw.set(depId, own);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  // Sort by due date, then criticality, then keep template order as tiebreak.
  const ordered = [...template].sort((a, b) => {
    const d = raw.get(a.id)! - raw.get(b.id)!;
    if (d !== 0) return d;
    const c = CRITICALITY_ORDER[a.criticality] - CRITICALITY_ORDER[b.criticality];
    if (c !== 0) return c;
    return template.indexOf(a) - template.indexOf(b);
  });

  // Critical path: longest dependency chain ending at eventDay.
  const depth = new Map<string, number>();
  const computeDepth = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    const t = template.find((x) => x.id === id);
    if (!t) return 0;
    let best = 0;
    for (const dep of t.dependsOn) {
      const d = computeDepth(dep);
      if (d > best) best = d;
    }
    depth.set(id, best + 1);
    return best + 1;
  };
  for (const t of template) computeDepth(t.id);
  const deepest = template.reduce((a, b) =>
    computeDepth(b.id) > computeDepth(a.id) ? b : a,
  );

  const criticalPath: string[] = [];
  const predecessorOf = new Map<string, string>();
  for (const t of template) {
    let best = "";
    let bestD = -1;
    for (const dep of t.dependsOn) {
      const d = depth.get(dep) ?? 0;
      if (d > bestD) {
        bestD = d;
        best = dep;
      }
    }
    if (best) predecessorOf.set(t.id, best);
  }
  let walk: string | undefined = deepest.id;
  while (walk) {
    criticalPath.unshift(walk);
    walk = predecessorOf.get(walk);
  }

  const criticalPathLabel =
    eventType === "wedding"
      ? "Venue → Caterer → Decor → Reconfirm → Setup → Wedding day"
      : eventType === "birthday"
        ? "Venue → Caterer → Invitations → Headcount → Setup → Party day"
        : "Permissions → Venue → Caterer → Confirm → Setup → Event day";

  const tasks: ScheduledTask[] = ordered.map((t) => {
    const due = raw.get(t.id)!;
    const dayDiff = daysBetween(todayMs, due);
    const status: ScheduledTask["status"] =
      dayDiff < 0 ? "overdue" : dayDiff <= SOON_WINDOW_DAYS ? "due-soon" : "upcoming";
    return {
      id: t.id,
      title: t.title,
      category: t.category,
      criticality: t.criticality,
      dueDate: toIstIso(due),
      displayDate: formatDisplayDate(due),
      status,
      isOnCriticalPath: criticalPath.includes(t.id),
      vendorCategory: t.vendorCategory,
    };
  });

  return {
    tasks,
    totalDays: daysAvailable,
    criticalPath,
    criticalPathLabel,
    rushMode,
    rushMessage,
    eventDate: eventDateIso,
    daysAvailable,
  };
}

// Re-exported for the disruption engine and tests; the implementations live
// in one place (`server/src/lib/dates.ts`).
export { formatDisplayDate, toIstIso, DAY_MS, SOON_WINDOW_DAYS };
