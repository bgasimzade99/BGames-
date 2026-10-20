"use client";

import { useState } from "react";
import { StatGrid } from "@/components/stats/stat-grid";
import { readLocalMatches, summarize } from "@/lib/records";

export function DeviceProgress({ note }: { note?: string }) {
  const [summary] = useState(() => summarize(typeof window === "undefined" ? [] : readLocalMatches()));

  return (
    <section className="section-gap" aria-label="Progress on this device">
      <p className="kicker">Record</p>
      <h2>Progress on this device</h2>
      {note ? <p className="note">{note}</p> : null}
      {summary.games > 0 ? (
        <StatGrid summary={summary} />
      ) : (
        <p className="quiet">No matches on record. Win, lose, or draw — the first finished game starts the count.</p>
      )}
    </section>
  );
}
