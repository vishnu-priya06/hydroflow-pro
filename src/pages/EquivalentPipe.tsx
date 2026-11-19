import { useState } from 'react';
import { calculateHazenWilliams, calculateResistance, N } from '../engine/hazenWilliams';
import { solveSeries, solveParallel } from '../engine/equivalentPipe';
import { AlertCircle, Calculator, RotateCcw, Plus, Trash2, FileDown, Printer } from 'lucide-react';
import { equivalentPipePDF } from '../utils/pdfGenerator';

type Row = { L: string; D: string; C: string; Q: string };
const blank = (): Row => ({ L: '', D: '', C: '', Q: '' });
const initial = () => [blank(), blank()];
const f = (x: number, d = 4) => (Number.isFinite(x) ? x.toFixed(d) : '—');
const inp = 'w-full rounded-lg border border-hf-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-hf-yellow focus:ring-2 focus:ring-hf-yellow';

export default function EquivalentPipe() {
  const [mode, setMode] = useState<'series' | 'parallel'>('series');
  const [rows, setRows] = useState<Row[]>(initial());
  const [Leq, setLeq] = useState(''); const [Ceq, setCeq] = useState(''); const [Qt, setQt] = useState('');
  const [error, setError] = useState(''); const [res, setRes] = useState<any>(null);

  const upd = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const reset = () => { setRows(initial()); setLeq(''); setCeq(''); setQt(''); setError(''); setRes(null); };

  const calc = () => {
    setError(''); setRes(null);
    try {
      const num = (s: string, name: string, positive = true) => {
        if (s.trim() === '' || isNaN(Number(s))) throw new Error(`${name}: enter a valid number.`);
        const v = Number(s); if (positive && v <= 0) throw new Error(`${name} must be greater than zero.`); return v;
      };
      const pipes = rows.map((r, i) => ({ L: num(r.L, `Pipe ${i + 1} length`), D: num(r.D, `Pipe ${i + 1} diameter`), C: num(r.C, `Pipe ${i + 1} C`),
        Q: mode === 'series' ? num(r.Q, `Pipe ${i + 1} discharge`) : 1 }));
      const le = num(Leq, 'Equivalent length'), ce = num(Ceq, 'Equivalent C');
      if (mode === 'series') setRes({ mode, le, ce, ...solveSeries(pipes, le, ce) });
      else {
        const q = num(Qt, 'Total discharge'); const s = solveParallel(pipes, q, le, ce);
        const table = pipes.map((p, i) => ({ r: calculateResistance(p.L, p.C, p.D), Q: s.branchQ[i], V: s.velocities[i], hf: s.H }));
        setRes({ mode, le, ce, q, table, ...s });
      }
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="h-7 w-2 bg-hf-yellow" />
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Equivalent Pipe Calculator</h1>
      </div>
      <div className="no-print space-y-6 rounded-2xl border border-hf-border bg-hf-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-bold text-hf-black">Arrangement<select className={inp + ' mt-2'} value={mode} onChange={e => { setMode(e.target.value as any); setRes(null); }}>
            <option value="series">Series</option><option value="parallel">Parallel</option></select></label>
          {mode === 'parallel' && <label className="text-sm font-bold">Total Q (m³/s)<input className={inp + ' mt-2'} value={Qt} onChange={e => setQt(e.target.value)} /></label>}
          <label className="text-sm font-bold">Equivalent length Leq (m)<input className={inp + ' mt-2'} value={Leq} onChange={e => setLeq(e.target.value)} /></label>
          <label className="text-sm font-bold">Equivalent C (Ceq)<input className={inp + ' mt-2'} value={Ceq} onChange={e => setCeq(e.target.value)} /></label>
        </div>
        <div className="overflow-x-auto rounded-xl border border-hf-border"><table className="w-full min-w-[700px] text-sm">
          <thead className="bg-hf-black text-white"><tr><th className="px-3 py-3 text-left">Pipe</th><th className="px-3 py-3 text-left">L (m)</th><th className="px-3 py-3 text-left">D (m)</th><th className="px-3 py-3 text-left">C</th>{mode === 'series' && <th className="px-3 py-3 text-left">Q (m³/s)</th>}<th></th></tr></thead>
          <tbody>{rows.map((r, i) => (<tr key={i} className={i % 2 ? 'bg-hf-page' : 'bg-white'}><td className="px-3 py-2 font-bold">{i + 1}</td>
            {(['L', 'D', 'C'] as const).map(k => <td key={k} className="px-3 py-2"><input className={inp} value={r[k]} onChange={e => upd(i, k, e.target.value)} /></td>)}
            {mode === 'series' && <td className="px-3 py-2"><input className={inp} value={r.Q} onChange={e => upd(i, 'Q', e.target.value)} /></td>}
            <td className="px-3 py-2"><button disabled={rows.length <= 1} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="no-print inline-flex items-center gap-1 text-xs font-bold text-red-600 disabled:opacity-30"><Trash2 size={14} />Remove</button></td></tr>))}</tbody>
        </table></div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setRows([...rows, blank()])} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-hf-page"><Plus size={16} />Add Pipe</button>
          <button onClick={calc} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-hf-yellow px-5 py-2.5 text-sm font-black hover:bg-hf-yellow-hover"><Calculator size={16} />Calculate</button>
          <button onClick={reset} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-hf-page"><RotateCcw size={16} />Reset</button>
        </div>
        {error && <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</div>}
      </div>

      {res && (
        <div className="space-y-5 rounded-2xl border border-hf-border bg-hf-white p-5 text-sm shadow-sm sm:p-6">
          <div className="flex items-center gap-3"><span className="h-5 w-1.5 bg-hf-yellow" /><h2 className="text-lg font-black">Solution</h2></div>
          <div className="no-print flex flex-wrap gap-3">
            <button onClick={() => equivalentPipePDF(res)} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-hf-yellow px-4 py-2.5 text-sm font-black hover:bg-hf-yellow-hover"><FileDown size={16} />Download PDF</button>
            <button onClick={() => window.print()} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-hf-page"><Printer size={16} />Print Result</button>
          </div>
          <div className="rounded-lg bg-hf-black p-4 font-mono text-hf-yellow">hf = 10.67 L Q^{N} / (C^{N} D^4.87)</div>
          {res.mode === 'series' ? (<>
            <div className="overflow-x-auto rounded-xl border border-hf-border"><table className="w-full min-w-[600px]"><thead className="bg-hf-black text-white"><tr><th className="px-3 py-3 text-left">Pipe</th><th className="px-3 py-3 text-right">A (m²)</th><th className="px-3 py-3 text-right">V (m/s)</th><th className="px-3 py-3 text-right">r</th><th className="px-3 py-3 text-right">hf (m)</th></tr></thead>
              <tbody>{res.rows.map((r: any, i: number) => <tr key={i} className={i % 2 ? 'bg-hf-page' : 'bg-white'}><td className="px-3 py-2.5 font-bold">{i + 1}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.area, 5)}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.velocity)}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.r, 3)}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.hf)}</td></tr>)}</tbody></table></div>
            <div className="rounded-lg bg-hf-black p-4 font-mono text-hf-yellow">Deq = [10.67 × {res.le} × {f(res.Q, 4)}^{N} / ({res.ce}^{N} × {f(res.totalHeadLoss)})]^(1/4.87)</div>
            <ul className="grid gap-2 sm:grid-cols-2"><li>Discharge Q = <b>{f(res.Q, 4)} m³/s</b></li><li>Total length = <b>{f(res.totalLength, 2)} m</b></li>
              <li>Total head loss = <b>{f(res.totalHeadLoss)} m</b></li><li>Equivalent resistance req = <b>{f(res.req, 3)}</b></li>
              <li>Equivalent diameter Deq = <b>{f(res.Deq, 4)} m</b></li></ul>
          </>) : (<>
            <div className="overflow-x-auto rounded-xl border border-hf-border"><table className="w-full min-w-[600px]"><thead className="bg-hf-black text-white"><tr><th className="px-3 py-3 text-left">Branch</th><th className="px-3 py-3 text-right">r</th><th className="px-3 py-3 text-right">Q (m³/s)</th><th className="px-3 py-3 text-right">V (m/s)</th><th className="px-3 py-3 text-right">hf (m)</th></tr></thead>
              <tbody>{res.table.map((r: any, i: number) => <tr key={i} className={i % 2 ? 'bg-hf-page' : 'bg-white'}><td className="px-3 py-2.5 font-bold">{i + 1}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.r, 3)}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.Q, 5)}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.V)}</td><td className="px-3 py-2.5 text-right font-mono">{f(r.hf)}</td></tr>)}</tbody></table></div>
            <ul className="grid gap-2"><li>Common head loss H = <b>{f(res.H)} m</b></li><li>Total discharge = <b>{f(res.q, 4)} m³/s</b></li>
              <li>Flow balance error = <b>{res.flowBalanceError.toExponential(2)}</b> (bisection iterations: {res.iterations})</li>
              <li>Equivalent diameter Deq = <b>{f(res.Deq, 4)} m</b> (Leq = {res.le} m, Ceq = {res.ce})</li></ul>
          </>)}
        </div>)}
    </div>
  );
}
