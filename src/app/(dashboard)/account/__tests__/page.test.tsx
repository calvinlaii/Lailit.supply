import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// AccountPage will be created in Plan 04
// These tests will be RED until Plan 04 creates src/app/(dashboard)/account/page.tsx

// Mock DAL functions (server-only, must be mocked for component testing)
vi.mock("@/lib/dal", () => ({
  getUser: vi.fn().mockResolvedValue({ id: "test-user-id", email: "test@example.com" }),
  getMembership: vi.fn().mockResolvedValue(null),
}));

describe("AccountPage — membership rendering (ACCT-01)", () => {
  it.todo("renders h1 with text 'Akun'");
  it.todo("renders 'Belum berlangganan' when getMembership returns null");
  it.todo("renders plan name 'Bulanan' when membership_tier is 'monthly'");
  it.todo("renders 'Aktif' status badge when membership_status is 'active'");
  it.todo("renders 'Dibatalkan' status badge when membership_status is 'canceled'");
  it.todo("renders 'Kedaluwarsa' status badge when membership_status is 'expired'");
  it.todo("renders 'Akses Seumur Hidup' when membership_tier is 'lifetime'");
  it.todo("renders formatted expiry date for monthly members");
  it.todo("renders 'Kelola Langganan' button linking to MAYAR_CUSTOMER_PORTAL_URL (ACCT-02)");
});
