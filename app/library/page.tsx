import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryDesk } from "@/components/islands";
import { PageIntro } from "@/components/shell/page-intro";
import { getCurrentAccount } from "@/lib/data/account";
import { listShelf } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <>
      <PageIntro
        index="Library"
        title="A shelf, not a spreadsheet."
        lede="Add a book, correct it, mark it read, and filter the shelf. Guests keep the collection in this browser. Accounts store it in PostgreSQL."
      />
      <Suspense fallback={<p className="quiet">Opening the shelf…</p>}>
        <LibraryLoader />
      </Suspense>
    </>
  );
}

async function LibraryLoader() {
  let books = null;
  let offline = false;
  try {
    const account = await getCurrentAccount();
    books = account ? await listShelf(account.id) : null;
  } catch {
    offline = true;
  }

  return (
    <>
      {offline ? <p className="note">The database is offline, so this shelf stays on this device.</p> : null}
      <LibraryDesk initialBooks={books} />
    </>
  );
}
