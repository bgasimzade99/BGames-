export type GameKey = "TIC_TAC_TOE" | "CHESS";
export type ResultKey = "WIN" | "LOSS" | "DRAW";

export interface MatchRecord {
  id: string;
  game: GameKey;
  result: ResultKey;
  opponent: string;
  moves: number;
  createdAt: string;
}

export interface Summary {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
  favorite: string | null;
  recent: MatchRecord[];
}

export function gameLabel(game: GameKey): string {
  return game === "CHESS" ? "Chess" : "Tic Tac Toe";
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function summarize(matches: MatchRecord[]): Summary {
  const games = matches.length;
  const wins = matches.filter((match) => match.result === "WIN").length;
  const losses = matches.filter((match) => match.result === "LOSS").length;
  const draws = matches.filter((match) => match.result === "DRAW").length;
  const counts = new Map<GameKey, number>();
  for (const match of matches) counts.set(match.game, (counts.get(match.game) ?? 0) + 1);

  let favorite: string | null = null;
  let best = 0;
  for (const [game, count] of counts) {
    if (count > best) {
      best = count;
      favorite = gameLabel(game);
    }
  }

  const recent = [...matches].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return {
    games,
    wins,
    losses,
    draws,
    winRate: games === 0 ? null : Math.round((wins / games) * 100),
    favorite,
    recent,
  };
}

const STORAGE_KEY = "bgames.matches";

export function readLocalMatches(): MatchRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MatchRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalMatch(match: MatchRecord): MatchRecord[] {
  const next = [match, ...readLocalMatches()].slice(0, 40);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
