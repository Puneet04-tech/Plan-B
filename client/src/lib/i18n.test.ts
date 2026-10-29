import { describe, expect, it } from "vitest";
import { t } from "./i18n";

describe("i18n", () => {
  it("exposes the same keys in English and Hindi", () => {
    expect(Object.keys(t("hi")).sort()).toEqual(Object.keys(t("en")).sort());
  });

  it("has no empty strings in either language", () => {
    for (const lang of ["en", "hi"] as const) {
      for (const [key, value] of Object.entries(t(lang))) {
        expect(value.trim(), `${lang}.${key} is empty`).not.toBe("");
      }
    }
  });

  it("returns stable dictionaries for repeated calls", () => {
    expect(t("en")).toBe(t("en"));
  });
});
