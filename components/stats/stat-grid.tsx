import type { Summary } from "@/lib/records";

export function StatGrid({ summary }: { summary: Summary }) {
  const cells = [
    ["Played", summary.games > 0 ? String(summary.games) : "—"],
    ["Wins", summary.games > 0 ? String(summary.wins) : "—"],
    ["Losses", summary.games > 0 ? String(summary.losses) : "—"],
    ["Draws", summary.games > 0 ? String(summary.draws) : "—"],
    ["Win rate", summary.winRate === null ? "—" : `${summary.winRate}%`],
    ["Favorite", summary.favorite ?? "—"],
  ];

  return (
    <dl className="stat-grid">
      {cells.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
