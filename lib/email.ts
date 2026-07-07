export interface EmailLead {
  name: string;
  email: string;
  interest?: string | null;
}

export interface SendEmailResult {
  ok: boolean;
  simulated: boolean;
  error?: string;
}

/**
 * Sends (or simulates) a confirmation email to a new lead.
 *
 * - When RESEND_API_KEY is set, this lazily constructs a Resend client and
 *   sends a real branded HTML email.
 * - When RESEND_API_KEY is NOT set (e.g. local/demo environments), this
 *   never imports or constructs the Resend client — it just logs a clearly
 *   labeled simulation line to the console and resolves successfully, so the
 *   rest of the app (and the demo) works end-to-end without any API key.
 */
export async function sendConfirmationEmail(
  lead: EmailLead
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[email-simulation] Would send confirmation to ${lead.email}`
    );
    return { ok: true, simulated: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const interestLine = lead.interest
      ? `<strong>${escapeHtml(lead.interest)}</strong>`
      : "your project";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
        <div style="font-size: 20px; font-weight: 700; letter-spacing: -0.01em; color: #4f46e5; margin-bottom: 24px;">
          Nurture
        </div>
        <h1 style="font-size: 20px; margin: 0 0 16px;">Thanks for reaching out, ${escapeHtml(
          lead.name
        )}!</h1>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px;">
          We received your message about ${interestLine} and we're excited to
          learn more about what you're building.
        </p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Someone from our team will follow up with you soon. In the
          meantime, feel free to reply to this email with any additional
          details.
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
          — The Nurture Team
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: fromAddress,
      to: lead.email,
      subject: `Thanks for reaching out, ${lead.name}!`,
      html,
    });

    if (result.error) {
      return {
        ok: false,
        simulated: false,
        error: result.error.message ?? String(result.error),
      };
    }

    return { ok: true, simulated: false };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
