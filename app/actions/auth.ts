"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { getPrisma } from "@/lib/db";
import { getCurrentAccount } from "@/lib/data/account";
import { profileSchema, signInSchema, signUpSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export interface FormFeedback {
  message?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export async function registerAccount(input: unknown): Promise<FormFeedback> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const email = parsed.data.email.toLowerCase();
  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { message: "An account with that email already exists." };
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: { name: parsed.data.name, email, passwordHash },
    });
  } catch {
    return { message: "The database is not available. Start PostgreSQL, then try again." };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "The account was created, but sign-in failed. Use the sign-in page." };
    }
    throw error;
  }
  return {};
}

export async function authenticate(input: unknown, callbackUrl: string): Promise<FormFeedback> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const destination = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: destination,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Those credentials do not match an account." };
    }
    throw error;
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfile(input: unknown): Promise<FormFeedback> {
  const account = await getCurrentAccount();
  if (!account) return { message: "Sign in required." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await getPrisma().user.update({ where: { id: account.id }, data: { name: parsed.data.name } });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { message: "Name saved." };
}

export async function setUserRole(
  _previous: { message: string } | null,
  formData: FormData,
): Promise<{ message: string }> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "ADMIN") return { message: "Administrator access required." };

  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "USER";
  if (!userId) return { message: "Choose an account first." };
  if (userId === account.id) return { message: "You cannot change your own role here." };

  const prisma = getPrisma();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { message: "That account no longer exists." };

  if (target.role === "ADMIN" && role === "USER") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { message: "The last administrator cannot be demoted." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
  const nextLabel = role === "ADMIN" ? "an administrator" : "a player";
  return { message: `${target.name} is now ${nextLabel}.` };
}
