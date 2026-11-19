import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Home from './pages/Home';
import EquivalentPipe from './pages/EquivalentPipe';
import HardyCross from './pages/HardyCross';

export type Page = 'home' | 'eq' | 'hc';
export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const items: [Page, string][] = [['home', 'Home'], ['eq', 'Equivalent Pipe'], ['hc', 'Hardy Cross']];
  return (
    <div className="min-h-screen bg-hf-page text-hf-black">
      <header className="no-print sticky top-0 z-50 border-b border-white/10 bg-hf-black text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => { setPage('home'); setMenuOpen(false); }} className="no-print flex items-center gap-1 text-left">
            <span className="text-lg font-black tracking-[0.08em]">HYDROFLOW</span>
            <span className="rounded-md bg-hf-yellow px-2 py-1 text-xs font-black tracking-wider text-hf-black">PRO</span>
          </button>
          <button aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)} className="no-print rounded-lg border border-white/20 p-2 md:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-1 border-t border-white/10 bg-hf-black p-4 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}>
            {items.map(([k, label]) => (
              <button key={k} onClick={() => { setPage(k); setMenuOpen(false); }}
                className={`no-print rounded-lg px-4 py-2 text-sm font-bold transition-colors ${page === k ? 'bg-hf-yellow text-hf-black' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>{label}</button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {page === 'home' && <Home go={setPage} />}
        {page === 'eq' && <EquivalentPipe />}
        {page === 'hc' && <HardyCross />}
      </main>
      <footer className="no-print border-t border-hf-border py-6 text-center text-xs font-semibold tracking-[0.12em] text-hf-muted">HYDROFLOW PRO — PIPE NETWORK ANALYSIS CALCULATOR</footer>
    </div>
  );
}
