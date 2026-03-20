import { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201/api';

export default function VisitorForm() {
  const [form, setForm] = useState({ name: '', mobile: '', age_group: '26-35', visit_type: 'Shopping' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.mobile.length !== 10) { toast.error('Enter valid 10-digit mobile number'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/visitors`, form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
          <p className="text-gray-500 text-sm">Enjoy your visit to Alcove Triveni Mall.</p>
          <p className="text-orange-600 font-semibold mt-4">Happy Shopping!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4 py-8">
      <Toaster />
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl">🏬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome to Alcove Triveni Mall</h1>
          <p className="text-gray-500 text-sm mt-1">Quick check-in for free WiFi access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              placeholder="Enter your name"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number *</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/, '') }))}
              required
              maxLength={10}
              placeholder="10-digit number"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age Group <span className="text-gray-400 font-normal">(optional)</span></label>
            <select value={form.age_group} onChange={e => setForm(f => ({ ...f, age_group: e.target.value }))} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              {['Under 18', '18-25', '26-35', '36-50', '50+'].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">I'm here for</label>
            <div className="grid grid-cols-2 gap-2">
              {[['Shopping', '🛍'], ['Food', '🍔'], ['Timepass', '😄'], ['Work', '💼']].map(([t, icon]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, visit_type: t }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${form.visit_type === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                >
                  {icon} {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60 mt-2"
          >
            {loading ? 'Connecting...' : 'Connect to WiFi →'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">© Alcove Triveni Mall · Your data is secure</p>
      </div>
    </div>
  );
}
