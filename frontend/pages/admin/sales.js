import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#f43f5e', '#22d3ee', '#a78bfa', '#fb923c'];

const OUTLET_TYPES = ['Food & Beverage', 'Fashion & Apparel', 'Electronics', 'Entertainment', 'Services', 'Hypermarket', 'Jewellery', 'Others'];

function PeriodCard({ label, data }) {
  if (!data) return null;
  const up = data.pct >= 0;
  return (
    <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-4">
      <div className="flex justify-between items-start mb-1">
        <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
        <p className="text-gray-500 text-xs">{data.date}</p>
      </div>
      <p className="text-white text-2xl font-bold">{fmt(data.total)}</p>
      <p className={`text-xs mt-1 ${up ? 'text-red-400' : 'text-green-400'}`}>
        {up ? '↑' : '↓'} {Math.abs(data.pct)}% vs current
      </p>
    </div>
  );
}

export default function SalesPage() {
  const [summary, setSummary] = useState({ mall_total: 0, cash_total: 0, online_total: 0, by_store: [], daily: [], by_category: [], period_comparison: null });
  const [salesList, setSalesList] = useState([]);
  const [stores, setStores] = useState([]);
  const [fromDate, setFromDate] = useState(yesterday);
  const [toDate, setToDate] = useState(yesterday);
  const [tab, setTab] = useState('dashboard');
  const [showEntry, setShowEntry] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ store_id: '', outlet_type: '', sale_date: today, cash_amount: '', online_amount: '', notes: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const loadSummary = async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        api.get(`/sales/summary?from_date=${fromDate}&to_date=${toDate}`),
        api.get(`/sales?from_date=${fromDate}&to_date=${toDate}`)
      ]);
      setSummary(sRes.data.data);
      setSalesList(lRes.data.data);
    } catch (err) { toast.error(err?.response?.data?.message || err?.message || 'Failed to load sales data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { api.get('/stores').then(r => setStores(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { loadSummary(); }, [fromDate, toDate]);

  const handleEntry = async (e) => {
    e.preventDefault();
    if (!form.store_id) { toast.error('Select an outlet'); return; }
    const total = (parseFloat(form.cash_amount) || 0) + (parseFloat(form.online_amount) || 0);
    if (total <= 0) { toast.error('Enter cash or online amount'); return; }
    try {
      await api.post('/sales', form);
      toast.success('Sales entry saved!');
      setShowEntry(false);
      setForm({ store_id: '', outlet_type: '', sale_date: today, cash_amount: '', online_amount: '', notes: '' });
      loadSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) { toast.error('Select a file'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', uploadFile);
      const res = await api.post('/sales/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message);
      if (res.data.errors?.length) toast.error(`Errors: ${res.data.errors[0]}`);
      setShowUpload(false); setUploadFile(null); loadSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try { await api.delete(`/sales/${id}`); toast.success('Deleted'); loadSummary(); }
    catch { toast.error('Error'); }
  };

  const topStore = summary.by_store[0];
  const dailyData = summary.daily.map(d => ({ date: d.sale_date?.slice(5), Cash: Number(d.cash || 0), Online: Number(d.online || 0), Total: Number(d.total) }));

  return (
    <div className="min-h-screen bg-[#0f1623]">
      <Layout title="">
        <div className="-m-4 lg:-m-6 bg-[#0f1623] min-h-screen p-4 lg:p-6">

          {/* Header */}
          <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">Sales Reports</h1>
              <p className="text-gray-500 text-sm">Alcove Triveni Mall · Revenue Tracking</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-[#1e2433] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm" />
              <span className="text-gray-600">→</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-[#1e2433] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm" />
              <button onClick={() => setShowEntry(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Entry</button>
              <button onClick={() => setShowUpload(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">⬆ Bulk Upload</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#1e2433] border border-[#2a3347] rounded-xl p-1 w-fit mb-6">
            {[['dashboard', '📊 Dashboard'], ['data', '📋 Sales Data']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>{l}</button>
            ))}
          </div>

          {tab === 'dashboard' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Total Revenue</p>
                  <p className="text-orange-400 text-2xl font-bold mt-1">{fmt(summary.mall_total)}</p>
                  {loading && <p className="text-gray-600 text-xs mt-1 animate-pulse">Loading...</p>}
                </div>
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Cash Sales</p>
                  <p className="text-green-400 text-2xl font-bold mt-1">{fmt(summary.cash_total || 0)}</p>
                </div>
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Online Sales</p>
                  <p className="text-blue-400 text-2xl font-bold mt-1">{fmt(summary.online_total || 0)}</p>
                </div>
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Top Outlet</p>
                  <p className="text-white text-base font-bold mt-1 truncate">{topStore?.store_name || '—'}</p>
                  {topStore && <p className="text-green-400 text-xs mt-0.5">{fmt(topStore.total)}</p>}
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4">Daily Revenue — Cash vs Online</h3>
                  {dailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid #2a3347', borderRadius: 8, color: '#fff' }} formatter={v => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                        <Bar dataKey="Cash" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Online" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-44 flex items-center justify-center text-gray-600">No data</div>}
                </div>
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4">Revenue by Category</h3>
                  {summary.by_category?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={summary.by_category.map(c => ({ cat: c.category, Revenue: Number(c.total) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
                        <XAxis dataKey="cat" tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid #2a3347', borderRadius: 8, color: '#fff' }} formatter={v => fmt(v)} />
                        <Bar dataKey="Revenue" radius={[4, 4, 0, 0]}>
                          {summary.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-44 flex items-center justify-center text-gray-600">No data</div>}
                </div>
              </div>

              {/* Period Comparison */}
              {summary.period_comparison && (
                <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold">📊 Period Comparison</h3>
                    <span className="text-gray-500 text-sm">Current: {fmt(summary.mall_total)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PeriodCard label="Yesterday" data={summary.period_comparison.yesterday} />
                    <PeriodCard label="Last Week Same Day" data={summary.period_comparison.last_week} />
                    <PeriodCard label="Last Month Same Day" data={summary.period_comparison.last_month} />
                  </div>
                </div>
              )}

              {/* Store Table */}
              <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2a3347]">
                  <h3 className="text-white font-semibold">Outlet-wise Revenue</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3347]">
                      {['#', 'Type', 'Name of Outlet', 'Revenue', '% Share'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2030]">
                    {summary.by_store.map((s, i) => (
                      <tr key={i} className="hover:bg-[#161d2d]">
                        <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{s.outlet_type || s.category || '—'}</td>
                        <td className="px-4 py-3 text-white font-medium">{s.store_name}</td>
                        <td className="px-4 py-3 text-orange-400 font-semibold">{fmt(s.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#2a3347] rounded-full h-1.5">
                              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(s.pct || 0, 100)}%` }}></div>
                            </div>
                            <span className="text-gray-400 text-xs">{s.pct || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!summary.by_store.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">No data. Add entries or upload CSV.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'data' && (
            <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3347] flex justify-between items-center">
                <h3 className="text-white font-semibold">Sales Data ({salesList.length} records)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3347]">
                      {['#', 'Type', 'Name of Outlet', 'Sale Date', 'Cash', 'Online', 'Total', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2030]">
                    {salesList.map((s, i) => (
                      <tr key={s.id} className="hover:bg-[#161d2d]">
                        <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-400">{s.outlet_type || s.category || '—'}</td>
                        <td className="px-4 py-3 text-white font-medium">{s.store_name}</td>
                        <td className="px-4 py-3 text-gray-300">{s.sale_date}</td>
                        <td className="px-4 py-3 text-green-400">{s.cash_amount > 0 ? fmt(s.cash_amount) : '—'}</td>
                        <td className="px-4 py-3 text-blue-400">{s.online_amount > 0 ? fmt(s.online_amount) : '—'}</td>
                        <td className="px-4 py-3 text-orange-400 font-semibold">{fmt(s.revenue)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {!salesList.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-600">No records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Layout>

      {/* Bulk Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-white text-lg font-bold">Bulk Upload Sales</h3>
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201/api'}/sales/sample`} target="_blank" rel="noreferrer" className="text-xs bg-[#2a3347] hover:bg-[#3a4357] text-orange-400 px-3 py-1.5 rounded-lg flex items-center gap-1">⬇ Sample File</a>
            </div>
            <p className="text-gray-500 text-xs mb-3">Supports <span className="text-orange-400">.xlsx</span> and <span className="text-orange-400">.csv</span> files</p>
            <div className="bg-[#0f1623] border border-[#2a3347] rounded-lg p-3 mb-4 font-mono text-xs text-gray-400">
              <p className="text-gray-500 mb-1"># Columns (row 1 = header, skipped):</p>
              <p className="text-orange-300">Type | Name of Outlet | Sale Date | Cash Amount | Online Amount</p>
              <p className="text-gray-500 mt-2 mb-1"># Example rows:</p>
              <p>Food & Beverage, Dominos Pizza, 2026-03-16, 25000, 20000</p>
              <p>Fashion & Apparel, H&M, 2026-03-16, 70000, 50000</p>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <div className="border-2 border-dashed border-[#2a3347] hover:border-orange-500 rounded-xl p-6 text-center cursor-pointer transition-colors" onClick={() => fileRef.current?.click()}>
                <p className="text-2xl mb-1">📁</p>
                <p className="text-gray-300 text-sm font-medium">{uploadFile ? `✓ ${uploadFile.name}` : 'Click to select file'}</p>
                <p className="text-gray-600 text-xs mt-1">Excel (.xlsx) or CSV (.csv)</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" onChange={e => setUploadFile(e.target.files[0])} className="hidden" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={uploading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">{uploading ? 'Uploading...' : '⬆ Upload'}</button>
                <button type="button" onClick={() => { setShowUpload(false); setUploadFile(null); }} className="flex-1 bg-[#2a3347] text-gray-300 py-2.5 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-2xl w-full max-w-md p-6">
            <h3 className="text-white text-lg font-bold mb-4">Add Sales Entry</h3>
            <form onSubmit={handleEntry} className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Type (Outlet Category)</label>
                <select value={form.outlet_type} onChange={e => setForm({ ...form, outlet_type: e.target.value })} className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Select Type --</option>
                  {OUTLET_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Name of Outlet *</label>
                <select value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })} required className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Select Outlet --</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Sale Date *</label>
                <input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} required className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Cash Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.cash_amount} onChange={e => setForm({ ...form, cash_amount: e.target.value })} placeholder="0.00" className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Online Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.online_amount} onChange={e => setForm({ ...form, online_amount: e.target.value })} placeholder="0.00" className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600" />
                </div>
              </div>
              <div className="bg-[#0f1623] border border-[#2a3347] rounded-lg px-4 py-2 flex justify-between items-center">
                <span className="text-gray-500 text-xs">Total</span>
                <span className="text-orange-400 font-bold">{`₹${((parseFloat(form.cash_amount) || 0) + (parseFloat(form.online_amount) || 0)).toLocaleString('en-IN')}`}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold">Save Entry</button>
                <button type="button" onClick={() => setShowEntry(false)} className="flex-1 bg-[#2a3347] text-gray-300 py-2.5 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
