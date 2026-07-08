import { NextResponse } from "next/server";
import { createLead, updateEmailStatus } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
const MAX_PHONE_LENGTH = 40;
const MAX_INTEREST_LENGTH = 60;

// Fixed-window rate limit, in-memory. This app runs as a single long-lived
// process (see README's deployment note), so a per-instance Map is sufficient;
// a multi-instance deployment would need a shared store instead.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestCounts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (requestCounts.size > 10_000) {
    // Prevent unbounded growth from spoofed IPs; dropping counts only ever
    // under-limits briefly.
    requestCounts.clear();
  }
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { name, email, phone, interest, company } = body as Record<
    string,
    unknown
  >;

  // Honeypot: the visible form never fills "company" (it's hidden from real
  // users). Bots that auto-fill every field reveal themselves here. Return a
  // fake success so the bot doesn't learn it was filtered.
  if (typeof company === "string" && company.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  if (typeof email !== "string" || email.trim().length === 0 || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }

  if (email.trim().length > MAX_EMAIL_LENGTH) {
    return NextResponse.json(
      { error: `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  const phoneValue = typeof phone === "string" && phone.trim().length > 0 ? phone.trim() : null;
  const interestValue = typeof interest === "string" && interest.trim().length > 0 ? interest.trim() : null;

  if (phoneValue && phoneValue.length > MAX_PHONE_LENGTH) {
    return NextResponse.json(
      { error: `Phone must be ${MAX_PHONE_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  if (interestValue && interestValue.length > MAX_INTEREST_LENGTH) {
    return NextResponse.json(
      { error: `Interest must be ${MAX_INTEREST_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  const lead = createLead({
    name: name.trim(),
    email: email.trim(),
    phone: phoneValue,
    interest: interestValue,
  });

  const result = await sendConfirmationEmail(lead);

  updateEmailStatus(lead.id, result.simulated ? "simulated" : result.ok ? "sent" : "failed");

  return NextResponse.json({
    success: true,
    lead,
    emailSimulated: result.simulated,
  });
}
