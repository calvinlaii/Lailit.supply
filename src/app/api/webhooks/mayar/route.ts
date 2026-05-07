import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Wave 0 stub: implements token validation, cross-verify, and idempotency layers only.
// Full event handler dispatch is implemented in Plan 03.

interface MayarWebhookPayload {
  "event.received": string;
  data: {
    id: string;
    status: boolean;
    customerName: string;
    customerEmail: string;
    productName: string;
    productId: string;
    merchantId: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
  };
}

async function crossVerifyWithMayar(
  transactionId: string
): Promise<{ valid: boolean; httpStatus: number }> {
  let res: Response;
  try {
    res = await fetch(
      `https://api.mayar.id/hl/v1/payment/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
        },
        cache: "no-store",
      }
    );
  } catch {
    return { valid: false, httpStatus: 503 };
  }

  if (res.status === 503 || res.status === 502 || res.status === 504) {
    return { valid: false, httpStatus: 503 };
  }
  if (!res.ok) {
    return { valid: false, httpStatus: 400 };
  }

  const json = await res.json();
  if (json.statusCode !== 200 || !json.data) {
    return { valid: false, httpStatus: 400 };
  }

  return { valid: true, httpStatus: 200 };
}

export async function POST(request: NextRequest) {
  // Layer 1: Token check (PAY-04, T-4-01)
  const token = request.nextUrl.searchParams.get("token");
  if (!token || token !== process.env.MAYAR_WEBHOOK_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse body
  let body: MayarWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const transactionId = body.data?.id;
  if (!transactionId) {
    return new Response("Missing data.id", { status: 400 });
  }

  // Layer 2: Cross-verify with Mayar API (PAY-09)
  const { valid, httpStatus } = await crossVerifyWithMayar(transactionId);
  if (!valid) {
    return new Response("Cross-verify failed", { status: httpStatus });
  }

  // Layer 3: Idempotency — INSERT first (PAY-08)
  const supabase = createAdminClient();
  const { error: insertError } = await supabase
    .from("webhook_events")
    .insert({
      mayar_event_id: transactionId,
      event_type: body["event.received"],
      payload: body,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return new Response("Already processed", { status: 200 });
    }
    console.error("webhook_events insert failed:", insertError);
    return new Response("DB error", { status: 500 });
  }

  // TODO (Plan 03): Dispatch by event_type
  // membership.newMemberRegistered, payment.received, membership.memberUnsubscribed,
  // membership.memberExpired, membership.changeTierMemberRegistered

  return new Response("OK", { status: 200 });
}
