import { useMemo } from 'react';

export interface DiagramPipe { id: string; start: string; end: string; Q: number }
const W = 640, H = 420, PAD = 50;

function layout(pipes: DiagramPipe[]) {
  const names = [...new Set(pipes.flatMap(p => [p.start, p.end]))];
  const pos = new Map(names.map((n, i) => {
    const a = (2 * Math.PI * i) / Math.max(names.length, 1);
    return [n, { x: Math.cos(a), y: Math.sin(a) }];
  }));
  for (let it = 0; it < 300; it++) {
    const force = new Map(names.map(n => [n, { x: 0, y: 0 }]));
    for (const a of names) for (const b of names) if (a !== b) {
      const pa = pos.get(a)!, pb = pos.get(b)!;
      const dx = pa.x - pb.x, dy = pa.y - pb.y, d2 = Math.max(dx * dx + dy * dy, 0.01);
      const f = 0.02 / d2, fa = force.get(a)!; fa.x += dx * f; fa.y += dy * f;
    }
    for (const p of pipes) {
      const pa = pos.get(p.start)!, pb = pos.get(p.end)!;
      const dx = pb.x - pa.x, dy = pb.y - pa.y, k = 0.05;
      const fa = force.get(p.start)!, fb = force.get(p.end)!;
      fa.x += dx * k; fa.y += dy * k; fb.x -= dx * k; fb.y -= dy * k;
    }
    names.forEach(n => { const p = pos.get(n)!, f = force.get(n)!; p.x += f.x; p.y += f.y; });
  }
  const xs = names.map(n => pos.get(n)!.x), ys = names.map(n => pos.get(n)!.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const sx = (W - 2 * PAD) / Math.max(maxX - minX, 1e-6), sy = (H - 2 * PAD) / Math.max(maxY - minY, 1e-6);
  const out = new Map<string, { x: number; y: number }>();
  names.forEach(n => { const p = pos.get(n)!; out.set(n, { x: PAD + (p.x - minX) * sx, y: PAD + (p.y - minY) * sy }); });
  return out;
}

export default function NetworkDiagram({ pipes }: { pipes: DiagramPipe[] }) {
  const topo = pipes.map(p => `${p.id}:${p.start}>${p.end}`).join('|');
  const pos = useMemo(() => layout(pipes), [topo]);
  if (!pipes.length) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-xl border border-hf-border bg-white">
      {pipes.map(p => {
        const a = pos.get(p.start)!, b = pos.get(p.end)!;
        const fwd = p.Q >= 0, from = fwd ? a : b, to = fwd ? b : a;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
        return (
          <g key={p.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#0A0A0A" strokeWidth={2.5} />
            <polygon points="-8,-6 8,0 -8,6" fill="#FFC400" stroke="#0A0A0A" strokeWidth={1} transform={`translate(${mx},${my}) rotate(${ang})`} />
            <text x={mx} y={my - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0A0A0A" stroke="#fff" strokeWidth={3} paintOrder="stroke">
              {p.id}: {Math.abs(p.Q).toFixed(4)}
            </text>
          </g>
        );
      })}
      {[...pos.entries()].map(([n, p]) => (
        <g key={n}>
          <circle cx={p.x} cy={p.y} r={14} fill="#FFC400" stroke="#0A0A0A" strokeWidth={2} />
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={12} fontWeight={700}>{n}</text>
        </g>
      ))}
    </svg>
  );
}
