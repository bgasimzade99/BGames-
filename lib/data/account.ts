import "server-only";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/db";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export async function getCurrentAccount(): Promise<Account | null> {
  await connection();
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
