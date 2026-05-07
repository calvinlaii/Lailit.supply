import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// PricingCard will be updated in Plan 04 to wire env var URLs
// These tests will be RED until Plan 04 updates src/components/marketing/pricing-card.tsx

describe("PricingCard — CTA href behavior (PAY-01, PAY-02)", () => {
  it.todo("monthly CTA href reads from NEXT_PUBLIC_MAYAR_MONTHLY_URL env var");
  it.todo("lifetime CTA href reads from NEXT_PUBLIC_MAYAR_LIFETIME_URL env var");
  it.todo("monthly CTA is not disabled when env var is set");
  it.todo("lifetime CTA is not disabled when env var is set");
  it.todo("monthly CTA opens in same tab (no target=_blank)");
  it.todo("lifetime CTA opens in same tab (no target=_blank)");
});
