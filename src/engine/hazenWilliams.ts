export const N = 1.852;
export const calculateArea = (D: number) => (Math.PI * D * D) / 4;
export const calculateVelocity = (Q: number, D: number) => Q / calculateArea(D);
export const calculateResistance = (L: number, C: number, D: number) =>
  (10.67 * L) / (Math.pow(C, N) * Math.pow(D, 4.87));
export const calculateHeadLoss = (r: number, Q: number) => r * Math.pow(Math.abs(Q), N);
export interface PipeInput { L: number; D: number; C: number; Q: number }
export function calculateHazenWilliams(p: PipeInput) {
  const r = calculateResistance(p.L, p.C, p.D);
  return { area: calculateArea(p.D), velocity: calculateVelocity(p.Q, p.D), r, hf: calculateHeadLoss(r, p.Q) };
}
/** Deq = [10.67 Leq Q^1.852 / (Ceq^1.852 H)]^(1/4.87) */
export const equivalentDiameter = (Leq: number, Ceq: number, Q: number, H: number) =>
  Math.pow((10.67 * Leq * Math.pow(Math.abs(Q), N)) / (Math.pow(Ceq, N) * H), 1 / 4.87);
