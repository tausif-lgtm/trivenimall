import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Fashion', 'Electronics', 'Entertainment', 'Services', 'Others'];
const empty = { store_name: '', floor: '', unit_number: '', category: 'Others', contact_person: '', designation: '', mobile: '', email: '' };

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data.data);
    } catch { toast.error('Failed to load stores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/stores/${editId}`, form);
        toast.success('Store updated');
      } else {
        await api.post('/stores', form);
        toast.success('Store created');
      }
      setShowForm(false); setForm(empty); setEditId(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (s) => {
    setForm({ store_name: s.store_name, floor: s.floor || '', unit_number: s.unit_number || '', category: s.category, contact_person: s.contact_person || '', designation: s.designation || '', mobile: s.mobile || '', email: s.email || '' });
    setEditId(s.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this store?')) return;
    try { await api.delete(`/stores/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Error deleting'); }
  };

  const catColor = { Food: 'bg-yellow-100 text-yellow-700', Fashion: 'bg-pink-100 text-pink-700', Electronics: 'bg-blue-100 text-blue-700', Entertainment: 'bg-purple-100 text-purple-700', Services: 'bg-green-100 text-green-700', Others: 'bg-gray-100 text-gray-700' };

  return (
    <Layout title="Stores / Tenants">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Stores & Tenants</h2>
          <p className="text-sm text-gray-500">{stores.length} stores registered</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">+ Add Store</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">{editId ? 'Edit Store' : 'Add Store'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Store Name *</label>
                  <input value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} required className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Floor</label>
                  <input value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ground Floor" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Unit No.</label>
                  <input value={form.unit_number} onChange={e => setForm({ ...form, unit_number: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="GF-01" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Person</label>
                  <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Designation</label>
                  <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Manager" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Mobile</label>
                  <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Store Name', 'Floor / Unit', 'Category', 'Contact', 'Mobile', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.store_name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.floor} {s.unit_number && `· ${s.unit_number}`}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${catColor[s.category] || 'bg-gray-100 text-gray-700'}`}>{s.category}</span></td>
                  <td className="px-4 py-3 text-gray-600">{s.contact_person || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.mobile || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!stores.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No stores found. Add your first store.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
