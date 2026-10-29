import { describe, expect, it } from "vitest";
import { unwrap } from "./api";

describe("unwrap", () => {
  it("returns the data of a successful envelope", () => {
    expect(unwrap({ success: true, data: { total: 42 } })).toEqual({ total: 42 });
  });

  it("throws the server error message for a failed envelope", () => {
    expect(() => unwrap({ success: false, error: "Validation failed" })).toThrow(
      "Validation failed",
    );
  });

  it("falls back to a generic message when the error is empty", () => {
    expect(() => unwrap({ success: false, error: "" })).toThrow("Request failed");
  });
});
