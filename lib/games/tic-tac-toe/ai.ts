/**
 * Computer opponent as a module pattern (IIFE).
 *
 * Academic objective: the module pattern. The minimax implementation and the
 * easy-move picker stay private. Only `chooseMove` is exported.
 * Hard difficulty is minimax with perfect information: it never misses a
 * forced win or a forced block. Easy difficulty picks a random empty square.
 */
import { emptySquares, findWinner, opponent, type Cell, type Mark } from "./rules";

export type Difficulty = "easy" | "hard";

type RandomFn = () => number;

function terminalScore(board: readonly Cell[], ai: Mark, depth: number): number | null {
  const win = findWinner(board);
  if (win?.winner === ai) return 10 - depth;
  if (win) return depth - 10;
  if (emptySquares(board).length === 0) return 0;
  return null;
}

function minimax(
  board: Cell[],
  ai: Mark,
  turn: Mark,
  depth: number,
): { score: number; index: number } {
  const done = terminalScore(board, ai, depth);
  if (done !== null) return { score: done, index: -1 };

  const maximizing = turn === ai;
  let best = { score: maximizing ? -Infinity : Infinity, index: -1 };

  for (const index of emptySquares(board)) {
    board[index] = turn;
    const next = minimax(board, ai, opponent(turn), depth + 1);
    board[index] = null;

    if (maximizing && next.score > best.score) best = { score: next.score, index };
    if (!maximizing && next.score < best.score) best = { score: next.score, index };
  }

  return best;
}

export const ticTacToeAi = (() => {
  function easyMove(board: readonly Cell[], random: RandomFn): number {
    const open = emptySquares(board);
    if (open.length === 0) return -1;
    const slot = Math.floor(random() * open.length);
    return open[Math.min(slot, open.length - 1)];
  }

  function hardMove(board: readonly Cell[], mark: Mark): number {
    return minimax([...board], mark, mark, 0).index;
  }

  function chooseMove(
    board: readonly Cell[],
    mark: Mark,
    difficulty: Difficulty,
    random: RandomFn = Math.random,
  ): number {
    if (difficulty === "easy") return easyMove(board, random);
    return hardMove(board, mark);
  }

  return { chooseMove };
})();
