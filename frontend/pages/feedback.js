import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201/api';

function StarInput({ label, name, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(name, n)}
            className={`text-2xl leading-none transition-transform hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-gray-200'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackForm() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    rating_overall: 5,
    rating_cleanliness: 5,
    rating_ac: 5,
    rating_lighting: 5,
    rating_ambience: 5,
    rating_toilet: 5,
    brands_requested: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const setRating = (name, val) => setForm(f => ({ ...f, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/feedback`, form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm">Your feedback helps us serve you better.</p>
          <p className="text-orange-600 font-semibold mt-4">Alcove Triveni Mall</p>
          <button onClick={() => setSubmitted(false)} className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline">Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <Toaster />
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Alcove Triveni Mall" width={80} height={80} className="rounded-2xl shadow-lg object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Alcove Triveni Mall</h1>
          <p className="text-gray-500 text-sm mt-1">Share your experience with us</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Ratings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rate your experience (1–5 ★)</label>
            <div className="bg-gray-50 rounded-xl px-4 py-2">
              <StarInput label="Overall Experience" name="rating_overall" value={form.rating_overall} onChange={setRating} />
              <StarInput label="Cleanliness" name="rating_cleanliness" value={form.rating_cleanliness} onChange={setRating} />
              <StarInput label="AC / Cooling" name="rating_ac" value={form.rating_ac} onChange={setRating} />
              <StarInput label="Lighting" name="rating_lighting" value={form.rating_lighting} onChange={setRating} />
              <StarInput label="Ambience" name="rating_ambience" value={form.rating_ambience} onChange={setRating} />
              <StarInput label="Toilet Hygiene" name="rating_toilet" value={form.rating_toilet} onChange={setRating} />
            </div>
          </div>

          {/* Brand Requests */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Which brands would you like to see at Alcove Triveni Mall?</label>
            <textarea
              value={form.brands_requested}
              onChange={e => setForm(f => ({ ...f, brands_requested: e.target.value }))}
              rows={2}
              placeholder="e.g. Zara, McDonald's, H&M..."
              className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">© Alcove Triveni Mall · Your privacy is protected</p>
      </div>
    </div>
  );
}
