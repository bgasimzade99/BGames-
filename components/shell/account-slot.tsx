import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import { getCurrentAccount } from "@/lib/data/account";

export async function AccountSlot() {
  await connection();
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="account-slot">
        <Link href="/sign-in">Sign in</Link>
      </div>
    );
  }

  let name = session.user.name ?? "Player";
  let role = session.user.role;
  try {
    const account = await getCurrentAccount();
    if (account) {
      name = account.name;
      role = account.role;
    }
  } catch {
    name = session.user.name ?? "Player";
  }

  return (
    <div className="account-slot">
      <Link href="/dashboard">{name}</Link>
      {role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
      <form action={signOutAction}>
        <button className="btn btn-line" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
