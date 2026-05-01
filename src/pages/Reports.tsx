import React from 'react';
import { useDelegateStore } from '../store/delegateStore';
import { useSessionStore } from '../store/sessionStore';
import { useSpeechStore } from '../store/speechStore';
import { useMotionStore } from '../store/motionStore';
import { useTimerStore } from '../store/timerStore';
import { 
  FileDown, 
  TrendingUp, 
  Mic, 
  BarChart2, 
  FileText, 
  Activity, 
  Clock, 
  Users 
} from 'lucide-react';
import './Reports.css';

const fmtTime = (s: number) => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
};

const exportPDF = async (
  session: any, delegates: any[], speeches: any[], motions: any[]
) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(30, 30, 50);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MUN Chair Pro — Session Report', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${session.committee} · ${session.conference}`, 14, 28);
  doc.text(`Topic: ${session.topic}`, 14, 35);

  let y = 50;
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Summary', 14, y);
  y += 8;

  const totalSpeechTime = delegates.reduce((s: number, d: any) => s + d.totalSpeechSeconds, 0);
  const totalSpeeches = delegates.reduce((s: number, d: any) => s + d.speechCount, 0);

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Delegates', delegates.length],
      ['Total Speeches', totalSpeeches],
      ['Total Speech Time', fmtTime(totalSpeechTime)],
      ['Motions Proposed', motions.length],
      ['Motions Passed', motions.filter((m: any) => m.status === 'passed').length],
    ],
    theme: 'grid', styles: { fontSize: 9 },
    headStyles: { fillColor: [108, 99, 255] },
  });

  y = (doc as any).lastAutoTable.finalY + 14;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Delegate Engagement', 14, y);
  y += 4;

  const sorted = [...delegates].sort((a, b) => b.engagementScore - a.engagementScore);
  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Country', 'Bloc', 'Speeches', 'Speech Time', 'POIs', 'Score']],
    body: sorted.map((d, i) => [
      i + 1, d.country, d.bloc || '—', d.speechCount,
      fmtTime(d.totalSpeechSeconds), `${d.poiAskedCount}/${d.poiAnsweredCount}`,
      d.engagementScore.toFixed(1),
    ]),
    theme: 'striped', styles: { fontSize: 8 },
    headStyles: { fillColor: [108, 99, 255] },
  });

  doc.save(`${session.committee}_${session.conference}_report.pdf`);
};

const exportCSV = (delegates: any[]) => {
  const header = 'Country,Bloc,Speeches,SpeechTime(s),POI_Asked,POI_Answered,Motions,Points,Score';
  const rows = delegates.map(d =>
    `${d.country},${d.bloc},${d.speechCount},${d.totalSpeechSeconds},${d.poiAskedCount},${d.poiAnsweredCount},${d.motionCount},${d.pointCount},${d.engagementScore}`
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = 'mun_session_data.csv'; a.click();
};

export const Reports: React.FC = () => {
  const { delegates } = useDelegateStore();
  const { session } = useSessionStore();
  const { speeches } = useSpeechStore();
  const { motions } = useMotionStore();
  const { sessionTimer } = useTimerStore();

  const topSpeakers = [...delegates]
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 5);

  const totalSpeechTime = delegates.reduce((s, d) => s + d.totalSpeechSeconds, 0);
  const avgSpeechTime = delegates.filter(d => d.speechCount > 0).length > 0
    ? totalSpeechTime / delegates.filter(d => d.speechCount > 0).length : 0;

  const passedMotions = motions.filter(m => m.status === 'passed').length;

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <BarChart2 size={40} />
        <p className="mt-3">Open a session to view reports</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1 className="text-xl font-bold">{session.committee} — Reports</h1>
          <p className="text-secondary text-sm">{session.conference} · {session.topic}</p>
        </div>
        <div className="flex gap-2">
          <button id="btn-export-csv" className="btn btn-ghost btn-sm" onClick={() => exportCSV(delegates)}>
            <FileDown size={14} /> Export CSV
          </button>
          <button id="btn-export-pdf" className="btn btn-primary btn-sm" onClick={() => exportPDF(session, delegates, speeches, motions)}>
            <FileDown size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Delegates</div>
          <div className="stat-value">{delegates.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Speeches</div>
          <div className="stat-value">{delegates.reduce((s,d)=>s+d.speechCount,0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Speech Time</div>
          <div className="stat-value">{fmtTime(Math.round(avgSpeechTime))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Session Time</div>
          <div className="stat-value">{fmtTime(sessionTimer.elapsedSeconds)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Motions Passed</div>
          <div className="stat-value text-green">{passedMotions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">POIs Raised</div>
          <div className="stat-value">{delegates.reduce((s,d)=>s+d.poiAskedCount,0)}</div>
        </div>
      </div>

      <div className="reports-section">
        <h2 className="section-title flex items-center gap-2 mb-3"><TrendingUp size={16} /> Top Performers</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th><th>Country</th><th>Bloc</th>
                <th>Speeches</th><th>Speech Time</th>
                <th>POIs Ask/Ans</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {topSpeakers.map((d, i) => (
                <tr key={d.id}>
                  <td className="mono font-bold" style={{color:'var(--accent)'}}>#{i+1}</td>
                  <td className="font-bold">{d.country}</td>
                  <td className="text-muted text-sm">{d.bloc||'—'}</td>
                  <td className="mono">{d.speechCount}</td>
                  <td className="mono">{fmtTime(d.totalSpeechSeconds)}</td>
                  <td className="mono">{d.poiAskedCount}/{d.poiAnsweredCount}</td>
                  <td>
                    <span className={`mono font-bold ${d.engagementScore>=10?'text-green':d.engagementScore>=5?'text-amber':'text-muted'}`}>
                      {d.engagementScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reports-section">
        <h2 className="section-title flex items-center gap-2 mb-3"><Activity size={16} /> Judging & Awards Dashboard</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Score</th>
                <th>Chair Grade (1-10)</th>
                <th>Award Category</th>
              </tr>
            </thead>
            <tbody>
              {[...delegates].sort((a,b)=>b.engagementScore-a.engagementScore).map(d => (
                <tr key={d.id}>
                  <td className="font-bold">{d.country}</td>
                  <td className="mono">{d.engagementScore.toFixed(1)}</td>
                  <td>
                    <input 
                      type="number" 
                      min="1" max="10"
                      className="input input-sm" 
                      style={{width: 60}}
                      value={d.chairGrade || ''} 
                      onChange={async (e) => {
                        const val = parseInt(e.target.value);
                        await (await import('../lib/firestore/delegates')).updateDelegate(d.id, { chairGrade: isNaN(val) ? null : val });
                      }}
                    />
                  </td>
                  <td>
                    <select 
                      className="input input-sm"
                      value={d.awardsCategory || 'none'}
                      onChange={async (e) => {
                        await (await import('../lib/firestore/delegates')).updateDelegate(d.id, { awardsCategory: e.target.value as any });
                      }}
                    >
                      <option value="none">No Award</option>
                      <option value="best">Best Delegate</option>
                      <option value="outstanding">Outstanding Delegate</option>
                      <option value="honorable">Honorable Mention</option>
                      <option value="verbal">Verbal Commendation</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reports-section">
        <h2 className="section-title flex items-center gap-2 mb-3"><Mic size={16} /> Delegate Statistics</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Country</th><th>Bloc</th><th>Speeches</th>
                <th>Speech Time</th><th>POIs</th><th>Motions</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {[...delegates].sort((a,b)=>b.engagementScore-a.engagementScore).map(d => (
                <tr key={d.id}>
                  <td>{d.country}</td>
                  <td className="text-muted text-sm">{d.bloc||'—'}</td>
                  <td className="mono">{d.speechCount}</td>
                  <td className="mono">{fmtTime(d.totalSpeechSeconds)}</td>
                  <td className="mono">{d.poiAskedCount}/{d.poiAnsweredCount}</td>
                  <td className="mono">{d.motionCount}</td>
                  <td className="mono font-bold" style={{color:'var(--accent)'}}>{d.engagementScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="reports-section grid md:grid-cols-2 gap-6">
        <div className="report-card">
          <h2 className="section-title flex items-center gap-2 mb-3"><FileText size={16} /> Chair Rulings Log</h2>
          <div className="table-wrap">
            <p className="text-xs text-muted p-4 italic">A formal record of all procedural rulings and interpretations made during this session.</p>
          </div>
        </div>
        <div className="report-card">
          <h2 className="section-title flex items-center gap-2 mb-3"><Activity size={16} /> Participation Patterns</h2>
          <div className="table-wrap">
             <p className="text-xs text-muted p-4 italic">Analysis of delegate engagement patterns, including procedural vs substantive participation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

