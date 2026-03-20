import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#f43f5e', '#22d3ee', '#a78bfa'];

function StarRating({ value }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`text-sm ${n <= value ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{value}/5</span>
    </span>
  );
}

function RatingCard({ label, value }) {
  const v = Number(value) || 0;
  return (
    <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-4">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{v > 0 ? v.toFixed(1) : '—'}</p>
      <div className="flex gap-0.5 mt-1">
        {[1,2,3,4,5].map(n => (
          <span key={n} className={`text-sm ${n <= Math.round(v) ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [analytics, setAnalytics] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [tab, setTab] = useState('analytics');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, lRes] = await Promise.all([
        api.get(`/feedback/analytics?from_date=${fromDate}&to_date=${toDate}`),
        api.get(`/feedback?from_date=${fromDate}&to_date=${toDate}`)
      ]);
      setAnalytics(aRes.data.data);
      setFeedbackList(lRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [fromDate, toDate]);

  const ratingFields = [
    { key: 'avg_cleanliness', label: 'Cleanliness' },
    { key: 'avg_ac', label: 'AC / Cooling' },
    { key: 'avg_lighting', label: 'Lighting' },
    { key: 'avg_ambience', label: 'Ambience' },
  ];

  return (
    <div className="min-h-screen bg-[#0f1623]">
      <Layout title="">
        <div className="-m-4 lg:-m-6 bg-[#0f1623] min-h-screen p-4 lg:p-6">

          {/* Header */}
          <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">Customer Feedback</h1>
              <p className="text-gray-500 text-sm">QR-based feedback analytics</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-[#1e2433] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm" />
              <span className="text-gray-600">→</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-[#1e2433] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#1e2433] border border-[#2a3347] rounded-xl p-1 w-fit mb-6">
            {[['analytics', '📊 Analytics'], ['responses', '📋 Responses']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>{l}</button>
            ))}
          </div>

          {loading && <div className="text-indigo-400 text-sm animate-pulse mb-4">Loading...</div>}

          {tab === 'analytics' && (
            <>
              {analytics ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-[#1e2433] border border-orange-500/40 rounded-xl p-4">
                      <p className="text-orange-400 text-xs uppercase tracking-wider mb-1">Total Responses</p>
                      <p className="text-white text-3xl font-bold">{analytics.averages?.total_responses || 0}</p>
                    </div>
                    <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-4">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Overall Rating</p>
                      <p className="text-white text-3xl font-bold">{analytics.averages?.avg_overall ? Number(analytics.averages.avg_overall).toFixed(1) : '—'}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={`text-sm ${n <= Math.round(analytics.averages?.avg_overall || 0) ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {ratingFields.map(f => (
                      <RatingCard key={f.key} label={f.label} value={analytics.averages?.[f.key]} />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {/* Visit Category Chart */}
                    <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                      <h3 className="text-white font-semibold mb-4">Visits by Category</h3>
                      {(analytics.by_category?.length || 0) > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={analytics.by_category}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
                            <XAxis dataKey="visit_category" tick={{ fill: '#6b7280', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid #2a3347', borderRadius: 8, color: '#fff' }} />
                            <Bar dataKey="count" radius={[4,4,0,0]}>
                              {analytics.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-44 flex items-center justify-center text-gray-600">No data yet</div>
                      )}
                    </div>

                    {/* Top Brands */}
                    <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl p-5">
                      <h3 className="text-white font-semibold mb-4">Most Requested Brands</h3>
                      {(analytics.top_brands?.length || 0) > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {analytics.top_brands.map((b, i) => (
                            <div key={b.brand} className="flex items-center gap-3">
                              <span className="text-xs text-gray-600 w-5">{i + 1}</span>
                              <span className="flex-1 text-sm capitalize text-gray-300">{b.brand}</span>
                              <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full font-medium">{b.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-44 flex items-center justify-center text-gray-600">No brand requests yet</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                !loading && <div className="text-center py-16 text-gray-600">No feedback data found for this period.</div>
              )}
            </>
          )}

          {tab === 'responses' && (
            <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3347]">
                <h3 className="text-white font-semibold">Feedback Responses ({feedbackList.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3347]">
                      {['Date', 'Mobile', 'Category', 'Overall', 'Clean', 'AC', 'Light', 'Ambience', 'Brands Requested'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2030]">
                    {feedbackList.map(f => (
                      <tr key={f.id} className="hover:bg-[#161d2d]">
                        <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-2.5 text-gray-300">{f.mobile || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-300">{f.visit_category}</td>
                        <td className="px-3 py-2.5"><StarRating value={f.rating_overall} /></td>
                        <td className="px-3 py-2.5 text-center text-gray-300">{f.rating_cleanliness}</td>
                        <td className="px-3 py-2.5 text-center text-gray-300">{f.rating_ac}</td>
                        <td className="px-3 py-2.5 text-center text-gray-300">{f.rating_lighting}</td>
                        <td className="px-3 py-2.5 text-center text-gray-300">{f.rating_ambience}</td>
                        <td className="px-3 py-2.5 text-gray-400 max-w-xs truncate">{f.brands_requested || '—'}</td>
                      </tr>
                    ))}
                    {!feedbackList.length && !loading && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-600">No feedback in this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}
