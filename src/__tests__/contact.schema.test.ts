import { describe, it, expect } from "vitest";
import { contactSchema } from "@/features/contact/validation/contact.schema";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  message: "This is a test message that is definitely long enough.",
};

describe("contactSchema", () => {
  it("accepts a valid submission", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    expect(contactSchema.safeParse({ ...valid, name: "a".repeat(101) }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects empty message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects message shorter than 10 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Too short" }).success).toBe(false);
  });

  it("rejects message longer than 1000 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "a".repeat(1001) }).success).toBe(false);
  });
});
