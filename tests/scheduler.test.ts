import { describe, it, expect } from "vitest";
import {
  buildTimeline,
  parseEventDate,
  SchedulerError,
  TASK_TEMPLATES,
} from "../server/src/engine/scheduler";
import type { EventType } from "../shared/types";

const DAY = 24 * 60 * 60 * 1000;
// 2026-10-25 00:00 UTC as "today"
const TODAY = Date.UTC(2026, 9, 25);

const types: EventType[] = ["wedding", "birthday", "community"];

describe("scheduler", () => {
  it.each(types)(
    "%s: all task dates between today and event date (post-event tasks excepted)",
    (eventType) => {
      const eventDate = "2027-01-15";
      const tl = buildTimeline(eventType, eventDate, TODAY);
      for (const task of tl.tasks) {
        expect(task.dueDate >= "2026-10-25").toBe(true);
        if (!task.id.toLowerCase().startsWith("post")) {
          expect(task.dueDate <= eventDate).toBe(true);
        }
      }
      // event day task must land on the event date
      const eventDay = tl.tasks.find((t) => t.id === "eventDay")!;
      expect(eventDay.dueDate).toBe(eventDate);
    },
  );

  it.each(types)(
    "%s: prerequisites never due after dependents",
    (eventType) => {
      const tl = buildTimeline(eventType, "2027-01-15", TODAY);
      const byId = new Map(tl.tasks.map((t) => [t.id, t]));
      for (const template of TASK_TEMPLATES[eventType]) {
        for (const dep of template.dependsOn) {
          const depTask = byId.get(dep)!;
          const own = byId.get(template.id)!;
          expect(new Date(depTask.dueDate).getTime()).toBeLessThanOrEqual(
            new Date(own.dueDate).getTime(),
          );
        }
      }
    },
  );

  it("rush mode triggers at 12 days and not at 90", () => {
    const event12 = "2026-11-06"; // 12 days after TODAY
    const tl12 = buildTimeline("community", event12, TODAY);
    expect(tl12.rushMode).toBe(true);
    expect(tl12.rushMessage).toContain("12 days");

    const event90 = "2027-01-23"; // 90 days after TODAY
    const tl90 = buildTimeline("community", event90, TODAY);
    expect(tl90.rushMode).toBe(false);
  });

  it("rejects past event dates with a typed error", () => {
    expect(() => buildTimeline("wedding", "2026-01-01", TODAY)).toThrow(
      SchedulerError,
    );
  });

  it("results are sorted by due date", () => {
    const tl = buildTimeline("wedding", "2027-02-10", TODAY);
    for (let i = 1; i < tl.tasks.length; i++) {
      expect(new Date(tl.tasks[i].dueDate).getTime()).toBeGreaterThanOrEqual(
        new Date(tl.tasks[i - 1].dueDate).getTime(),
      );
    }
  });

  it("handles month/year boundaries and leap years deterministically", () => {
    // Feb 29 2028 is a leap day
    const tlLeap = buildTimeline("birthday", "2028-02-29", TODAY);
    expect(tlLeap.tasks[tlLeap.tasks.length - 1].dueDate).toBe("2028-02-29");
    const tlLeap2 = buildTimeline("birthday", "2028-02-29", TODAY);
    expect(JSON.stringify(tlLeap)).toBe(JSON.stringify(tlLeap2)); // identical inputs -> identical output

    // year boundary: Dec -> Jan
    const tlYear = buildTimeline("birthday", "2027-01-05", TODAY);
    expect(tlYear.tasks.every((t) => t.dueDate <= "2027-01-05")).toBe(true);
  });

  it("never emits raw ids as titles", () => {
    const tl = buildTimeline("community", "2026-12-01", TODAY);
    for (const task of tl.tasks) {
      expect(task.title).not.toBe(task.id);
      expect(task.title.length).toBeGreaterThan(3);
      expect(task.displayDate).toMatch(/^\d{1,2} \w{3} \d{4}$/);
    }
  });

  it("parses IST dates correctly", () => {
    const ms = parseEventDate("2026-11-06");
    expect(new Date(ms + 330 * 60 * 1000).toISOString()).toBe(
      "2026-11-06T00:00:00.000Z",
    );
  });
});
