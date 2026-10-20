import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NameForm } from "@/components/profile/name-form";
import { PageIntro } from "@/components/shell/page-intro";
import { getCurrentAccount } from "@/lib/data/account";
import { formatWhen } from "@/lib/records";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="quiet">Opening your profile…</p>}>
      <ProfileBody />
    </Suspense>
  );
}

async function ProfileBody() {
  let account;
  try {
    account = await getCurrentAccount();
  } catch {
    return (
      <PageIntro
        index="Profile"
        title="Profile unavailable."
        lede="The account database did not respond. Guest play still works."
      />
    );
  }
  if (!account) redirect("/sign-in");

  return (
    <div className="split">
      <div>
        <PageIntro
          index="Profile"
          title={account.name}
          lede="This is your player account. The project notes live on the About page."
        />
        <dl className="stat-grid">
          <div>
            <dt>Email</dt>
            <dd style={{ fontSize: "1rem" }}>{account.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd style={{ fontSize: "1rem" }}>{account.role === "ADMIN" ? "Administrator" : "Player"}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd style={{ fontSize: "1rem" }}>{formatWhen(account.createdAt)}</dd>
          </div>
        </dl>
      </div>
      <aside className="panel">
        <NameForm name={account.name} />
      </aside>
    </div>
  );
}
