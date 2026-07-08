import { NextRequest, NextResponse } from "next/server";

// Local development fallback credentials, used ONLY when ADMIN_USER /
// ADMIN_PASSWORD are unset AND the app is not running in production. In
// production, missing env vars fail closed (every /admin request gets 401)
// rather than falling back to credentials that live in a public repo.
const FALLBACK_ADMIN_USER = "admin";
const FALLBACK_ADMIN_PASSWORD = "Nurture#2026";

// Constant-time string comparison. Iterates the full max length regardless
// of where (or whether) a mismatch occurs, so response timing doesn't leak
// how many leading characters of a guess were correct. Avoids Node's
// crypto.timingSafeEqual since middleware runs on the Edge runtime (this
// file already relies on the Web `atob` API, not Node's Buffer).
function timingSafeEqual(a: string, b: string): boolean {
  const maxLength = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLength; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

export function middleware(request: NextRequest): NextResponse {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD)) {
    return unauthorized();
  }

  const expectedUser = process.env.ADMIN_USER || FALLBACK_ADMIN_USER;
  const expectedPassword =
    process.env.ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD;

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  const base64Credentials = authHeader.slice("Basic ".length).trim();

  let decoded: string;
  try {
    decoded = atob(base64Credentials);
  } catch {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return unauthorized();
  }

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  const userMatches = timingSafeEqual(user, expectedUser);
  const passwordMatches = timingSafeEqual(password, expectedPassword);

  if (!userMatches || !passwordMatches) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
