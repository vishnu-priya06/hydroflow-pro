import { useState } from 'react';
import { solveHardyCross, NetPipe, LoopPipe } from '../engine/hardyCross';
import { calculateResistance, N } from '../engine/hazenWilliams';
import { AlertCircle, Calculator, RotateCcw, Plus, Trash2, CheckCircle2, XCircle, FlaskConical, FileDown, Printer } from 'lucide-react';
import NetworkDiagram from '../components/NetworkDiagram';
import { hardyCrossPDF } from '../utils/pdfGenerator';

type Row = { id: string; start: string; end: string; L: string; D: string; C: string; Q: string };
const blank = (): Row => ({ id: '', start: '', end: '', L: '', D: '', C: '', Q: '' });
const f = (x: number, d = 5) => x.toFixed(d);
const inp = 'mt-2 w-full rounded-lg border border-hf-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-hf-yellow focus:ring-2 focus:ring-hf-yellow';

const example = (): { rows: Row[]; loops: string; ext: string } => {
  const m = (id: string, s: string, e: string, D: string, Q: string): Row => ({ id, start: s, end: e, L: '500', D, C: '120', Q });
  return { rows: [m('a', '1', '2', '0.30', '0.07'), m('b', '2', '3', '0.20', '0.03'), m('c', '1', '4', '0.25', '0.05'), m('d', '2', '5', '0.25', '0.04'),
    m('e', '3', '6', '0.20', '0.03'), m('f', '4', '5', '0.20', '0.05'), m('g', '5', '6', '0.30', '0.09')],
    loops: 'a+ d+ f- c-\nb+ e+ g- d-', ext: '1:0.12, 6:-0.12' };
};

export default function HardyCross() {
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [loopsText, setLoopsText] = useState(''); const [extText, setExtText] = useState('');
  const [tol, setTol] = useState('0.0001'); const [error, setError] = useState(''); const [res, setRes] = useState<any>(null);

  const upd = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const reset = () => { setRows([blank()]); setLoopsText(''); setExtText(''); setTol('0.0001'); setError(''); setRes(null); };
  const load = () => { const e = example(); setRows(e.rows); setLoopsText(e.loops); setExtText(e.ext); setError(''); setRes(null); };

  const run = () => {
    setError(''); setRes(null);
    try {
      const ids = new Set<string>();
      const pipes: NetPipe[] = rows.map((r, i) => {
        const id = r.id.trim(); if (!id) throw new Error(`Pipe row ${i + 1}: pipe ID is missing.`);
        if (ids.has(id)) throw new Error(`Duplicate pipe ID "${id}".`); ids.add(id);
        if (!r.start.trim() || !r.end.trim()) throw new Error(`Pipe ${id}: start and end nodes are required.`);
        if (r.start.trim() === r.end.trim()) throw new Error(`Pipe ${id}: start and end node cannot be the same.`);
        const n = (s: string, name: string, pos: boolean) => { const v = Number(s); if (s.trim() === '' || isNaN(v) || (pos && v <= 0)) throw new Error(`Pipe ${id}: invalid ${name}.`); return v; };
        return { id, start: r.start.trim(), end: r.end.trim(), L: n(r.L, 'length', true), D: n(r.D, 'diameter', true), C: n(r.C, 'C', true), Q: n(r.Q, 'initial flow', false) };
      });
      const loops: LoopPipe[][] = loopsText.split('\n').map(l => l.trim()).filter(Boolean).map((line, li) => line.split(/[\s,]+/).map(tok => {
        const dir = tok.endsWith('-') ? -1 : tok.endsWith('+') ? 1 : 0; const id = tok.replace(/[+-]$/, '');
        if (!dir) throw new Error(`Loop ${li + 1}: "${tok}" needs a + or − suffix (e.g. a+ for same direction as pipe).`);
        if (!ids.has(id)) throw new Error(`Loop ${li + 1}: unknown pipe "${id}".`);
        return { pipeId: id, dir: dir as 1 | -1 };
      }));
      if (!loops.length) throw new Error('Define at least one loop.');
      const external: Record<string, number> = {};
      extText.split(',').map(s => s.trim()).filter(Boolean).forEach(p => { const [k, v] = p.split(':'); if (!k || isNaN(Number(v))) throw new Error(`Node flow "${p}" must look like 1:0.12`); external[k.trim()] = Number(v); });
      const t = Number(tol);
      setRes({ ...solveHardyCross(pipes, loops, external, t, 100), tol: t });
    } catch (e: any) { setError(e.message); }
  };

  const byIter = (rowsAll: any[]) => { const m = new Map<number, any[]>(); rowsAll.forEach(r => m.set(r.iteration, [...(m.get(r.iteration) ?? []), r])); return [...m.entries()]; };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><span className="h-7 w-2 bg-hf-yellow" /><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Hardy Cross Method Calculator</h1></div>
      <div className="no-print space-y-6 rounded-2xl border border-hf-border bg-hf-white p-5 shadow-sm sm:p-6">
        <div className="overflow-x-auto rounded-xl border border-hf-border"><table className="w-full min-w-[900px] text-sm">
          <thead className="bg-hf-black text-white"><tr><th className="px-3 py-3 text-left">Pipe ID</th><th className="px-3 py-3 text-left">Start</th><th className="px-3 py-3 text-left">End</th><th className="px-3 py-3 text-left">L (m)</th><th className="px-3 py-3 text-left">D (m)</th><th className="px-3 py-3 text-left">C</th><th className="px-3 py-3 text-left">Initial Q (m³/s)</th><th></th></tr></thead>
          <tbody>{rows.map((r, i) => (<tr key={i} className={i % 2 ? 'bg-hf-page' : 'bg-white'}>{(['id', 'start', 'end', 'L', 'D', 'C', 'Q'] as const).map(k =>
            <td key={k} className="px-3 py-2"><input className={inp + ' min-w-20'} value={r[k]} onChange={e => upd(i, k, e.target.value)} /></td>)}
            <td className="px-3 py-2"><button disabled={rows.length <= 1} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="no-print inline-flex items-center gap-1 text-xs font-bold text-red-600 disabled:opacity-30"><Trash2 size={14} />Remove</button></td></tr>))}</tbody>
        </table></div>
        <button onClick={() => setRows([...rows, blank()])} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-hf-page"><Plus size={16} />Add Pipe</button>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold">Loops (one per line; + same direction, − opposite)
            <textarea className={inp + ' h-24 font-mono'} value={loopsText} onChange={e => setLoopsText(e.target.value)} placeholder="a+ d+ f- c-" /></label>
          <div className="space-y-4">
            <label className="block text-sm font-bold">External node flows (+ supply, − demand)
              <input className={inp} value={extText} onChange={e => setExtText(e.target.value)} placeholder="1:0.12, 6:-0.12" /></label>
            <label className="block text-sm font-bold">Tolerance
              <select className={inp} value={tol} onChange={e => setTol(e.target.value)}><option>0.001</option><option>0.0001</option><option>0.00001</option></select></label>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={run} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-hf-yellow px-5 py-2.5 text-sm font-black hover:bg-hf-yellow-hover"><Calculator size={16} />Calculate</button>
          <button onClick={load} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-hf-page"><FlaskConical size={16} />Load example</button>
          <button onClick={reset} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-hf-page"><RotateCcw size={16} />Reset</button>
        </div>
        {error && <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</div>}
      </div>

      {res && (<div className="space-y-5 rounded-2xl border border-hf-border bg-hf-white p-5 text-sm shadow-sm sm:p-6">
        <div className="no-print flex flex-wrap gap-3">
          <button onClick={() => hardyCrossPDF(res)} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-hf-yellow px-4 py-2.5 text-sm font-black hover:bg-hf-yellow-hover"><FileDown size={16} />Download PDF</button>
          <button onClick={() => window.print()} className="no-print inline-flex items-center gap-2 rounded-lg border-2 border-hf-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-hf-page"><Printer size={16} />Print Result</button>
        </div>
        <div className={`flex items-center gap-3 rounded-lg border p-4 font-bold ${res.converged ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {res.converged ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          {res.converged ? `Converged successfully in ${res.iterations} iterations.` : res.message}</div>
        <div><div className="h-2 rounded-full bg-hf-border"><div className="h-2 rounded-full bg-hf-yellow" style={{ width: `${Math.min(res.iterations, 100)}%` }} /></div>
          <div className="mt-2 font-mono text-xs text-hf-muted">{res.iterations} / 100 iterations · final max correction {res.maxCorrections[res.maxCorrections.length - 1].toExponential(3)} · tolerance {res.tol}</div></div>
        <section className="space-y-3 rounded-xl border border-hf-border p-4">
          <div className="flex items-center gap-3"><span className="h-5 w-1.5 bg-hf-yellow" /><h3 className="text-lg font-black">Network Diagram</h3></div>
          <NetworkDiagram pipes={res.pipes} />
        </section>
        <div className="flex items-center gap-3"><span className="h-5 w-1.5 bg-hf-yellow" /><h3 className="text-lg font-black">Final pipe flows</h3></div>
        <div className="overflow-x-auto rounded-xl border border-hf-border"><table className="w-full min-w-[760px]"><thead className="bg-hf-black text-white"><tr><th className="px-3 py-3 text-left">Pipe</th><th className="px-3 py-3 text-left">Start</th><th className="px-3 py-3 text-left">End</th><th className="px-3 py-3 text-right">Final flow (m³/s)</th><th className="px-3 py-3 text-left">Direction</th><th className="px-3 py-3 text-right">Head loss (m)</th></tr></thead>
          <tbody>{res.pipes.map((p: NetPipe, i: number) => (<tr key={p.id} className={i % 2 ? 'bg-hf-page' : 'bg-white'}><td className="px-3 py-2.5 font-bold">{p.id}</td><td className="px-3 py-2.5">{p.start}</td><td className="px-3 py-2.5">{p.end}</td><td className="px-3 py-2.5 text-right font-mono">{f(Math.abs(p.Q))}</td>
            <td className="px-3 py-2.5">{p.Q >= 0 ? `${p.start} → ${p.end}` : `${p.end} → ${p.start}`}</td><td className="px-3 py-2.5 text-right font-mono">{f(calculateResistance(p.L, p.C, p.D) * Math.pow(Math.abs(p.Q), N), 4)}</td></tr>))}</tbody></table></div>
        <div className="grid gap-2 rounded-lg bg-hf-black p-4 font-mono text-sm text-hf-yellow">
          <div>Loop head-loss residuals: {res.loopResiduals.map((x: number, i: number) => <span key={i} className="mr-3">L{i + 1}: {x.toExponential(2)}</span>)}</div>
          <div>Max node continuity error: {Math.max(...(Object.values(res.continuity) as number[]).map(Math.abs)).toExponential(2)}</div>
        </div>
        <div className="flex items-center gap-3"><span className="h-5 w-1.5 bg-hf-yellow" /><h3 className="text-lg font-black">Iteration history</h3></div>
        {byIter(res.rows).map(([it, rs]) => (<details key={it} className="group rounded-lg border border-hf-border px-4 py-3 open:border-l-4 open:border-l-hf-yellow">
          <summary className="cursor-pointer font-bold">Iteration {it} — max |ΔQ| = {Math.max(...rs.map((r: any) => Math.abs(r.correction))).toExponential(3)}</summary>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[700px]"><thead className="bg-hf-black text-white"><tr><th className="px-3 py-2 text-left">Loop</th><th className="px-3 py-2 text-left">Pipe</th><th className="px-3 py-2 text-right">Previous Q</th><th className="px-3 py-2 text-right">Signed h</th><th className="px-3 py-2 text-right">ΔQ</th><th className="px-3 py-2 text-right">Corrected Q</th></tr></thead>
            <tbody>{rs.map((r: any, i: number) => <tr key={i} className={i % 2 ? 'bg-hf-page' : 'bg-white'}><td className="px-3 py-2">{r.loop}</td><td className="px-3 py-2">{r.pipe}</td><td className="px-3 py-2 text-right font-mono">{f(r.previousFlow)}</td><td className="px-3 py-2 text-right font-mono">{f(r.signedHeadLoss, 4)}</td><td className="px-3 py-2 text-right font-mono">{f(r.correction, 6)}</td><td className="px-3 py-2 text-right font-mono">{f(r.correctedFlow)}</td></tr>)}</tbody></table></div></details>))}
      </div>)}
    </div>
  );
}
