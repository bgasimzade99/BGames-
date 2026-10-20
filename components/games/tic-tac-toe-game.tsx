"use client";

import { useEffect, useRef, useState } from "react";
import { saveMatch } from "@/app/actions/play";
import { ticTacToeAi, type Difficulty } from "@/lib/games/tic-tac-toe/ai";
import { createTicTacToeGame, type GameSnapshot, type TicTacToeGame } from "@/lib/games/tic-tac-toe/factory";
import type { Mark } from "@/lib/games/tic-tac-toe/rules";
import { readLocalMatches, saveLocalMatch, type MatchRecord } from "@/lib/records";

type Mode = "human" | "computer";

function MarkGlyph({ mark }: { mark: Mark }) {
  if (mark === "X") {
    return (
      <svg viewBox="0 0 40 40" className="mark-x" aria-hidden="true">
        <path d="M10 10 L30 30 M30 10 L10 30" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className="mark-o" aria-hidden="true">
      <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="3.5" />
    </svg>
  );
}

function playTone(kind: "move" | "win" | "draw") {
  const context = new AudioContext();
  const notes = kind === "win" ? [523, 659, 784] : kind === "draw" ? [196, 164] : [480];
  notes.forEach((frequency, index) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.08;
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + 0.14);
  });
  window.setTimeout(() => void context.close(), 500);
}

export function TicTacToeGame({
  signedIn = false,
  historySeed = [],
}: {
  signedIn?: boolean;
  historySeed?: MatchRecord[];
}) {
  const [engine, setEngine] = useState<TicTacToeGame>(() => createTicTacToeGame("X"));
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => engine.snapshot());
  const [mode, setMode] = useState<Mode>("computer");
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [humanMark, setHumanMark] = useState<Mark>("X");
  const [muted, setMuted] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("bgames.muted") === "1");
  const [matches, setMatches] = useState<MatchRecord[]>(() =>
    signedIn || typeof window === "undefined"
      ? historySeed
      : readLocalMatches().filter((match) => match.game === "TIC_TAC_TOE").slice(0, 8),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const recorded = useRef<string | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const computerMark: Mark = humanMark === "X" ? "O" : "X";

  function storeResult(next: GameSnapshot) {
    if (next.status === "playing") return;
    const key = next.board.join("");
    if (recorded.current === key) return;
    recorded.current = key;
    const result: "WIN" | "LOSS" | "DRAW" =
      next.status === "draw" ? "DRAW" : next.winner === humanMark ? "WIN" : "LOSS";
    const opponent =
      mode === "human" ? "Local board" : difficulty === "hard" ? "Computer · Hard (minimax)" : "Computer · Easy";
    const payload = { game: "TIC_TAC_TOE" as const, result, opponent, moves: Math.max(1, next.moves) };
    if (signedIn) {
      void saveMatch(payload).then((response) => {
        if (response.match) setMatches((current) => [response.match!, ...current].slice(0, 8));
        else if (response.message) setNotice(response.message);
      });
      return;
    }
    const stored = saveLocalMatch({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() });
    setMatches(stored.filter((match) => match.game === "TIC_TAC_TOE").slice(0, 8));
  }

  function commit(index: number) {
    const next = engine.play(index);
    setSnapshot(next);
    if (!muted && next.moves !== snapshot.moves) {
      playTone(next.status === "win" ? "win" : next.status === "draw" ? "draw" : "move");
    }
    storeResult(next);
    return next;
  }

  function restart() {
    const nextEngine = createTicTacToeGame("X");
    setEngine(nextEngine);
    setSnapshot(nextEngine.snapshot());
    recorded.current = null;
  }

  useEffect(() => {
    if (mode !== "computer" || snapshot.status !== "playing" || snapshot.current !== computerMark) return;
    const timer = window.setTimeout(() => {
      const index = ticTacToeAi.chooseMove(snapshot.board, computerMark, difficulty);
      if (index >= 0) commit(index);
    }, 180);
    return () => window.clearTimeout(timer);
    // commit closes over snapshot; the timer should fire once per position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computerMark, difficulty, mode, snapshot]);

  const status =
    snapshot.status === "win"
      ? `${snapshot.winner} wins.`
      : snapshot.status === "draw"
        ? "Draw."
        : `${snapshot.current} to move.`;

  return (
    <div className="split">
      <div>
        <p className={snapshot.status === "playing" ? "status-play" : "status-over"} aria-live="polite">
          {status}
        </p>
        <div className="ttt-board" role="grid" aria-label="Tic tac toe board">
          {snapshot.board.map((cell, index) => {
            const winning = snapshot.line?.includes(index);
            const row = Math.floor(index / 3);
            const col = index % 3;
            return (
              <button
                key={index}
                type="button"
                role="gridcell"
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                className={winning ? "ttt-cell is-win" : "ttt-cell"}
                aria-label={cell ? `Row ${row + 1}, column ${col + 1}, ${cell}` : `Row ${row + 1}, column ${col + 1}, empty`}
                disabled={cell !== null || snapshot.status !== "playing" || (mode === "computer" && snapshot.current !== humanMark)}
                onClick={() => commit(index)}
                onKeyDown={(event) => {
                  const move: Record<string, number> = {
                    ArrowLeft: index % 3 === 0 ? index : index - 1,
                    ArrowRight: index % 3 === 2 ? index : index + 1,
                    ArrowUp: index < 3 ? index : index - 3,
                    ArrowDown: index > 5 ? index : index + 3,
                  };
                  const next = move[event.key];
                  if (next === undefined) return;
                  event.preventDefault();
                  buttons.current[next]?.focus();
                }}
              >
                {cell ? <MarkGlyph mark={cell} /> : null}
              </button>
            );
          })}
        </div>
      </div>
      <aside className="panel">
        <div className="field">
          <label htmlFor="ttt-mode">Opponent</label>
          <select
            id="ttt-mode"
            value={mode}
            onChange={(event) => {
              const next = event.target.value as Mode;
              setMode(next);
              const nextEngine = createTicTacToeGame("X");
              setEngine(nextEngine);
              setSnapshot(nextEngine.snapshot());
              recorded.current = null;
            }}
          >
            <option value="computer">Computer</option>
            <option value="human">Another person</option>
          </select>
        </div>
        {mode === "computer" ? (
          <div className="field">
            <label htmlFor="ttt-level">Difficulty</label>
            <select
              id="ttt-level"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              <option value="easy">Easy · random empty square</option>
              <option value="hard">Hard · minimax</option>
            </select>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="ttt-side">Your mark</label>
          <select
            id="ttt-side"
            value={humanMark}
            onChange={(event) => {
              const mark = event.target.value as Mark;
              setHumanMark(mark);
              restart();
            }}
          >
            <option value="X">X · violet, moves first</option>
            <option value="O">O · ice</option>
          </select>
        </div>
        <div className="inline-actions">
          <button type="button" className="btn btn-primary" onClick={() => restart()}>
            Restart
          </button>
          <button
            type="button"
            className="btn btn-line"
            aria-pressed={muted}
            onClick={() => {
              setMuted((value) => {
                window.localStorage.setItem("bgames.muted", value ? "0" : "1");
                return !value;
              });
            }}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>
        <h2 className="kicker" style={{ marginTop: "1rem" }}>
          Recent results
        </h2>
        {matches.length === 0 ? (
          <p className="hint">Wins, losses, and draws land here after a game ends.</p>
        ) : (
          <ul className="move-list">
            {matches.map((match) => (
              <li key={match.id}>
                <span />
                <span>{match.result}</span>
                <span>{match.opponent}</span>
              </li>
            ))}
          </ul>
        )}
        {notice ? <p className="note">{notice}</p> : null}
        <p className="hint">Hard mode searches the whole tree. It will draw a perfect opponent and punish a mistake.</p>
      </aside>
    </div>
  );
}
