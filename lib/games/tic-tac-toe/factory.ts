/**
 * Tic Tac Toe match as a factory function.
 *
 * Academic objective: factory functions, encapsulation, and state management.
 * `createTicTacToeGame` closes over the board. Callers cannot mutate squares
 * directly; they receive snapshots and send moves through `play`.
 * The returned object is the only public surface.
 */
import { findWinner, opponent, type Cell, type Mark } from "./rules";

export type GameStatus = "playing" | "win" | "draw";

export interface GameSnapshot {
  board: Cell[];
  current: Mark;
  status: GameStatus;
  winner: Mark | null;
  line: number[] | null;
  moves: number;
}

export interface TicTacToeGame {
  snapshot: () => GameSnapshot;
  play: (index: number) => GameSnapshot;
  reset: () => GameSnapshot;
}

function freshBoard(): Cell[] {
  return Array.from({ length: 9 }, () => null);
}

export function createTicTacToeGame(starting: Mark = "X"): TicTacToeGame {
  let board = freshBoard();
  let current: Mark = starting;
  let status: GameStatus = "playing";
  let winner: Mark | null = null;
  let line: number[] | null = null;
  let moves = 0;

  function snapshot(): GameSnapshot {
    return {
      board: [...board],
      current,
      status,
      winner,
      line: line ? [...line] : null,
      moves,
    };
  }

  function play(index: number): GameSnapshot {
    const legalIndex = Number.isInteger(index) && index >= 0 && index < 9;
    if (status !== "playing" || !legalIndex || board[index] !== null) {
      return snapshot();
    }

    board[index] = current;
    moves += 1;

    const win = findWinner(board);
    if (win) {
      status = "win";
      winner = win.winner;
      line = win.line;
    } else if (moves === 9) {
      status = "draw";
    } else {
      current = opponent(current);
    }

    return snapshot();
  }

  function reset(): GameSnapshot {
    board = freshBoard();
    current = starting;
    status = "playing";
    winner = null;
    line = null;
    moves = 0;
    return snapshot();
  }

  return { snapshot, play, reset };
}
