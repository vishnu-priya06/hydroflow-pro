import { describe, it, expect } from 'vitest';
import { calculateHazenWilliams, calculateResistance, equivalentDiameter } from '../engine/hazenWilliams';
import { solveSeries, solveParallel } from '../engine/equivalentPipe';
import { solveHardyCross, NetPipe, loopResidual } from '../engine/hardyCross';

const base = { L: 500, D: 0.3, C: 120, Q: 0.1 };
describe('Hazen-Williams', () => {
  it('head loss responds to D, L, Q, C', () => {
    const h = calculateHazenWilliams(base).hf;
    expect(calculateHazenWilliams({ ...base, D: 0.35 }).hf).toBeLessThan(h);
    expect(calculateHazenWilliams({ ...base, L: 700 }).hf).toBeGreaterThan(h);
    expect(calculateHazenWilliams({ ...base, Q: 0.15 }).hf).toBeGreaterThan(h);
    expect(calculateHazenWilliams({ ...base, C: 140 }).hf).toBeLessThan(h);
  });
});
describe('Equivalent pipe', () => {
  it('series Deq reproduces total head loss', () => {
    const s = solveSeries([base, { ...base, L: 300, D: 0.25 }], 800, 120);
    const r = calculateResistance(800, 120, s.Deq);
    expect(r * s.Q ** 1.852).toBeCloseTo(s.totalHeadLoss, 8);
  });
  it('parallel: equal heads, flow conserved', () => {
    const p = solveParallel([{ L: 500, D: 0.3, C: 120 }, { L: 800, D: 0.2, C: 110 }], 0.2, 600, 120);
    const r = [calculateResistance(500, 120, .3), calculateResistance(800, 110, .2)];
    expect(r[0] * p.branchQ[0] ** 1.852).toBeCloseTo(r[1] * p.branchQ[1] ** 1.852, 8);
    expect(p.flowBalanceError).toBeLessThan(1e-9);
  });
});
const mk = (id: string, s: string, e: string, D: number, Q: number): NetPipe => ({ id, start: s, end: e, L: 500, D, C: 120, Q });
const ladder = (q = 1) => [mk('a','1','2',.30,.07*q), mk('b','2','3',.20,.03*q), mk('c','1','4',.25,.05*q), mk('d','2','5',.25,.04*q),
  mk('e','3','6',.20,.03*q), mk('f','4','5',.20,.05*q), mk('g','5','6',.30,.09*q)];
const loops = [[{pipeId:'a',dir:1},{pipeId:'d',dir:1},{pipeId:'f',dir:-1},{pipeId:'c',dir:-1}],
               [{pipeId:'b',dir:1},{pipeId:'e',dir:1},{pipeId:'g',dir:-1},{pipeId:'d',dir:-1}]] as any;
const ext = { '1': 0.12, '6': -0.12 };
describe('Hardy Cross', () => {
  it('converges with zero residuals, continuity kept, shared pipe d updated globally', () => {
    const r = solveHardyCross(ladder(), loops, ext, 1e-6);
    expect(r.converged).toBe(true);
    r.loopResiduals.forEach(x => expect(Math.abs(x)).toBeLessThan(1e-3));
    Object.values(r.continuity).forEach(x => expect(Math.abs(x)).toBeLessThan(1e-9));
    expect(r.rows.filter(x => x.pipe === 'd').length).toBe(2 * r.iterations);
  });
  it('correction equation: ΔQ = -Σh / (n Σ r|Q|^0.852)', () => {
    const r = solveHardyCross(ladder(), loops, ext, 1e-6, 1);
    const ps = ladder(), L1 = loops[0];
    let sh = 0, sd = 0;
    for (const lp of L1) { const p = ps.find(x => x.id === lp.pipeId)!, rr = calculateResistance(p.L, p.C, p.D);
      sh += lp.dir * rr * Math.abs(p.Q) ** 1.852; sd += rr * Math.abs(p.Q) ** 0.852; }
    expect(r.rows[0].correction).toBeCloseTo(-sh / (1.852 * sd), 10);
  });
  it('different initial flows change iteration history; bad continuity rejected', () => {
    const a = solveHardyCross(ladder(), loops, ext, 1e-6).iterations;
    const alt = ladder(); alt[0].Q = 0.08; alt[1].Q = 0.04; alt[2].Q = 0.04; alt[5].Q = 0.04; alt[3].Q = 0.04; alt[4].Q = 0.04; alt[6].Q = 0.08;
    expect(solveHardyCross(alt, loops, ext, 1e-6).rows[0].correction).not.toBe(solveHardyCross(ladder(), loops, ext, 1e-6).rows[0].correction);
    expect(a).toBeGreaterThan(0);
    expect(() => solveHardyCross(ladder(2), loops, ext)).toThrow(/continuity/);
  });
  it('reports non-convergence honestly', () => {
    expect(solveHardyCross(ladder(), loops, ext, 1e-14, 1).converged).toBe(false);
  });
});
