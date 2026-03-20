import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export default function VisitorsPage() {
  const [stats, setStats] = useState({ total: 0, qualified: 0, by_type: [], by_age: [], daily: [] });
  const [visitors, setVisitors] = useState([]);
  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [tab, setTab] = useState('stats');

  const load = async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        api.get(`/visitors/stats?from_date=${fromDate}&to_date=${toDate}`),
        api.get(`/visitors?from_date=${fromDate}&to_date=${toDate}`)
      ]);
      setStats(sRes.data.data);
      setVisitors(lRes.data.data);
    } catch { toast.error('Failed to load visitors'); }
  };

  useEffect(() => { load(); }, [fromDate, toDate]);

  const handleQualify = async (id) => {
    try { await api.patch(`/visitors/${id}/qualify`); toast.success('Marked as qualified'); load(); }
    catch { toast.error('Error'); }
  };

  return (
    <Layout title="Visitor Data">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Visitor Data</h2>
          <p className="text-sm text-gray-500">WiFi-style visitor capture analytics</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Total Visitors</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Qualified</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.qualified || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 col-span-2">
          <p className="text-sm text-gray-500 mb-2">Visit Purpose</p>
          <div className="flex gap-3 flex-wrap">
            {stats.by_type.map(t => (
              <div key={t.visit_type} className="text-center">
                <p className="text-lg font-bold text-gray-800">{t.count}</p>
                <p className="text-xs text-gray-500">{t.visit_type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {['stats', 'list'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>{t === 'stats' ? 'Charts' : 'Visitor List'}</button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Daily Visitors</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="visit_date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ea580c" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Age Group Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.by_age} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="age_group" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="#fb923c" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Mobile', 'Age Group', 'Visit Type', 'Date', 'Qualified', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                  <td className="px-4 py-3">{v.mobile}</td>
                  <td className="px-4 py-3 text-gray-600">{v.age_group}</td>
                  <td className="px-4 py-3 text-gray-600">{v.visit_type}</td>
                  <td className="px-4 py-3 text-gray-500">{v.visit_date}</td>
                  <td className="px-4 py-3">
                    {v.is_qualified ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Yes</span> : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    {!v.is_qualified && <button onClick={() => handleQualify(v.id)} className="text-green-600 hover:underline text-xs">Mark Qualified</button>}
                  </td>
                </tr>
              ))}
              {!visitors.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No visitors for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
