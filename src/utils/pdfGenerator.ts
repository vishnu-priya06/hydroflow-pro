import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateResistance, N } from '../engine/hazenWilliams';

const FOOT = 'HYDROFLOW PRO – PIPE NETWORK ANALYSIS CALCULATOR';
const head = { fillColor: [10, 10, 10] as [number, number, number], textColor: [255, 196, 0] as [number, number, number] };
const f = (x: number, d = 5) => x.toFixed(d);
const endY = (doc: jsPDF) => (doc as any).lastAutoTable.finalY + 8;

function title(doc: jsPDF, t: string, sub: string) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('HYDROFLOW PRO', 14, 18);
  doc.setFontSize(12); doc.text(t, 14, 26); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(sub, 14, 32);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 18);
}
function footers(doc: jsPDF) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8);
    doc.text(FOOT, 14, 287); doc.text(`Page ${i} of ${n}`, 196, 287, { align: 'right' }); }
}
function text(doc: jsPDF, y: number, lines: string[]) {
  doc.setFont('courier', 'normal'); doc.setFontSize(9);
  lines.forEach((l, i) => doc.text(l, 14, y + i * 5)); doc.setFont('helvetica', 'normal');
  return y + lines.length * 5 + 4;
}

export function hardyCrossPDF(res: any) {
  const doc = new jsPDF(); title(doc, 'Hardy Cross Method', 'Iterative pipe network analysis (Hazen-Williams)');
  let y = text(doc, 42, ['h = r |Q|^1.852,  r = 10.67 L / (C^1.852 D^4.87)', 'dQ = -Sum(h) / [1.852 Sum(r |Q|^0.852)]',
    `Tolerance = ${res.tol}  |  Iterations = ${res.iterations}  |  Status = ${res.converged ? 'CONVERGED' : 'NOT CONVERGED'}`]);
  autoTable(doc, { startY: y, head: [['Pipe', 'Start', 'End', 'Final Q (m3/s)', 'Direction', 'Head loss (m)']], headStyles: head, styles: { fontSize: 8 },
    body: res.pipes.map((p: any) => [p.id, p.start, p.end, f(Math.abs(p.Q)), p.Q >= 0 ? `${p.start}->${p.end}` : `${p.end}->${p.start}`,
      f(calculateResistance(p.L, p.C, p.D) * Math.pow(Math.abs(p.Q), N), 4)]) });
  y = text(doc, endY(doc), ['Loop residuals: ' + res.loopResiduals.map((x: number, i: number) => `L${i + 1}=${x.toExponential(2)}`).join('  '),
    'Final max correction: ' + res.maxCorrections[res.maxCorrections.length - 1].toExponential(3)]);
  autoTable(doc, { startY: y, head: [['Iter', 'Loop', 'Pipe', 'Previous Q', 'Signed h', 'dQ', 'Corrected Q']], headStyles: head, styles: { fontSize: 7 },
    body: res.rows.map((r: any) => [r.iteration, r.loop, r.pipe, f(r.previousFlow), f(r.signedHeadLoss, 4), f(r.correction, 6), f(r.correctedFlow)]) });
  footers(doc); doc.save('hardy-cross-report.pdf');
}

export function equivalentPipePDF(res: any) {
  const doc = new jsPDF(); title(doc, `Equivalent Pipe Method (${res.mode})`, 'Hazen-Williams');
  let y = text(doc, 42, ['hf = 10.67 L Q^1.852 / (C^1.852 D^4.87)', `Leq = ${res.le} m, Ceq = ${res.ce}`]);
  if (res.mode === 'series') {
    autoTable(doc, { startY: y, head: [['Pipe', 'A (m2)', 'V (m/s)', 'r', 'hf (m)']], headStyles: head,
      body: res.rows.map((r: any, i: number) => [i + 1, f(r.area), f(r.velocity, 4), f(r.r, 3), f(r.hf, 4)]) });
    text(doc, endY(doc), [`Q = ${f(res.Q, 4)} m3/s`, `Total length = ${f(res.totalLength, 2)} m`, `Total head loss = ${f(res.totalHeadLoss, 4)} m`,
      `Equivalent resistance = ${f(res.req, 3)}`, `Equivalent diameter Deq = ${f(res.Deq, 4)} m`]);
  } else {
    autoTable(doc, { startY: y, head: [['Branch', 'r', 'Q (m3/s)', 'V (m/s)', 'hf (m)']], headStyles: head,
      body: res.table.map((r: any, i: number) => [i + 1, f(r.r, 3), f(r.Q), f(r.V, 4), f(r.hf, 4)]) });
    text(doc, endY(doc), [`Total Q = ${f(res.q, 4)} m3/s`, `Common head loss H = ${f(res.H, 4)} m`,
      `Flow balance error = ${res.flowBalanceError.toExponential(2)}`, `Equivalent diameter Deq = ${f(res.Deq, 4)} m`]);
  }
  footers(doc); doc.save('equivalent-pipe-report.pdf');
}
