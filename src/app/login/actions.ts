"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionValue, session } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { defaultStoreId, seedDefaultData } from "@/lib/seed";

export async function login(formData: FormData) {
  await seedDefaultData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  let role: "owner" | "manager" | "staff" | "viewer" = "owner";

  if (email) {
    const user = await prisma.adminUser.findFirst({ where: { storeId: defaultStoreId, email, active: true } });
    if (!user || user.password !== password) redirect("/login?error=1");
    role = ["manager", "staff", "viewer"].includes(user.role) ? (user.role as "manager" | "staff" | "viewer") : "staff";
  } else if (password !== expected) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(session.name, await createSessionValue(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAge,
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(session.name);
  redirect("/login");
}
