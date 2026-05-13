import { cookies } from "next/headers";
import { getSessionInfo, session, verifySessionValue, type SessionRole } from "./session";

export async function requireAdmin() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(session.name)?.value);
}

export async function currentAdminRole(): Promise<SessionRole | null> {
  const cookieStore = await cookies();
  return (await getSessionInfo(cookieStore.get(session.name)?.value))?.role ?? null;
}
