import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { servicesAPI, bookingsAPI, usersAPI } from '../services/api';
import {
    LayoutGrid,
    Users,
    CalendarDays,
    PlusCircle,
    Pencil,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Package,
    DollarSign,
    Search,
} from 'lucide-react';

const adminTabs = [
    { value: 'services', label: 'Services', icon: LayoutGrid },
    { value: 'bookings', label: 'Bookings', icon: CalendarDays },
    { value: 'users', label: 'Users', icon: Users },
];

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('services');
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Service form
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        name: '', description: '', price: '', category: '', duration: '', image: '',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [sRes, bRes, uRes] = await Promise.all([
                servicesAPI.getAll().catch(() => ({ data: [] })),
                bookingsAPI.getAll().catch(() => ({ data: [] })),
                usersAPI.getAll().catch(() => ({ data: [] })),
            ]);
            setServices(sRes.data.services || sRes.data || []);
            setBookings(bRes.data.bookings || bRes.data || []);
            setUsers(uRes.data.users || uRes.data || []);
        } catch {
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        if (!serviceForm.name || !serviceForm.price) {
            setError('Name and price are required.');
            return;
        }
        setFormLoading(true);
        setError('');
        try {
            const payload = { ...serviceForm, price: Number(serviceForm.price) };
            if (editingService) {
                await servicesAPI.update(editingService._id, payload);
                setSuccess('Service updated successfully!');
            } else {
                await servicesAPI.create(payload);
                setSuccess('Service created successfully!');
            }
            resetForm();
            fetchAllData();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save service.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditService = (service) => {
        setEditingService(service);
        setServiceForm({
            name: service.name || '',
            description: service.description || '',
            price: service.price?.toString() || '',
            category: service.category || '',
            duration: service.duration || '',
            image: service.image || '',
        });
        setShowServiceForm(true);
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            await servicesAPI.delete(id);
            fetchAllData();
            setSuccess('Service deleted.');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to delete service.');
        }
    };

    const resetForm = () => {
        setShowServiceForm(false);
        setEditingService(null);
        setServiceForm({ name: '', description: '', price: '', category: '', duration: '', image: '' });
    };

    const stats = {
        totalServices: services.length,
        totalBookings: bookings.length,
        totalUsers: users.length,
        revenue: bookings
            .filter((b) => b.status === 'completed')
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };

    const filteredItems = (items, keys) => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter((item) =>
            keys.some((key) => (item[key] || '').toString().toLowerCase().includes(q))
        );
    };

    return (
        <div className="min-h-screen bg-surface-50 pt-20">
            <div className="section-container py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="page-header">Admin Panel</h1>
                    <p className="page-subtitle">Manage services, bookings, and users</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                    {[
                        { label: 'Services', value: stats.totalServices, icon: LayoutGrid, color: 'bg-primary-50 text-primary-600' },
                        { label: 'Bookings', value: stats.totalBookings, icon: CalendarDays, color: 'bg-amber-50 text-amber-600' },
                        { label: 'Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
                        { label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="card">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-surface-900">{value}</p>
                                    <p className="text-xs text-surface-500">{label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Messages */}
                {success && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 animate-scale-in">
                        <CheckCircle2 className="h-4 w-4 text-success-600" />
                        <p className="text-sm text-success-600 font-medium">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 animate-scale-in">
                        <AlertCircle className="h-4 w-4 text-danger-500" />
                        <p className="text-sm text-danger-500">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4 text-danger-400" /></button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <div className="flex items-center gap-1 rounded-xl bg-surface-100 p-1">
                        {adminTabs.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => { setActiveTab(value); setSearchQuery(''); }}
                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === value
                                    ? 'bg-white text-surface-900 shadow-sm'
                                    : 'text-surface-500 hover:text-surface-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="input-field pl-9 py-2 w-48 text-sm"
                            />
                        </div>
                        {activeTab === 'services' && (
                            <button onClick={() => { resetForm(); setShowServiceForm(true); }} className="btn-primary text-sm">
                                <PlusCircle className="h-4 w-4" /> Add Service
                            </button>
                        )}
                    </div>
                </div>

                {/* Service Form Modal */}
                {showServiceForm && (
                    <div className="card mb-6 animate-slide-down">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-surface-900">
                                {editingService ? 'Edit Service' : 'Add New Service'}
                            </h3>
                            <button onClick={resetForm} className="p-1 rounded-lg hover:bg-surface-100"><X className="h-5 w-5 text-surface-400" /></button>
                        </div>
                        <form onSubmit={handleServiceSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Name *</label>
                                <input value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Service name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Category</label>
                                <input value={serviceForm.category} onChange={(e) => setServiceForm((p) => ({ ...p, category: e.target.value }))} className="input-field" placeholder="e.g., Cleaning" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Price (₹) *</label>
                                <input type="number" value={serviceForm.price} onChange={(e) => setServiceForm((p) => ({ ...p, price: e.target.value }))} className="input-field" placeholder="499" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Duration</label>
                                <input value={serviceForm.duration} onChange={(e) => setServiceForm((p) => ({ ...p, duration: e.target.value }))} className="input-field" placeholder="e.g., 1-2 hrs" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
                                <textarea value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Service description..." />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Image URL</label>
                                <input value={serviceForm.image} onChange={(e) => setServiceForm((p) => ({ ...p, image: e.target.value }))} className="input-field" placeholder="https://..." />
                            </div>
                            <div className="sm:col-span-2 flex gap-3">
                                <button type="submit" disabled={formLoading} className="btn-primary">
                                    {formLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : editingService ? 'Update Service' : 'Create Service'}
                                </button>
                                <button type="button" onClick={resetForm} className="btn-ghost">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="card"><div className="h-12 skeleton" /></div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Services Tab */}
                        {activeTab === 'services' && (
                            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-surface-100 bg-surface-50">
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Name</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Category</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Price</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Duration</th>
                                                <th className="px-4 py-3 text-right font-medium text-surface-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {filteredItems(services, ['name', 'category']).map((s) => (
                                                <tr key={s._id} className="hover:bg-surface-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-surface-900">{s.name}</td>
                                                    <td className="px-4 py-3"><span className="badge-neutral">{s.category || '—'}</span></td>
                                                    <td className="px-4 py-3 text-surface-700">₹{s.price}</td>
                                                    <td className="px-4 py-3 text-surface-500">{s.duration || '—'}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button onClick={() => handleEditService(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500"><Pencil className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDeleteService(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-danger-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredItems(services, ['name', 'category']).length === 0 && (
                                                <tr><td colSpan={5} className="py-12 text-center text-surface-400">No services found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Bookings Tab */}
                        {activeTab === 'bookings' && (
                            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-surface-100 bg-surface-50">
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Booking ID</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Service</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Customer</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Status</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Date</th>
                                                <th className="px-4 py-3 text-right font-medium text-surface-500">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {filteredItems(bookings, ['status']).map((b) => {
                                                const statusMap = {
                                                    pending: 'badge-warning', confirmed: 'badge-primary', accepted: 'badge-primary',
                                                    in_progress: 'badge-primary', completed: 'badge-success', cancelled: 'badge-danger',
                                                };
                                                return (
                                                    <tr key={b._id} className="hover:bg-surface-50 transition-colors">
                                                        <td className="px-4 py-3 font-mono text-xs text-surface-500">#{String(b._id || '').slice(-8).toUpperCase()}</td>
                                                        <td className="px-4 py-3 font-medium text-surface-900">{b.service?.name || '—'}</td>
                                                        <td className="px-4 py-3 text-surface-600">{b.user?.name || '—'}</td>
                                                        <td className="px-4 py-3"><span className={statusMap[b.status] || 'badge-neutral'}>{b.status}</span></td>
                                                        <td className="px-4 py-3 text-surface-500">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-surface-900">₹{b.totalAmount || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredItems(bookings, ['status']).length === 0 && (
                                                <tr><td colSpan={6} className="py-12 text-center text-surface-400">No bookings found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-surface-100 bg-surface-50">
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Name</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Email</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Role</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Phone</th>
                                                <th className="px-4 py-3 text-left font-medium text-surface-500">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {filteredItems(users, ['name', 'email', 'role']).map((u) => {
                                                const roleMap = { admin: 'badge-danger', agent: 'badge-warning', user: 'badge-primary' };
                                                return (
                                                    <tr key={u._id} className="hover:bg-surface-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                                                                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                                </div>
                                                                <span className="font-medium text-surface-900">{u.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-surface-600">{u.email}</td>
                                                        <td className="px-4 py-3"><span className={roleMap[u.role] || 'badge-neutral'}>{u.role}</span></td>
                                                        <td className="px-4 py-3 text-surface-500">{u.phone || '—'}</td>
                                                        <td className="px-4 py-3 text-surface-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredItems(users, ['name', 'email', 'role']).length === 0 && (
                                                <tr><td colSpan={5} className="py-12 text-center text-surface-400">No users found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
