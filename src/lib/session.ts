const sessionCookieName = "small_store_admin";
const encoder = new TextEncoder();

function getSecret() {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const bytes = Array.from(new Uint8Array(signature));
  const binary = bytes.map((byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export type SessionRole = "owner" | "manager" | "staff" | "viewer";

export async function createSessionValue(role: SessionRole = "owner") {
  const payload = `${role}.${Date.now()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionValue(value?: string) {
  return Boolean(await getSessionInfo(value));
}

export async function getSessionInfo(value?: string): Promise<{ role: SessionRole; issuedAt: number } | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = await sign(payload);
  if (expected !== parts[2]) return null;
  const role = ["owner", "manager", "staff", "viewer"].includes(parts[0]) ? (parts[0] as SessionRole) : "owner";
  return { role, issuedAt: Number(parts[1]) };
}

export const session = {
  name: sessionCookieName,
  maxAge: 60 * 60 * 8,
};
