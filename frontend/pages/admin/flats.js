import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const emptyForm = { project_id: '', tower: '', floor: '', flat_number: '', area: '', owner_id: '' };

export default function AdminFlats() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [flats, setFlats] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editFlat, setEditFlat] = useState(null);
  const [assignFlat, setAssignFlat] = useState(null);
  const [assignOwnerId, setAssignOwnerId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterProject, setFilterProject] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'admin') { router.push('/'); return; }
      fetchAll();
    }
  }, [user, loading]);

  useEffect(() => { if (user) fetchFlats(); }, [filterProject]);

  const fetchAll = async () => {
    await Promise.all([fetchFlats(), fetchProjects(), fetchCustomers()]);
  };

  const fetchFlats = async () => {
    try {
      const params = {};
      if (filterProject) params.project_id = filterProject;
      const res = await api.get('/flats', { params });
      setFlats(res.data.data);
    } catch { toast.error('Failed to load flats.'); }
    finally { setFetching(false); }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch {}
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/users?role=customer');
      setCustomers(res.data.data);
    } catch {}
  };

  const openCreate = () => { setEditFlat(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (f) => {
    setEditFlat(f);
    setForm({ project_id: f.project_id, tower: f.tower || '', floor: f.floor || '', flat_number: f.flat_number, area: f.area || '', owner_id: f.owner_id || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditFlat(null); setForm(emptyForm); };

  const openAssign = (f) => { setAssignFlat(f); setAssignOwnerId(f.owner_id || ''); setShowAssignModal(true); };
  const closeAssign = () => { setShowAssignModal(false); setAssignFlat(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.flat_number) { toast.error('Project and flat number are required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, owner_id: form.owner_id || null };
      if (editFlat) {
        await api.put(`/flats/${editFlat.id}`, payload);
        toast.success('Flat updated.');
      } else {
        await api.post('/flats', payload);
        toast.success('Flat created.');
      }
      closeModal();
      fetchFlats();
    } catch (err) { toast.error(err?.response?.data?.message || 'Operation failed.'); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      await api.patch(`/flats/${assignFlat.id}/assign-owner`, { owner_id: assignOwnerId || null });
      toast.success('Owner assigned.');
      closeAssign();
      fetchFlats();
    } catch { toast.error('Failed to assign owner.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (f) => {
    if (!confirm(`Delete flat "${f.flat_number}"?`)) return;
    try {
      await api.delete(`/flats/${f.id}`);
      toast.success('Flat deleted.');
      fetchFlats();
    } catch (err) { toast.error(err?.response?.data?.message || 'Delete failed.'); }
  };

  if (loading || fetching) {
    return (
      <Layout title="Flats">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Flats">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Flats</h2>
            <p className="text-sm text-gray-500">{flats.length} flat(s)</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 w-fit">
            <PlusIcon className="w-4 h-4" />
            Add Flat
          </button>
        </div>

        {/* Filter */}
        <div className="card py-3">
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="input-field w-auto text-sm py-1.5">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Flat #</th>
                  <th className="table-th">Tower</th>
                  <th className="table-th">Floor</th>
                  <th className="table-th">Project</th>
                  <th className="table-th">Area (sq.ft)</th>
                  <th className="table-th">Owner</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flats.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No flats found.</td></tr>
                )}
                {flats.map((flat) => (
                  <tr key={flat.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-800">{flat.flat_number}</td>
                    <td className="table-td text-gray-600">{flat.tower || '—'}</td>
                    <td className="table-td text-gray-600">{flat.floor || '—'}</td>
                    <td className="table-td text-gray-600">{flat.project_name}</td>
                    <td className="table-td text-gray-500">{flat.area ? Number(flat.area).toLocaleString() : '—'}</td>
                    <td className="table-td">
                      {flat.owner_name ? (
                        <div>
                          <p className="text-gray-800 font-medium text-xs">{flat.owner_name}</p>
                          <p className="text-gray-400 text-xs">{flat.owner_email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-orange-500 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openAssign(flat)} title="Assign Owner" className="p-1.5 text-green-500 hover:bg-green-50 rounded">
                          <UserIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(flat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(flat)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">{editFlat ? 'Edit Flat' : 'Add New Flat'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="input-field" required>
                  <option value="">— Select project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tower</label>
                  <input type="text" value={form.tower} onChange={(e) => setForm({ ...form, tower: e.target.value })} className="input-field" placeholder="A, B, C..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <input type="text" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className="input-field" placeholder="1, 2, GF..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number *</label>
                  <input type="text" value={form.flat_number} onChange={(e) => setForm({ ...form, flat_number: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq.ft)</label>
                  <input type="number" step="0.01" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Owner</label>
                <select value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })} className="input-field">
                  <option value="">— No owner —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Saving...' : (editFlat ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Owner Modal */}
      {showAssignModal && assignFlat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Assign Owner</h3>
              <button onClick={closeAssign} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Flat: <strong>{assignFlat.project_name} • {assignFlat.tower ? assignFlat.tower + '-' : ''}{assignFlat.flat_number}</strong>
            </p>
            <select value={assignOwnerId} onChange={(e) => setAssignOwnerId(e.target.value)} className="input-field mb-4">
              <option value="">— Remove owner —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={closeAssign} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAssign} disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
