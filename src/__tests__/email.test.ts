import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// WelcomeEmail will be created in Plan 02
// These tests will be RED until Plan 02 creates src/emails/WelcomeEmail.tsx

describe("WelcomeEmail (EMAIL-01)", () => {
  it.todo("renders user name in greeting when name is provided");
  it.todo("renders generic greeting when name is empty string");
  it.todo("renders plan name 'Bulanan' in body copy");
  it.todo("renders plan name 'Seumur Hidup' in body copy");
  it.todo("renders 'Masuk ke Dashboard' magic link button");
  it.todo("magic link button href matches the magicLink prop value");
  it.todo("renders subject-matching preview text 'Selamat datang di lailit.supply'");
  it.todo("renders disclaimer text 'Link ini berlaku untuk sekali login'");
});
