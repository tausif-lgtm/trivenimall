import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, BarChart, Bar, Cell, Area, AreaChart
} from 'recharts';

const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa'];

function StatCard({ label, value, sub, color = 'indigo', icon }) {
  const colors = {
    indigo: 'bg-indigo-600',
    cyan: 'bg-cyan-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
  };
  return (
    <div className="bg-[#1e2433] rounded-xl p-5 flex items-center gap-4 border border-[#2a3347]">
      <div className={`${colors[color]} w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PeriodCard({ label, date, total, pct, current }) {
  const up = pct >= 0;
  return (
    <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-4">
      <div className="flex justify-between items-start mb-1">
        <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
        <p className="text-gray-500 text-xs">{date}</p>
      </div>
      <p className="text-white text-2xl font-bold">{Number(total).toLocaleString()}</p>
      <p className={`text-xs mt-1 flex items-center gap-1 ${up ? 'text-red-400' : 'text-green-400'}`}>
        <span>{up ? '↑' : '↓'} {Math.abs(pct)}% vs current</span>
      </p>
    </div>
  );
}

export default function FootfallPage() {
  const [analytics, setAnalytics] = useState(null);
  const [gates, setGates] = useState([]);
  const [fromDate, setFromDate] = useState(yesterday);
  const [toDate, setToDate] = useState(yesterday);
  const [selectedGate, setSelectedGate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ footfall_date: today, gate_name: '', time_slot: '', count: '', source: 'mall' });
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from_date: fromDate, to_date: toDate });
      if (selectedGate) params.set('gate_name', selectedGate);
      const res = await api.get(`/footfall/analytics?${params}`);
      setAnalytics(res.data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  const loadGates = async () => {
    try { const r = await api.get('/footfall/gates'); setGates(r.data.data); } catch {}
  };

  useEffect(() => { loadGates(); }, []);
  useEffect(() => { load(); }, [fromDate, toDate, selectedGate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) { toast.error('Select a file'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', uploadFile);
      const res = await api.post('/footfall/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message);
      if (res.data.errors?.length) toast.error(`Errors: ${res.data.errors.join(', ')}`);
      setShowUpload(false); setUploadFile(null); load(); loadGates();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/footfall', form);
      toast.success('Entry added');
      setShowForm(false);
      setForm({ footfall_date: today, gate_name: '', time_slot: '', count: '', source: 'mall' });
      load(); loadGates();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const avg = analytics?.hourly?.length
    ? Math.round(analytics.hourly.reduce((s, h) => s + Number(h.total), 0) / analytics.hourly.length)
    : 0;

  const chartData = (analytics?.hourly?.map(h => ({ slot: h.time_slot, Footfall: Number(h.total) })) || [])
    .filter(d => { const hr = parseInt(d.slot); return hr >= 10 && hr <= 22; });

  return (
    <div className="min-h-screen bg-[#0f1623]">
      <Layout title="">
        <div className="-m-4 lg:-m-6 bg-[#0f1623] min-h-screen p-4 lg:p-6">

          {/* Header */}
          <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Showing data for <span className="text-indigo-400 font-medium">{fromDate}{fromDate !== toDate ? ` → ${toDate}` : ''}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Entry</button>
              <button onClick={() => setShowUpload(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">⬆ Bulk Upload CSV</button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center mb-6">
            <span className="text-gray-400 text-sm flex items-center gap-1.5">⚙ Filters</span>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-gray-500 text-xs mb-1">From Date</p>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <span className="text-gray-600 mt-4">→</span>
              <div>
                <p className="text-gray-500 text-xs mb-1">To Date</p>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Gate</p>
              <select value={selectedGate} onChange={e => setSelectedGate(e.target.value)} className="bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-1.5 text-sm">
                <option value="">All Gates</option>
                {gates.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <button onClick={load} className="mt-4 bg-[#2a3347] hover:bg-[#3a4357] text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
              ↻ Refresh
            </button>
            {loading && <span className="text-indigo-400 text-sm mt-4 animate-pulse">Loading...</span>}
          </div>

          {analytics && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Visitors" value={Number(analytics.total).toLocaleString()} sub={fromDate} color="indigo" icon="👤" />
                <StatCard label="Peak Hour" value={analytics.peak_hour?.slot || '—'} sub={analytics.peak_hour ? `${Number(analytics.peak_hour.count).toLocaleString()} visitors` : ''} color="cyan" icon="🕐" />
                <StatCard label="Active Gates" value={analytics.active_gates} sub="Gates with data" color="purple" icon="🏛" />
                <StatCard label="Time Slots" value={analytics.time_slots} sub="Hours tracked" color="green" icon="📊" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Hourly Trend */}
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-white font-semibold">Hourly Footfall Trend</h3>
                      <p className="text-gray-500 text-xs">Visitor count by time slot</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-indigo-400">● Footfall</span>
                  </div>
                  <div className="flex gap-4 mt-2 mb-4">
                    {analytics.peak_hour && <div><p className="text-yellow-400 text-xs">● Peak</p><p className="text-white text-sm font-semibold">{Number(analytics.peak_hour.count).toLocaleString()} @ {analytics.peak_hour.slot}</p></div>}
                    <div><p className="text-green-400 text-xs">● Average</p><p className="text-white text-sm font-semibold">{avg.toLocaleString()}</p></div>
                    <div><p className="text-indigo-400 text-xs">● Total</p><p className="text-white text-sm font-semibold">{Number(analytics.total).toLocaleString()}</p></div>
                  </div>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="footfallGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
                        <XAxis dataKey="slot" tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid #2a3347', borderRadius: 8, color: '#fff' }} />
                        {avg > 0 && <ReferenceLine y={avg} stroke="#22d3ee" strokeDasharray="4 4" label={{ value: 'Average', fill: '#22d3ee', fontSize: 10 }} />}
                        <Area type="monotone" dataKey="Footfall" stroke="#6366f1" strokeWidth={2} fill="url(#footfallGrad)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-600">No hourly data (add time_slot to entries)</div>
                  )}
                </div>

                {/* Gate Comparison */}
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold">Gate-wise Comparison</h3>
                      <p className="text-gray-500 text-xs">Total visitors per gate</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-cyan-400">● Total</span>
                  </div>
                  {analytics.by_gate?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.by_gate.map(g => ({ gate: g.gate, Total: Number(g.total) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
                        <XAxis dataKey="gate" tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid #2a3347', borderRadius: 8, color: '#fff' }} />
                        <Bar dataKey="Total" radius={[4, 4, 0, 0]}>
                          {analytics.by_gate.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-600">No gate data</div>
                  )}
                </div>
              </div>

              {/* Period Comparison */}
              {analytics.period_comparison && (
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">📊 Period Comparison</h3>
                    <span className="text-gray-500 text-sm">Current: {Number(analytics.total).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PeriodCard label="Yesterday" {...analytics.period_comparison.yesterday} current={analytics.total} />
                    <PeriodCard label="Last Week Same Day" {...analytics.period_comparison.last_week_same_day} current={analytics.total} />
                    <PeriodCard label="Last Month Same Day" {...analytics.period_comparison.last_month_same_day} current={analytics.total} />
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2a3347] flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold">Hourly Data Table</h3>
                    <p className="text-gray-500 text-xs">{analytics.table_data?.length || 0} records found across all gates</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a3347]">
                        {['#', 'Gate Name', 'Date', 'Time Range', 'Footfall', '% of Total'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2030]">
                      {(analytics.table_data || []).map((row, i) => (
                        <tr key={row.id} className="hover:bg-[#161d2d] transition-colors">
                          <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                            {row.gate_name}
                          </td>
                          <td className="px-4 py-3 text-gray-400">{row.footfall_date}</td>
                          <td className="px-4 py-3">
                            {row.time_slot ? (
                              <span className="bg-[#2a3347] text-gray-300 px-2 py-0.5 rounded text-xs">{row.time_slot}</span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-white font-semibold">{Number(row.count).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-[#2a3347] rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(row.pct_of_total || 0, 100)}%` }}></div>
                              </div>
                              <span className="text-gray-400 text-xs">{row.pct_of_total}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!analytics.table_data?.length && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">No data for this period. Add entries or upload CSV.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>

      {/* Bulk Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-white text-lg font-bold">Bulk Upload Footfall</h3>
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201/api'}/footfall/sample`} target="_blank" rel="noreferrer" className="text-xs bg-[#2a3347] hover:bg-[#3a4357] text-indigo-400 px-3 py-1.5 rounded-lg flex items-center gap-1">⬇ Sample File</a>
            </div>
            <p className="text-gray-500 text-xs mb-3">Supports <span className="text-indigo-400">.xlsx</span> and <span className="text-indigo-400">.csv</span> files</p>
            <div className="bg-[#0f1623] border border-[#2a3347] rounded-lg p-3 mb-4 text-xs text-gray-400 font-mono">
              <p className="text-gray-500 mb-1"># Columns (row 1 = header, skipped):</p>
              <p className="text-indigo-300">Gate Name | Date | Time Range | Footfall</p>
              <p className="text-gray-500 mt-2 mb-1"># Example rows:</p>
              <p>Main Entrance, 2026-03-16, 10:00-10:59, 420</p>
              <p>LGF Entrance, 2026-03-16, 11:00-11:59, 80</p>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <div
                className="border-2 border-dashed border-[#2a3347] hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <p className="text-2xl mb-1">📁</p>
                <p className="text-gray-300 text-sm font-medium">{uploadFile ? `✓ ${uploadFile.name}` : 'Click to select file'}</p>
                <p className="text-gray-600 text-xs mt-1">Excel (.xlsx) or CSV (.csv)</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" onChange={e => setUploadFile(e.target.files[0])} className="hidden" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={uploading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
                  {uploading ? 'Uploading...' : '⬆ Upload'}
                </button>
                <button type="button" onClick={() => { setShowUpload(false); setUploadFile(null); }} className="flex-1 bg-[#2a3347] text-gray-300 py-2.5 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-2xl w-full max-w-md p-6">
            <h3 className="text-white text-lg font-bold mb-4">Add Footfall Entry</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Date *</label>
                  <input type="date" value={form.footfall_date} onChange={e => setForm({ ...form, footfall_date: e.target.value })} required className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm">
                    <option value="mall">Mall</option>
                    <option value="store">Store</option>
                    <option value="parking">Parking</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Gate Name</label>
                  <input value={form.gate_name} onChange={e => setForm({ ...form, gate_name: e.target.value })} placeholder="e.g. Main Entrance" className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Time Slot</label>
                  <input value={form.time_slot} onChange={e => setForm({ ...form, time_slot: e.target.value })} placeholder="10:00-10:59" className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600" />
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">Count *</label>
                  <input type="number" min="0" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} required placeholder="0" className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold">Save Entry</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-[#2a3347] text-gray-300 py-2.5 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
