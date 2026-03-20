import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import {
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ROLE_OPTIONS = [
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'technician',   label: 'Technician' },
  { value: 'security',     label: 'Security' },
  { value: 'maintenance',  label: 'Maintenance' },
  { value: 'operations',   label: 'Operations' },
  { value: 'staff',        label: 'All Staff' },
];

export default function NewChecklist() {
  const router = useRouter();
  const { id } = router.query; // if id present → edit mode
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    frequency_day: '',
    assign_type: 'staff',
    assigned_staff_id: '',
    assigned_role: '',
  });
  const [items, setItems] = useState(['', '', '']);
  const [staffList, setStaffList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/users/staff').then(r => setStaffList(r.data.data || [])).catch(() => {});
    if (isEdit) {
      api.get(`/checklists/templates/${id}`).then(r => {
        const t = r.data.data;
        setForm({
          title: t.title,
          description: t.description || '',
          frequency: t.frequency,
          frequency_day: t.frequency_day !== null ? String(t.frequency_day) : '',
          assign_type: t.assign_type,
          assigned_staff_id: t.assigned_staff_id ? String(t.assigned_staff_id) : '',
          assigned_role: t.assigned_role || '',
        });
        setItems(t.items.length > 0 ? t.items.map(i => i.item_text) : ['', '', '']);
        setLoading(false);
      }).catch(() => { toast.error('Failed to load template.'); router.push('/admin/checklists'); });
    }
  }, [id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addItem = () => setItems(its => [...its, '']);
  const removeItem = (i) => setItems(its => its.filter((_, idx) => idx !== i));
  const updateItem = (i, val) => setItems(its => its.map((it, idx) => idx === i ? val : it));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.trim());
    if (validItems.length === 0) { toast.error('Add at least one checklist item.'); return; }
    if (form.frequency !== 'daily' && form.frequency_day === '')
      { toast.error(`Select the ${form.frequency === 'weekly' ? 'day of week' : 'day of month'} for this frequency.`); return; }

    setSaving(true);
    const payload = {
      ...form,
      frequency_day: form.frequency_day !== '' ? Number(form.frequency_day) : null,
      assigned_staff_id: form.assign_type === 'staff' && form.assigned_staff_id ? Number(form.assigned_staff_id) : null,
      assigned_role: form.assign_type === 'role' ? form.assigned_role : null,
      items: validItems,
    };

    try {
      if (isEdit) {
        await api.put(`/checklists/templates/${id}`, payload);
        toast.success('Checklist updated!');
      } else {
        await api.post('/checklists/templates', payload);
        toast.success('Checklist created!');
      }
      router.push('/admin/checklists');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    }
    setSaving(false);
  };

  if (loading) return (
    <Layout title={isEdit ? 'Edit Checklist' : 'New Checklist'}>
      <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
    </Layout>
  );

  return (
    <Layout title={isEdit ? 'Edit Checklist' : 'New Checklist'}>
      <div className="max-w-2xl">
        <button onClick={() => router.push('/admin/checklists')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Checklists
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-orange-500" />
              Checklist Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Daily Mall Opening Checklist"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={2} placeholder="Optional details..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Schedule Frequency</h2>
            <div className="flex gap-3">
              {['daily','weekly','monthly'].map(f => (
                <button key={f} type="button" onClick={() => { set('frequency', f); set('frequency_day', ''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize
                    ${form.frequency === f ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'}`}>
                  {f}
                </button>
              ))}
            </div>
            {form.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Run on *</label>
                <select value={form.frequency_day} onChange={e => set('frequency_day', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required>
                  <option value="">-- Select day --</option>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            )}
            {form.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Run on day of month *</label>
                <select value={form.frequency_day} onChange={e => set('frequency_day', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required>
                  <option value="">-- Select date --</option>
                  {Array.from({length: 28}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Assign To</h2>
            <div className="flex gap-3">
              {[['staff','Specific Staff'],['role','Role / Specialty']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => { set('assign_type', v); set('assigned_staff_id', ''); set('assigned_role', ''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                    ${form.assign_type === v ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            {form.assign_type === 'staff' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff Member</label>
                <select value={form.assigned_staff_id} onChange={e => set('assigned_staff_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">-- Select staff --</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} {s.specialty ? `(${s.specialty})` : ''}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Role / Specialty</label>
                <select value={form.assigned_role} onChange={e => set('assigned_role', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required={form.assign_type === 'role'}>
                  <option value="">-- Select role --</option>
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">System will assign this checklist to all staff with matching specialty.</p>
              </div>
            )}
          </div>

          {/* Checklist Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Checklist Items *</h2>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium">
                <PlusIcon className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 flex-shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium">{i + 1}</span>
                  <input value={item} onChange={e => updateItem(i, e.target.value)}
                    placeholder={`Item ${i + 1}...`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors">
              + Add another item
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/admin/checklists')}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update Checklist' : 'Create Checklist'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
