import "server-only";
import { revalidatePath } from "next/cache";
import type { GameType, MatchResult } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { gameLabel, type GameKey, type MatchRecord, type Summary } from "@/lib/records";
import { bookSchema, matchSchema } from "@/lib/validations";
import { getCurrentAccount } from "@/lib/data/account";

function toMatch(row: {
  id: string;
  game: GameType;
  result: MatchResult;
  opponent: string;
  moves: number;
  createdAt: Date;
}): MatchRecord {
  return {
    id: row.id,
    game: row.game,
    result: row.result,
    opponent: row.opponent,
    moves: row.moves,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function recentMatches(userId: string, game?: GameKey): Promise<MatchRecord[]> {
  const rows = await getPrisma().gameMatch.findMany({
    where: { userId, ...(game ? { game } : {}) },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  return rows.map(toMatch);
}

export async function userSummary(userId: string): Promise<Summary> {
  const prisma = getPrisma();
  const where = { userId };
  const [games, wins, losses, draws, recent, grouped] = await Promise.all([
    prisma.gameMatch.count({ where }),
    prisma.gameMatch.count({ where: { ...where, result: "WIN" } }),
    prisma.gameMatch.count({ where: { ...where, result: "LOSS" } }),
    prisma.gameMatch.count({ where: { ...where, result: "DRAW" } }),
    prisma.gameMatch.findMany({ where, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.gameMatch.groupBy({ by: ["game"], where, _count: { _all: true } }),
  ]);

  const favoriteRow = [...grouped].sort((a, b) => b._count._all - a._count._all)[0];
  return {
    games,
    wins,
    losses,
    draws,
    winRate: games === 0 ? null : Math.round((wins / games) * 100),
    favorite: favoriteRow ? gameLabel(favoriteRow.game) : null,
    recent: recent.map(toMatch),
  };
}

export async function recordMatch(input: unknown): Promise<{ saved: boolean; match?: MatchRecord; message?: string }> {
  const account = await getCurrentAccount();
  if (!account) return { saved: false };

  const parsed = matchSchema.safeParse(input);
  if (!parsed.success) return { saved: false, message: "That result could not be stored." };

  try {
    const row = await getPrisma().gameMatch.create({
      data: { userId: account.id, ...parsed.data },
    });
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { saved: true, match: toMatch(row) };
  } catch {
    return { saved: false, message: "The result stayed on this device. The database did not accept it." };
  }
}

export interface ShelfBook {
  id: string;
  title: string;
  author: string;
  pages: number;
  read: boolean;
  createdAt: string;
}

export async function listShelf(userId: string): Promise<ShelfBook[]> {
  const rows = await getPrisma().book.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    pages: book.pages,
    read: book.read,
    createdAt: book.createdAt.toISOString(),
  }));
}

async function ownedBook(userId: string, id: string) {
  return getPrisma().book.findFirst({ where: { id, userId } });
}

export async function saveBook(input: unknown) {
  const account = await getCurrentAccount();
  if (!account) return { ok: false as const, message: "Sign in to keep books in your account." };
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the book fields." };

  const book = await getPrisma().book.create({
    data: { userId: account.id, ...parsed.data },
  });
  revalidatePath("/library");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      pages: book.pages,
      read: book.read,
      createdAt: book.createdAt.toISOString(),
    },
  };
}

export async function editBook(id: string, input: unknown) {
  const account = await getCurrentAccount();
  if (!account) return { ok: false as const, message: "Sign in required." };
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the book fields." };
  const existing = await ownedBook(account.id, id);
  if (!existing) return { ok: false as const, message: "That book is not on your shelf." };

  const book = await getPrisma().book.update({ where: { id: existing.id }, data: parsed.data });
  revalidatePath("/library");
  return {
    ok: true as const,
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      pages: book.pages,
      read: book.read,
      createdAt: book.createdAt.toISOString(),
    },
  };
}

export async function removeBook(id: string) {
  const account = await getCurrentAccount();
  if (!account) return { ok: false as const, message: "Sign in required." };
  const existing = await ownedBook(account.id, id);
  if (!existing) return { ok: false as const, message: "That book is not on your shelf." };
  await getPrisma().book.delete({ where: { id: existing.id } });
  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function toggleShelfRead(id: string) {
  const account = await getCurrentAccount();
  if (!account) return { ok: false as const, message: "Sign in required." };
  const existing = await ownedBook(account.id, id);
  if (!existing) return { ok: false as const, message: "That book is not on your shelf." };
  const book = await getPrisma().book.update({
    where: { id: existing.id },
    data: { read: !existing.read },
  });
  revalidatePath("/library");
  return {
    ok: true as const,
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      pages: book.pages,
      read: book.read,
      createdAt: book.createdAt.toISOString(),
    },
  };
}

export async function libraryCount(userId: string) {
  const prisma = getPrisma();
  const [total, read, pages] = await Promise.all([
    prisma.book.count({ where: { userId } }),
    prisma.book.count({ where: { userId, read: true } }),
    prisma.book.aggregate({ where: { userId }, _sum: { pages: true } }),
  ]);
  return { total, read, unread: total - read, pages: pages._sum.pages ?? 0 };
}

export interface AdminSnapshot {
  users: number;
  matches: number;
  books: number;
  wins: number;
  losses: number;
  draws: number;
  chess: number;
  ticTacToe: number;
  recent: Array<MatchRecord & { player: string }>;
}

export async function adminSnapshot(): Promise<AdminSnapshot> {
  const prisma = getPrisma();
  const [users, matches, books, wins, losses, draws, grouped, recent] = await Promise.all([
    prisma.user.count(),
    prisma.gameMatch.count(),
    prisma.book.count(),
    prisma.gameMatch.count({ where: { result: "WIN" } }),
    prisma.gameMatch.count({ where: { result: "LOSS" } }),
    prisma.gameMatch.count({ where: { result: "DRAW" } }),
    prisma.gameMatch.groupBy({ by: ["game"], _count: { _all: true } }),
    prisma.gameMatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const countFor = (game: GameKey) => grouped.find((row) => row.game === game)?._count._all ?? 0;

  return {
    users,
    matches,
    books,
    wins,
    losses,
    draws,
    chess: countFor("CHESS"),
    ticTacToe: countFor("TIC_TAC_TOE"),
    recent: recent.map((row) => ({
      ...toMatch(row),
      player: row.user.name,
    })),
  };
}

export async function searchUsers(query: string, role: string) {
  const prisma = getPrisma();
  const roleFilter = role === "ADMIN" || role === "USER" ? role : undefined;
  return prisma.user.findMany({
    where: {
      AND: [
        roleFilter ? { role: roleFilter } : {},
        query
          ? {
              OR: [
                { email: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { matches: true, books: true } },
    },
  });
}
