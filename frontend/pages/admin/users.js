import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const emptyForm = { name: '', email: '', mobile: '', password: '', role: 'staff', specialty: '', designation: '', store_id: '', permissions: [] };

const ALL_PERMISSIONS = [
  { key: 'sales',          label: 'Sales Reports',      group: 'Mall Operations' },
  { key: 'footfall',       label: 'Footfall Tracker',   group: 'Mall Operations' },
  { key: 'feedback',       label: 'Customer Feedback',  group: 'Mall Operations' },
  { key: 'visitors',       label: 'Visitor Data',       group: 'Mall Operations' },
  { key: 'parking',        label: 'Parking',            group: 'Mall Operations' },
  { key: 'stores',         label: 'Stores / Tenants',   group: 'Mall Operations' },
  { key: 'tickets',        label: 'All Tickets',        group: 'Ticketing' },
  { key: 'communications', label: 'Communication',      group: 'Other' },
];

const SPECIALTIES = [
  { value: '',             label: '— None —' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'technician',   label: 'Technician' },
  { value: 'maintenance',  label: 'Maintenance' },
  { value: 'operations',   label: 'Operations' },
  { value: 'security',     label: 'Security Guard' },
  { value: 'general',      label: 'General' },
];

const GROUPS = ['Mall Operations', 'Ticketing', 'Other'];

const ALL_ROLES = [
  { value: 'admin',    label: 'Administrator' },
  { value: 'staff',    label: 'Staff' },
  { value: 'helpdesk', label: 'Help Desk' },
  { value: 'security', label: 'Security Officer' },
  { value: 'tenant',   label: 'Tenant / Retailer' },
  { value: 'customer', label: 'Customer' },
];

const ROLE_LABEL = {
  admin:    'Administrator',
  staff:    'Staff',
  helpdesk: 'Help Desk',
  security: 'Security Officer',
  tenant:   'Tenant / Retailer',
  customer: 'Customer',
};

const ROLE_BADGE = {
  admin:    'bg-red-900/40 text-red-400 border border-red-700/40',
  staff:    'bg-blue-900/40 text-blue-400 border border-blue-700/40',
  helpdesk: 'bg-cyan-900/40 text-cyan-400 border border-cyan-700/40',
  security: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/40',
  tenant:   'bg-purple-900/40 text-purple-400 border border-purple-700/40',
  customer: 'bg-green-900/40 text-green-400 border border-green-700/40',
};

const SPECIALTY_BADGE = {
  housekeeping: 'bg-pink-900/30 text-pink-400',
  technician:   'bg-blue-900/30 text-blue-400',
  maintenance:  'bg-orange-900/30 text-orange-400',
  operations:   'bg-teal-900/30 text-teal-400',
  security:     'bg-yellow-900/30 text-yellow-400',
  general:      'bg-gray-700 text-gray-400',
};

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [stores, setStores] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'admin') { router.push('/'); return; }
      fetchUsers();
      api.get('/stores').then(r => setStores(r.data.data || [])).catch(() => {});
    }
  }, [user, loading]);

  useEffect(() => { if (user) fetchUsers(); }, [filterRole]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      const res = await api.get('/users', { params });
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users.'); }
    finally { setFetching(false); }
  };

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      mobile: u.mobile || '',
      password: '',
      role: u.role,
      specialty: u.specialty || '',
      designation: u.designation || '',
      store_id: u.store_id ? String(u.store_id) : '',
      permissions: Array.isArray(u.permissions) ? u.permissions : [],
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditUser(null); setForm(emptyForm); };

  const togglePerm = (key) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const selectAll = () => setForm(f => ({ ...f, permissions: ALL_PERMISSIONS.map(p => p.key) }));
  const clearAll  = () => setForm(f => ({ ...f, permissions: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email are required.'); return; }
    if (!editUser && !form.password) { toast.error('Password is required for new users.'); return; }

    setSaving(true);
    try {
      const payload = {
        name:        form.name,
        email:       form.email,
        mobile:      form.mobile,
        role:        form.role,
        specialty:   form.role === 'staff' ? (form.specialty || null) : null,
        designation: form.designation || null,
        store_id:    form.store_id ? Number(form.store_id) : null,
        permissions: form.role === 'staff' ? (form.permissions.length > 0 ? form.permissions : null) : null,
      };
      if (!editUser) payload.password = form.password;

      if (editUser) {
        await api.put(`/users/${editUser.id}`, payload);
        toast.success('User updated.');
      } else {
        await api.post('/users', payload);
        toast.success('User created.');
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Operation failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('User deleted.');
      fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Delete failed.'); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#0f1623] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1623]">
      <Layout title="">
        <div className="-m-4 lg:-m-6 bg-[#0f1623] min-h-screen p-4 lg:p-6">

          {/* Header */}
          <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">User Management</h1>
              <p className="text-gray-500 text-sm">{users.length} user(s) · Manage roles, specialties and permissions</p>
            </div>
            <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> Add User
            </button>
          </div>

          {/* Role Filter */}
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center mb-6">
            <span className="text-gray-400 text-sm mr-1">Filter:</span>
            <button onClick={() => setFilterRole('')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterRole === '' ? 'bg-orange-500 text-white' : 'bg-[#2a3347] text-gray-400 hover:text-white'}`}>
              All
            </button>
            {ALL_ROLES.map(r => (
              <button key={r.value} onClick={() => setFilterRole(r.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterRole === r.value ? 'bg-orange-500 text-white' : 'bg-[#2a3347] text-gray-400 hover:text-white'}`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a3347]">
                    {['#', 'Name', 'Email', 'Mobile', 'Role', 'Specialty', 'Permissions / Info', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2030]">
                  {users.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-12 text-gray-600">No users found.</td></tr>
                  )}
                  {users.map((u, i) => (
                    <tr key={u.id} className="hover:bg-[#161d2d]">
                      <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.mobile || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ROLE_BADGE[u.role] || 'bg-gray-700 text-gray-400'}`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.specialty ? (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${SPECIALTY_BADGE[u.specialty] || 'bg-gray-700 text-gray-400'}`}>
                            {u.specialty}
                          </span>
                        ) : <span className="text-gray-700 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {u.role === 'admin' ? (
                          <span className="text-orange-400 text-xs">All Access</span>
                        ) : u.role === 'staff' ? (
                          Array.isArray(u.permissions) && u.permissions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.permissions.slice(0, 3).map(p => (
                                <span key={p} className="bg-[#2a3347] text-indigo-300 text-xs px-1.5 py-0.5 rounded">{p}</span>
                              ))}
                              {u.permissions.length > 3 && <span className="text-gray-500 text-xs">+{u.permissions.length - 3}</span>}
                            </div>
                          ) : <span className="text-gray-600 text-xs">Basic staff</span>
                        ) : <span className="text-gray-700 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 text-indigo-400 hover:bg-indigo-900/30 rounded" title="Edit">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          {u.id !== user.id && (
                            <button onClick={() => handleDelete(u)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded" title="Delete">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2433] border border-[#2a3347] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white text-lg font-bold">{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                    className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                {/* Mobile */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Mobile</label>
                  <input type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })}
                    className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                {/* Password */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Password {editUser ? <span className="text-gray-600 font-normal">(blank = keep existing)</span> : '*'}
                  </label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={editUser ? 'Leave blank to keep' : 'Min 6 characters'}
                    className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600" />
                </div>
                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value, specialty: '', permissions: [] })}
                    className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                    {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                {/* Designation */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Designation</label>
                  <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                    placeholder="e.g. Manager, Officer"
                    className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600" />
                </div>
                {/* Store / Brand — for tenant role */}
                {form.role === 'tenant' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Store / Brand</label>
                    <select value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })}
                      className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                      <option value="">— Select Store —</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}</option>)}
                    </select>
                  </div>
                )}
                {/* Specialty — only for staff */}
                {form.role === 'staff' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Specialty / Department</label>
                    <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
                      className="w-full bg-[#0f1623] border border-[#2a3347] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                      {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <p className="text-xs text-gray-600 mt-1">Used to auto-assign checklists by department.</p>
                  </div>
                )}
              </div>

              {/* Permissions — only for staff */}
              {form.role === 'staff' && (
                <div className="border border-[#2a3347] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
                      <span className="text-white text-sm font-semibold">Page Permissions</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAll} className="text-xs text-indigo-400 hover:text-indigo-300">All</button>
                      <span className="text-gray-600">·</span>
                      <button type="button" onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-300">None</button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mb-3">Dashboard, My Tickets and My Checklists are always visible to staff.</p>
                  {GROUPS.map(group => {
                    const items = ALL_PERMISSIONS.filter(p => p.group === group);
                    return (
                      <div key={group} className="mb-3 last:mb-0">
                        <p className="text-gray-600 text-xs uppercase tracking-wider mb-2">{group}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {items.map(perm => (
                            <label key={perm.key}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                                ${form.permissions.includes(perm.key)
                                  ? 'bg-indigo-600/30 border border-indigo-500/50'
                                  : 'bg-[#0f1623] border border-[#2a3347] hover:border-gray-500'}`}>
                              <input type="checkbox"
                                checked={form.permissions.includes(perm.key)}
                                onChange={() => togglePerm(perm.key)}
                                className="w-3.5 h-3.5 accent-indigo-500" />
                              <span className={`text-xs font-medium ${form.permissions.includes(perm.key) ? 'text-indigo-300' : 'text-gray-400'}`}>
                                {perm.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Role info boxes */}
              {form.role === 'tenant' && (
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl px-4 py-3 text-xs text-purple-300">
                  Tenant users can log in at <strong>/tenant</strong> — they can raise and view their own tickets.
                </div>
              )}
              {form.role === 'security' && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl px-4 py-3 text-xs text-yellow-300">
                  Security officers log in at <strong>/security</strong> — they can log incidents and view their own tickets.
                </div>
              )}
              {form.role === 'helpdesk' && (
                <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl px-4 py-3 text-xs text-cyan-300">
                  Help Desk users log in at <strong>/helpdesk</strong> — they can view all tickets and create tickets on behalf of others.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
                  {saving ? 'Saving...' : (editUser ? 'Update User' : 'Create User')}
                </button>
                <button type="button" onClick={closeModal}
                  className="flex-1 bg-[#2a3347] text-gray-300 py-2.5 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
