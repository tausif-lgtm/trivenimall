import { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201/api';

export default function ParkingEntry() {
  const [form, setForm] = useState({ vehicle_number: '', mobile: '', vehicle_type: '4-Wheeler' });
  const [loading, setLoading] = useState(false);
  const [lastEntry, setLastEntry] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobile || form.mobile.length < 10) { toast.error('Valid mobile number required'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/parking`, form);
      toast.success('Entry recorded!');
      setLastEntry({ ...form, id: res.data.id, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) });
      setForm({ vehicle_number: '', mobile: '', vehicle_type: '4-Wheeler' });
      // Focus back to vehicle number for fast next entry
      setTimeout(() => document.getElementById('vnum')?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording entry');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-6">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🅿️</div>
          <h1 className="text-xl font-bold text-white">Parking Entry</h1>
          <p className="text-gray-400 text-sm">Alcove Triveni Mall</p>
        </div>

        {lastEntry && (
          <div className="bg-green-800 border border-green-600 rounded-xl p-4 mb-4 text-center">
            <p className="text-green-300 text-sm font-medium">✓ Entry Recorded at {lastEntry.time}</p>
            <p className="text-white font-bold">{lastEntry.vehicle_number || 'No plate'} · {lastEntry.mobile}</p>
            <p className="text-green-400 text-xs">{lastEntry.vehicle_type}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Vehicle Number <span className="text-gray-500 font-normal">(optional)</span></label>
            <input
              id="vnum"
              value={form.vehicle_number}
              onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value.toUpperCase() }))}
              placeholder="e.g. WB02AB1234"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500 uppercase"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Mobile Number *</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/, '') }))}
              required
              maxLength={10}
              placeholder="10-digit number"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[['2-Wheeler', '🏍'], ['4-Wheeler', '🚗'], ['Others', '🚐']].map(([t, icon]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, vehicle_type: t }))}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${form.vehicle_type === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-orange-400'}`}
                >
                  {icon}<br />{t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-base transition-all disabled:opacity-60 active:scale-95"
          >
            {loading ? '⏳ Recording...' : '✓ RECORD ENTRY'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">Security Staff Portal · Alcove Triveni Mall</p>
      </div>
    </div>
  );
}
