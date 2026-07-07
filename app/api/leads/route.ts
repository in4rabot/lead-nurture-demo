import { NextResponse } from "next/server";
import { createLead, updateEmailStatus } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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

  const { name, email, phone, interest } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }

  if (typeof email !== "string" || email.trim().length === 0 || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }

  const phoneValue = typeof phone === "string" && phone.trim().length > 0 ? phone.trim() : null;
  const interestValue = typeof interest === "string" && interest.trim().length > 0 ? interest.trim() : null;

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
