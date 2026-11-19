import { N, calculateResistance } from './hazenWilliams';

export interface NetPipe { id: string; start: string; end: string; L: number; D: number; C: number; Q: number } // Q signed: + = start→end
export interface LoopPipe { pipeId: string; dir: 1 | -1 } // +1: loop traverses start→end
export interface Row { iteration: number; loop: number; pipe: string; previousFlow: number; signedHeadLoss: number; correction: number; correctedFlow: number }

/** external: node → net inflow from outside (+ supply, − demand). Returns node imbalances. */
export function continuityResiduals(pipes: NetPipe[], external: Record<string, number>) {
  const bal: Record<string, number> = {};
  for (const p of pipes) { bal[p.start] ??= 0; bal[p.end] ??= 0; }
  for (const k in external) bal[k] = (bal[k] ?? 0) + external[k];
  for (const p of pipes) { bal[p.start] -= p.Q; bal[p.end] += p.Q; }
  return bal;
}

export function loopResidual(pipes: NetPipe[], loop: LoopPipe[]) {
  const byId = new Map(pipes.map(p => [p.id, p]));
  return loop.reduce((s, lp) => {
    const p = byId.get(lp.pipeId)!;
    return s + lp.dir * Math.sign(p.Q) * calculateResistance(p.L, p.C, p.D) * Math.pow(Math.abs(p.Q), N);
  }, 0);
}

export function solveHardyCross(input: NetPipe[], loops: LoopPipe[][], external: Record<string, number>, tol = 1e-4, maxIter = 100, contTol = 1e-6) {
  const pipes = input.map(p => ({ ...p })); // single global flow per pipe (shared pipes are never copied)
  const byId = new Map(pipes.map(p => [p.id, p]));
  const bad = Object.entries(continuityResiduals(pipes, external)).filter(([, v]) => Math.abs(v) > contTol);
  if (bad.length) throw new Error('Initial flows violate node continuity at: ' + bad.map(([n, v]) => `${n} (${v.toFixed(6)})`).join(', '));
  for (const lp of loops.flat()) if (!byId.has(lp.pipeId)) throw new Error(`Loop references unknown pipe ${lp.pipeId}.`);

  const rows: Row[] = [], maxCorrections: number[] = [];
  let converged = false, it = 0;
  while (it < maxIter && !converged) {
    it++;
    let maxCorr = 0;
    loops.forEach((loop, li) => {
      let sumH = 0, sumD = 0;
      const terms = loop.map(lp => {
        const p = byId.get(lp.pipeId)!, r = calculateResistance(p.L, p.C, p.D);
        const h = lp.dir * Math.sign(p.Q) * r * Math.pow(Math.abs(p.Q), N);
        sumH += h; sumD += r * Math.pow(Math.abs(p.Q), N - 1);
        return { lp, p, h, prev: p.Q };
      });
      const dQ = -sumH / (N * sumD);
      for (const t of terms) { t.p.Q += t.lp.dir * dQ; // Q is signed along start→end; dir handles orientation
        rows.push({ iteration: it, loop: li + 1, pipe: t.p.id, previousFlow: t.prev, signedHeadLoss: t.h, correction: dQ, correctedFlow: t.p.Q }); }
      maxCorr = Math.max(maxCorr, Math.abs(dQ));
    });
    maxCorrections.push(maxCorr);
    converged = maxCorr < tol;
  }
  return { pipes, rows, iterations: it, maxCorrections, converged,
    message: converged ? 'Converged.' : 'Solution did not converge within the maximum number of iterations. Please check the network data and initial flows.',
    loopResiduals: loops.map(l => loopResidual(pipes, l)), continuity: continuityResiduals(pipes, external) };
}
