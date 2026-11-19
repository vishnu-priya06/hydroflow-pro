import type { Page } from '../App';
import { ArrowRight, Gauge, Network } from 'lucide-react';
const Card = ({ title, text, onClick }: { title: string; text: string; onClick: () => void }) => (
  <div className="group flex min-h-64 flex-col rounded-2xl border-2 border-hf-black bg-hf-white p-6 shadow-[0_0_0_rgba(255,196,0,0)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#FFC400]">
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-hf-black bg-hf-yellow">
      {title.includes('EQUIVALENT') ? <Gauge size={24} strokeWidth={2.5} /> : <Network size={24} strokeWidth={2.5} />}
    </div>
    <h3 className="text-xl font-black tracking-tight">{title}</h3>
    <p className="mt-3 flex-1 text-sm leading-6 text-hf-muted">{text}</p>
    <button onClick={onClick} className="no-print mt-6 flex w-full items-center justify-between rounded-lg border-2 border-hf-black bg-hf-yellow px-4 py-3 text-sm font-black transition-colors hover:bg-hf-yellow-hover">START CALCULATION <ArrowRight size={18} /></button>
  </div>
);
export default function Home({ go }: { go: (p: Page) => void }) {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-hf-border bg-hf-white px-6 py-10 sm:px-10 sm:py-14">
        <div className="mb-5 h-2 w-24 bg-hf-yellow" />
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">HYDROFLOW <span className="text-hf-black">PRO</span></h1>
        <h2 className="mt-3 text-sm font-black tracking-[0.18em] text-hf-muted sm:text-base">PIPE NETWORK ANALYSIS CALCULATOR</h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-hf-muted">An interactive hydraulic engineering workspace for analyzing equivalent pipe systems and complex pipe networks using established engineering methods.</p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <Card title="EQUIVALENT PIPE METHOD" onClick={() => go('eq')}
          text="Calculate equivalent pipe diameter, hydraulic resistance, discharge distribution, velocity, and head loss for series and parallel pipe arrangements." />
        <Card title="HARDY CROSS METHOD" onClick={() => go('hc')}
          text="Perform iterative pipe network analysis using the Hardy Cross method with automatic flow corrections and convergence monitoring." />
      </section>
      <section className="rounded-2xl border-2 border-hf-black bg-hf-black p-6 text-sm sm:p-8">
        <div className="mb-5 flex items-center gap-3 font-sans font-black text-white"><span className="h-4 w-4 bg-hf-yellow" /> FORMULA OVERVIEW</div>
        <div className="grid gap-3 font-mono text-hf-yellow sm:text-base">
          <div className="rounded-lg border border-white/10 p-3">hf = 10.67 L Q^1.852 / (C^1.852 D^4.87)</div>
          <div className="rounded-lg border border-white/10 p-3">r = 10.67 L / (C^1.852 D^4.87), h = r|Q|^1.852</div>
          <div className="rounded-lg border border-white/10 p-3">ΔQ = −Σh / [1.852 Σ r|Q|^0.852]</div>
        </div>
      </section>
    </div>
  );
}
