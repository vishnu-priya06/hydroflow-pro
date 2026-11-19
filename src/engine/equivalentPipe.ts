import { N, PipeInput, calculateHazenWilliams, equivalentDiameter, calculateResistance } from './hazenWilliams';

export function solveSeries(pipes: PipeInput[], Leq: number, Ceq: number, relTol = 1e-6) {
  if (!pipes.length) throw new Error('At least one pipe is required.');
  const Q = pipes[0].Q;
  if (pipes.some(p => Math.abs(p.Q - Q) > relTol * Math.max(1, Math.abs(Q))))
    throw new Error('Series pipes must carry the same discharge. Check the entered Q values.');
  const rows = pipes.map(calculateHazenWilliams);
  const H = rows.reduce((s, r) => s + r.hf, 0);
  const Deq = equivalentDiameter(Leq, Ceq, Q, H);
  return { rows, Q, totalLength: pipes.reduce((s, p) => s + p.L, 0), totalHeadLoss: H, Deq,
           req: calculateResistance(Leq, Ceq, Deq) };
}

/** Bisection on common head H: f(H)=sum (H/ri)^(1/n) - Qtotal (monotonic increasing). */
export function solveParallel(pipes: Omit<PipeInput, 'Q'>[], Qtotal: number, Leq: number, Ceq: number, tol = 1e-12) {
  if (!(Qtotal > 0)) throw new Error('Total discharge must be positive.');
  const r = pipes.map(p => calculateResistance(p.L, p.C, p.D));
  const branchQ = (H: number) => r.map(ri => Math.pow(H / ri, 1 / N));
  let lo = 0, hi = Math.min(...r) * Math.pow(Qtotal, N); // upper bound: lowest-resistance branch alone carries Qtotal
  let iterations = 0;
  while (iterations++ < 500 && hi - lo > tol * hi) {
    const mid = (lo + hi) / 2;
    branchQ(mid).reduce((a, b) => a + b, 0) > Qtotal ? (hi = mid) : (lo = mid);
  }
  const H = (lo + hi) / 2, Q = branchQ(H);
  const sumQ = Q.reduce((a, b) => a + b, 0);
  const Deq = equivalentDiameter(Leq, Ceq, Qtotal, H);
  return { H, branchQ: Q, velocities: Q.map((q, i) => (4 * q) / (Math.PI * pipes[i].D ** 2)),
           Deq, flowBalanceError: Math.abs(sumQ - Qtotal), iterations };
}
