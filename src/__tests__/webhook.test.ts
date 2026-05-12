import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock D1 / Drizzle DB (webhook route has no user session — uses raw DB binding)
vi.mock("@/lib/db", () => ({
  getDB: vi.fn(),
  webhookEvents: { _: "webhook_events_table_stub" },
}));

// Mock Resend (used in handleNewMember for welcome email)
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "mock-resend-id" }, error: null }),
    },
  })),
}));

// Mock global fetch for Mayar cross-verify calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper: construct a NextRequest with token in searchParams
function makeRequest(token: string, body: object) {
  return new NextRequest(
    `http://localhost/api/webhooks/mayar?token=${token}`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Minimal valid Mayar webhook payload
const validPayload = {
  "event.received": "membership.newMemberRegistered",
  data: {
    id: "test-mayar-id-001",
    status: true,
    customerName: "Budi Santoso",
    customerEmail: "budi@example.com",
    productName: "Bulanan",
    productId: "prod-monthly-001",
    merchantId: "merch-001",
    amount: 449000,
    createdAt: "2026-05-07T00:00:00Z",
    updatedAt: "2026-05-07T00:00:00Z",
  },
};

// Lazy import POST after mocks are set up
async function importPost() {
  const mod = await import("@/app/api/webhooks/mayar/route");
  return mod.POST;
}

describe("POST /api/webhooks/mayar — token validation (PAY-04, T-4-01)", () => {
  it("returns 401 when token query param is missing", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/webhooks/mayar", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token query param is wrong", async () => {
    const POST = await importPost();
    process.env.MAYAR_WEBHOOK_TOKEN = "correct-secret";
    const req = makeRequest("wrong-secret", validPayload);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("does not proceed to DB on invalid token (no getDB calls)", async () => {
    const { getDB } = await import("@/lib/db");
    const POST = await importPost();
    process.env.MAYAR_WEBHOOK_TOKEN = "correct-secret";
    const req = makeRequest("wrong-secret", validPayload);
    await POST(req);
    expect(getDB).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/mayar — cross-verify (PAY-09)", () => {
  beforeEach(() => {
    process.env.MAYAR_WEBHOOK_TOKEN = "correct-secret";
    process.env.MAYAR_API_KEY = "test-api-key";
  });

  it("returns 503 when Mayar cross-verify returns 503", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    const POST = await importPost();
    const req = makeRequest("correct-secret", validPayload);
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("returns 400 when Mayar cross-verify returns 404 (transaction not found)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const POST = await importPost();
    const req = makeRequest("correct-secret", validPayload);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/webhooks/mayar — idempotency (PAY-08)", () => {
  beforeEach(() => {
    process.env.MAYAR_WEBHOOK_TOKEN = "correct-secret";
    process.env.MAYAR_API_KEY = "test-api-key";
    // Cross-verify succeeds by default
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ statusCode: 200, messages: "success", data: { id: "test-mayar-id-001" } }),
    } as Response);
  });

  it("returns 200 with no side effects when mayar_event_id already exists (UNIQUE violation)", async () => {
    const { getDB } = await import("@/lib/db");
    const insertValues = vi.fn().mockRejectedValue(
      new Error("D1_ERROR: UNIQUE constraint failed: webhook_events.mayar_event_id")
    );
    const insert = vi.fn().mockReturnValue({ values: insertValues });
    (getDB as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

    const POST = await importPost();
    const req = makeRequest("correct-secret", validPayload);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Already processed");
  });
});

describe("POST /api/webhooks/mayar — membership.newMemberRegistered (PAY-03, AUTH-05)", () => {
  it.todo("upserts users row with membership_tier inferred from productName (Clerk userId)");
  it.todo("calls resend.emails.send with WelcomeEmail after user upsert");
  it.todo("sets processed_at on webhook_events row after handling");
});

describe("POST /api/webhooks/mayar — payment.received (PAY-04)", () => {
  it.todo("updates membership_expires_at on users for matching email");
});

describe("POST /api/webhooks/mayar — membership.memberUnsubscribed (PAY-05)", () => {
  it.todo("sets membership_status to 'canceled' but does NOT clear membership_expires_at");
});

describe("POST /api/webhooks/mayar — membership.memberExpired (PAY-06)", () => {
  it.todo("sets membership_status to 'expired'");
});

describe("POST /api/webhooks/mayar — membership.changeTierMemberRegistered (PAY-07)", () => {
  it.todo("updates membership_tier on users");
});

describe("POST /api/webhooks/mayar — lifetime purchaser (PAY-10)", () => {
  it.todo("sets lifetime_purchased=true and membership_expires_at=null for lifetime productName");
});

describe("POST /api/webhooks/mayar — unknown event type (D-08)", () => {
  it.todo("returns 200 for unknown event type without side effects");
});
