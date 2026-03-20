import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];

export default function ParkingPage() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ today: { total_today: 0, currently_parked: 0 }, by_type: [] });
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [activeOnly, setActiveOnly] = useState(false);

  const load = async () => {
    try {
      const [eRes, sRes] = await Promise.all([
        api.get(`/parking?from_date=${fromDate}&to_date=${toDate}${activeOnly ? '&active_only=true' : ''}`),
        api.get('/parking/stats')
      ]);
      setEntries(eRes.data.data);
      setStats(sRes.data.data);
    } catch { toast.error('Failed to load parking data'); }
  };

  useEffect(() => { load(); }, [fromDate, toDate, activeOnly]);

  const handleExit = async (id) => {
    try { await api.patch(`/parking/${id}/exit`); toast.success('Exit recorded'); load(); }
    catch { toast.error('Error'); }
  };

  const typeColor = { '2-Wheeler': 'bg-blue-100 text-blue-700', '4-Wheeler': 'bg-green-100 text-green-700', 'Others': 'bg-gray-100 text-gray-700' };

  return (
    <Layout title="Parking">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Parking Management</h2>
          <p className="text-sm text-gray-500">Today's vehicle tracking</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="rounded" />
            Active only
          </label>
        </div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Today's Entries</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.today?.total_today || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Currently Parked</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.today?.currently_parked || 0}</p>
        </div>
        {stats.by_type?.map(t => (
          <div key={t.vehicle_type} className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">{t.vehicle_type}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{t.count}</p>
          </div>
        ))}
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Parking Entries ({entries.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['#', 'Mobile', 'Vehicle No.', 'Type', 'Entry Time', 'Exit Time', 'Duration', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e, i) => {
                const entry = new Date(e.entry_time);
                const exit = e.exit_time ? new Date(e.exit_time) : null;
                const duration = exit ? Math.round((exit - entry) / 60000) : null;
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{e.mobile}</td>
                    <td className="px-4 py-3 text-gray-600">{e.vehicle_number || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor[e.vehicle_type] || 'bg-gray-100 text-gray-700'}`}>{e.vehicle_type}</span></td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{entry.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{exit ? exit.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-green-600 font-medium">Active</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{duration !== null ? `${duration} min` : '—'}</td>
                    <td className="px-4 py-3">
                      {!e.exit_time && <button onClick={() => handleExit(e.id)} className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs hover:bg-red-200">Exit</button>}
                    </td>
                  </tr>
                );
              })}
              {!entries.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No entries for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
