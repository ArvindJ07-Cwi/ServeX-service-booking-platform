import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { servicesAPI, bookingsAPI, adminAPI, couponAPI, uploadAPI } from '../services/api';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, CalendarDays, CreditCard, LayoutGrid,
    PlusCircle, Pencil, Trash2, X, Loader2, AlertCircle, CheckCircle2,
    Search, IndianRupee, Ban, CheckCircle, Ticket
} from 'lucide-react';

const adminTabs = [
    { value: 'overview', label: 'Overview', icon: LayoutDashboard },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'agents', label: 'Agents', icon: Briefcase },
    { value: 'bookings', label: 'Bookings', icon: CalendarDays },
    { value: 'payments', label: 'Payments', icon: CreditCard },
    { value: 'services', label: 'Services', icon: LayoutGrid },
    { value: 'coupons', label: 'Coupons', icon: Ticket },
];

const thClass = 'px-4 py-3 text-left text-[11px] font-medium text-surface-500 uppercase tracking-wider';
const tdClass = 'px-4 py-3.5 whitespace-nowrap text-sm';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [agentsList, setAgentsList] = useState([]);
    const [bookingsList, setBookingsList] = useState([]);
    const [paymentsList, setPaymentsList] = useState([]);
    const [services, setServices] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', category: '', duration: '', image: '', imageFile: null });
    const [formLoading, setFormLoading] = useState(false);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', max_discount: '', min_order_value: '', usage_limit: '', valid_to: '' });

    useEffect(() => { fetchAllData(); }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statRes, uRes, aRes, bRes, pRes, sRes, cRes] = await Promise.all([
                adminAPI.getDashboardStats().catch(() => ({ data: {} })),
                adminAPI.getUsers().catch(() => ({ data: [] })),
                adminAPI.getAgents().catch(() => ({ data: [] })),
                bookingsAPI.getAll().catch(() => ({ data: [] })),
                adminAPI.getPayments().catch(() => ({ data: [] })),
                servicesAPI.getAll().catch(() => ({ data: [] })),
                couponAPI.getAll().catch(() => ({ data: [] }))
            ]);
            setStats(statRes.data || null);
            setUsersList(uRes.data || []);
            setAgentsList(aRes.data || []);
            setBookingsList(bRes.data.bookings || bRes.data || []);
            setPaymentsList(pRes.data || []);
            setServices(sRes.data.services || sRes.data || []);
            setCoupons(cRes.data || []);
        } catch { setError('Failed to load some dashboard data.'); }
        finally { setLoading(false); }
    };

    const showMessage = (msg, isError = false) => {
        if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
        else { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
    };

    const toggleUserStatus = async (id, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await adminAPI.updateUserStatus(id, newStatus);
            showMessage(`User access ${newStatus ? 'restored' : 'revoked'}.`);
            setUsersList(prev => prev.map(u => u._id === id ? { ...u, availability_status: newStatus } : u));
            setAgentsList(prev => prev.map(a => a._id === id ? { ...a, availability_status: newStatus } : a));
        } catch (err) { showMessage(err.response?.data?.message || 'Failed to update user status.', true); }
    };

    const updateBookingStatus = async (id, newStatus) => {
        if (!window.confirm(`Update booking status to ${newStatus}?`)) return;
        try { await adminAPI.updateBookingStatus(id, newStatus); showMessage('Booking status updated.'); fetchAllData(); }
        catch { showMessage('Failed to update booking status.', true); }
    };

    const cancelBooking = async (id) => {
        if (!window.confirm('Cancel this booking permanently?')) return;
        try { await bookingsAPI.cancel(id); showMessage('Booking cancelled.'); fetchAllData(); }
        catch { showMessage('Failed to cancel booking.', true); }
    };

    const resetForm = () => { setShowServiceForm(false); setEditingService(null); setServiceForm({ name: '', description: '', price: '', category: '', duration: '', image: '', imageFile: null }); };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        if (!serviceForm.name || !serviceForm.price) return showMessage('Name and price required.', true);
        setFormLoading(true);
        try {
            let finalImage = serviceForm.image;
            if (serviceForm.imageFile) {
                const formData = new FormData(); formData.append('image', serviceForm.imageFile);
                const { data } = await uploadAPI.uploadImage(formData); finalImage = data.imageUrl;
            }
            const payload = { name: serviceForm.name, description: serviceForm.description, price: Number(serviceForm.price), category: serviceForm.category, duration: serviceForm.duration, image: finalImage, image_url: finalImage };
            if (editingService) { await servicesAPI.update(editingService._id, payload); showMessage('Service updated!'); }
            else { await servicesAPI.create(payload); showMessage('Service created!'); }
            resetForm(); fetchAllData();
        } catch (err) { showMessage(err.response?.data?.message || 'Failed to save service.', true); }
        finally { setFormLoading(false); }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try { await servicesAPI.delete(id); showMessage('Service deleted.'); fetchAllData(); }
        catch { showMessage('Failed to delete service.', true); }
    };

    const resetCouponForm = () => { setShowCouponForm(false); setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', max_discount: '', min_order_value: '', usage_limit: '', valid_to: '' }); };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        if (!couponForm.code || !couponForm.discount_value) return showMessage('Code and discount value required.', true);
        setFormLoading(true);
        try { await couponAPI.create(couponForm); showMessage('Coupon created!'); resetCouponForm(); fetchAllData(); }
        catch (err) { showMessage(err.response?.data?.message || 'Failed to create coupon.', true); }
        finally { setFormLoading(false); }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try { await couponAPI.delete(id); showMessage('Coupon deleted.'); fetchAllData(); }
        catch { showMessage('Failed to delete coupon.', true); }
    };

    const filteredItems = (items, keys) => {
        if (!searchQuery.trim() || !items) return items || [];
        const q = searchQuery.toLowerCase();
        return items.filter((item) => keys.some((key) => {
            const parts = key.split('.'); let val = item;
            for (let part of parts) { if (val == null) break; val = val[part]; }
            return (val || '').toString().toLowerCase().includes(q);
        }));
    };

    const statusBadge = (status) => {
        const map = {
            pending: 'bg-warning-50 text-warning-700', assigned: 'bg-blue-50 text-blue-700',
            accepted: 'bg-blue-50 text-blue-700', in_progress: 'bg-purple-50 text-purple-700',
            completed: 'bg-success-50 text-success-700', cancelled: 'bg-danger-50 text-danger-700',
            paid: 'bg-success-50 text-success-700', captured: 'bg-success-50 text-success-700',
            created: 'bg-surface-100 text-surface-600',
        };
        return `px-2 py-0.5 text-[11px] font-medium rounded-full ${map[status] || 'bg-surface-100 text-surface-600'}`;
    };

    return (
        <div className="bg-surface-50 min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-surface-900">Admin Panel</h1>
                    <p className="text-sm text-surface-500 mt-1">Manage users, bookings, services, and payments</p>
                </div>

                {/* Alerts */}
                {success && (
                    <div className="mb-5 flex items-center gap-2 rounded-lg bg-success-50 border border-success-500/20 px-4 py-3 animate-fade-in">
                        <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
                        <p className="text-sm text-success-700 font-medium">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="mb-5 flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-500/20 px-4 py-3 animate-fade-in">
                        <AlertCircle className="h-4 w-4 text-danger-500 flex-shrink-0" />
                        <p className="text-sm text-danger-600 flex-1">{error}</p>
                        <button onClick={() => setError('')}><X className="h-4 w-4 text-danger-400" /></button>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="lg:w-48 flex-shrink-0">
                        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                            {adminTabs.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => { setActiveTab(value); setSearchQuery(''); }}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                                        activeTab === value
                                            ? 'bg-surface-900 text-white'
                                            : 'text-surface-600 hover:bg-surface-100'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        {activeTab !== 'overview' && (
                            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="relative max-w-xs w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input-field pl-9 py-2 text-sm"
                                    />
                                </div>
                                {activeTab === 'services' && (
                                    <button onClick={() => { resetForm(); setShowServiceForm(true); }} className="btn-primary text-sm py-2">
                                        <PlusCircle className="h-4 w-4" /> Add Service
                                    </button>
                                )}
                                {activeTab === 'coupons' && (
                                    <button onClick={() => { resetCouponForm(); setShowCouponForm(true); }} className="btn-primary text-sm py-2">
                                        <PlusCircle className="h-4 w-4" /> Add Coupon
                                    </button>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 text-surface-400 animate-spin" /></div>
                        ) : (
                            <div className="card overflow-hidden p-0">

                                {/* OVERVIEW */}
                                {activeTab === 'overview' && stats && (
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="p-4 rounded-lg bg-surface-900 text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><IndianRupee className="h-4 w-4" /></div>
                                                    <div>
                                                        <p className="text-xs text-surface-400">Revenue</p>
                                                        <p className="text-xl font-semibold">₹{Number(stats.totalRevenue).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-lg border border-surface-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><CalendarDays className="h-4 w-4" /></div>
                                                    <div>
                                                        <p className="text-xs text-surface-500">Bookings</p>
                                                        <p className="text-xl font-semibold text-surface-900">{stats.totalBookings}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex gap-3 text-[11px]">
                                                    <span className="text-success-600">{stats.completedBookings} completed</span>
                                                    <span className="text-warning-600">{stats.pendingBookings} active</span>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-lg border border-surface-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600"><Users className="h-4 w-4" /></div>
                                                    <div>
                                                        <p className="text-xs text-surface-500">Users</p>
                                                        <p className="text-xl font-semibold text-surface-900">{stats.totalUsers}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-[11px] text-surface-500">{stats.totalAgents} registered agents</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* USERS */}
                                {activeTab === 'users' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead><tr>
                                                <th className={thClass}>User</th><th className={thClass}>Contact</th>
                                                <th className={thClass}>Status</th><th className={thClass}>Joined</th>
                                                <th className={`${thClass} text-right`}>Actions</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {filteredItems(usersList, ['name', 'email']).map((u) => (
                                                    <tr key={u._id} className="hover:bg-surface-50">
                                                        <td className={tdClass}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-xs font-semibold">{u.name?.charAt(0)?.toUpperCase()}</div>
                                                                <div><p className="font-medium text-surface-900">{u.name}</p><p className="text-xs text-surface-400">{u.role}</p></div>
                                                            </div>
                                                        </td>
                                                        <td className={tdClass}><p className="text-surface-900">{u.email}</p><p className="text-xs text-surface-400">{u.phone || '—'}</p></td>
                                                        <td className={tdClass}><span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${u.availability_status ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>{u.availability_status ? 'Active' : 'Blocked'}</span></td>
                                                        <td className={`${tdClass} text-surface-500`}>{new Date(u.created_at).toLocaleDateString()}</td>
                                                        <td className={`${tdClass} text-right`}>
                                                            <button onClick={() => toggleUserStatus(u._id, u.availability_status)} className={`inline-flex items-center gap-1 text-xs font-medium ${u.availability_status ? 'text-danger-500 hover:text-danger-700' : 'text-success-600 hover:text-success-700'}`}>
                                                                {u.availability_status ? <><Ban className="h-3.5 w-3.5" />Block</> : <><CheckCircle className="h-3.5 w-3.5" />Unblock</>}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(usersList, ['name', 'email']).length === 0 && <div className="text-center py-12 text-sm text-surface-400">No users found.</div>}
                                    </div>
                                )}

                                {/* AGENTS */}
                                {activeTab === 'agents' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead><tr>
                                                <th className={thClass}>Agent</th><th className={thClass}>Category</th>
                                                <th className={thClass}>Location</th><th className={thClass}>Status</th>
                                                <th className={`${thClass} text-right`}>Actions</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {filteredItems(agentsList, ['name', 'email', 'service_category', 'city']).map((a) => (
                                                    <tr key={a._id} className="hover:bg-surface-50">
                                                        <td className={tdClass}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-semibold">{a.name?.charAt(0)?.toUpperCase()}</div>
                                                                <div><p className="font-medium text-surface-900">{a.name}</p><p className="text-xs text-surface-400">{a.phone || a.email}</p></div>
                                                            </div>
                                                        </td>
                                                        <td className={tdClass}><span className="text-surface-900">{a.service_category || '—'}</span></td>
                                                        <td className={`${tdClass} text-surface-500`}>{a.city || a.location || '—'} {a.area ? `(${a.area})` : ''}</td>
                                                        <td className={tdClass}><span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${a.availability_status ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>{a.availability_status ? 'Active' : 'Blocked'}</span></td>
                                                        <td className={`${tdClass} text-right`}>
                                                            <button onClick={() => toggleUserStatus(a._id, a.availability_status)} className={`inline-flex items-center gap-1 text-xs font-medium ${a.availability_status ? 'text-danger-500 hover:text-danger-700' : 'text-success-600 hover:text-success-700'}`}>
                                                                {a.availability_status ? <><Ban className="h-3.5 w-3.5" />Block</> : <><CheckCircle className="h-3.5 w-3.5" />Unblock</>}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(agentsList, ['name', 'email']).length === 0 && <div className="text-center py-12 text-sm text-surface-400">No agents found.</div>}
                                    </div>
                                )}

                                {/* BOOKINGS */}
                                {activeTab === 'bookings' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead><tr>
                                                <th className={thClass}>ID</th><th className={thClass}>Details</th>
                                                <th className={thClass}>Customer / Agent</th><th className={thClass}>Status</th>
                                                <th className={`${thClass} text-right`}>Actions</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {filteredItems(bookingsList, ['user.name', 'agent.name', 'service.name', '_id', 'status']).map((b) => (
                                                    <tr key={b._id} className="hover:bg-surface-50">
                                                        <td className={`${tdClass} font-mono text-surface-400 text-xs`}>#{String(b._id).slice(-6).toUpperCase()}</td>
                                                        <td className={tdClass}>
                                                            <p className="font-medium text-surface-900">{b.service?.name}</p>
                                                            <p className="text-xs text-surface-400">{new Date(b.date).toLocaleDateString()} · {b.time}</p>
                                                            <p className="text-xs font-medium text-primary-600 mt-0.5">₹{b.totalAmount}</p>
                                                        </td>
                                                        <td className={tdClass}>
                                                            <p className="text-surface-900">{b.user?.name || '—'}</p>
                                                            <p className="text-xs text-surface-400">{b.agent?.name || 'Unassigned'}</p>
                                                        </td>
                                                        <td className={tdClass}><span className={statusBadge(b.status)}>{b.status.replace('_', ' ')}</span></td>
                                                        <td className={`${tdClass} text-right`}>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Link to={`/bookings/${b._id}`} className="text-xs font-medium text-primary-600 hover:text-primary-700">View</Link>
                                                                {(b.status === 'pending' || b.status === 'assigned') && (
                                                                    <button onClick={() => cancelBooking(b._id)} className="text-[11px] text-danger-500 hover:text-danger-700">Cancel</button>
                                                                )}
                                                                {b.status === 'in_progress' && (
                                                                    <button onClick={() => updateBookingStatus(b._id, 'completed')} className="text-[11px] text-success-600 hover:text-success-700">Complete</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(bookingsList, ['user.name']).length === 0 && <div className="text-center py-12 text-sm text-surface-400">No bookings found.</div>}
                                    </div>
                                )}

                                {/* PAYMENTS */}
                                {activeTab === 'payments' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead><tr>
                                                <th className={thClass}>Date</th><th className={thClass}>Booking</th>
                                                <th className={thClass}>Payment ID</th><th className={thClass}>Amount</th>
                                                <th className={thClass}>Status</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {filteredItems(paymentsList, ['payment_id', 'order_id', 'booking_id']).map((p) => (
                                                    <tr key={p.booking_id} className="hover:bg-surface-50">
                                                        <td className={`${tdClass} text-surface-500`}>{new Date(p.created_at).toLocaleString()}</td>
                                                        <td className={`${tdClass} font-mono text-surface-700 text-xs`}>#{String(p.booking_id).slice(-6).toUpperCase()}</td>
                                                        <td className={`${tdClass} font-mono text-surface-400 text-xs`}>{p.payment_id || <span className="italic">—</span>}</td>
                                                        <td className={`${tdClass} font-medium text-surface-900`}>₹{p.amount}</td>
                                                        <td className={tdClass}><span className={statusBadge(p.status)}>{p.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(paymentsList, ['payment_id']).length === 0 && <div className="text-center py-12 text-sm text-surface-400">No payments found.</div>}
                                    </div>
                                )}

                                {/* SERVICES TABLE */}
                                {activeTab === 'services' && !showServiceForm && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead><tr>
                                                <th className={thClass}>Service</th><th className={thClass}>Category</th>
                                                <th className={thClass}>Price</th><th className={`${thClass} text-right`}>Actions</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {filteredItems(services, ['name', 'category']).map((s) => (
                                                    <tr key={s._id} className="hover:bg-surface-50">
                                                        <td className={tdClass}>
                                                            <div className="flex items-center gap-3">
                                                                {s.image && <img src={s.image} alt="" className="h-8 w-8 rounded-lg object-cover bg-surface-100" />}
                                                                <span className="font-medium text-surface-900">{s.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className={tdClass}><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-100 text-surface-700">{s.category || '—'}</span></td>
                                                        <td className={tdClass}><p className="font-medium text-surface-900">₹{s.price}</p><p className="text-xs text-surface-400">{s.duration || '—'}</p></td>
                                                        <td className={`${tdClass} text-right`}>
                                                            <button onClick={() => { setEditingService(s); setServiceForm({ name: s.name||'', description: s.description||'', price: s.price||'', category: s.category||'', duration: s.duration||'', image: s.image||'' }); setShowServiceForm(true); }} className="text-xs font-medium text-primary-600 hover:text-primary-700 mr-3">Edit</button>
                                                            <button onClick={() => handleDeleteService(s._id)} className="text-xs font-medium text-danger-500 hover:text-danger-700">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(services, ['name']).length === 0 && <div className="text-center py-12 text-sm text-surface-400">No services found.</div>}
                                    </div>
                                )}

                                {/* SERVICE FORM */}
                                {activeTab === 'services' && showServiceForm && (
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-base font-semibold text-surface-900">{editingService ? 'Edit Service' : 'Add Service'}</h3>
                                            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X className="h-4 w-4" /></button>
                                        </div>
                                        <form onSubmit={handleServiceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Name *</label><input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} className="input-field" required /></div>
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Category</label><input value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} className="input-field" /></div>
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Price (₹) *</label><input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} className="input-field" required /></div>
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Duration</label><input value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} className="input-field" placeholder="e.g. 1-2 Hours" /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label><textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows={2} className="input-field resize-none" /></div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Image</label>
                                                <input type="file" onChange={(e) => setServiceForm({ ...serviceForm, imageFile: e.target.files[0] })} className="input-field" accept="image/*" />
                                                <input value={serviceForm.image} onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })} className="input-field mt-2" placeholder="Or enter image URL" />
                                            </div>
                                            <div className="md:col-span-2 flex gap-3 pt-2">
                                                <button type="submit" disabled={formLoading} className="btn-primary">{formLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : editingService ? 'Update' : 'Create'}</button>
                                                <button type="button" onClick={resetForm} className="btn-ghost">Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* COUPONS TABLE */}
                                {activeTab === 'coupons' && !showCouponForm && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-100">
                                            <thead><tr>
                                                <th className={thClass}>Code</th><th className={thClass}>Discount</th>
                                                <th className={thClass}>Rules</th><th className={thClass}>Usage</th>
                                                <th className={`${thClass} text-right`}>Actions</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {filteredItems(coupons, ['code', 'discount_type']).map((c) => (
                                                    <tr key={c.id} className="hover:bg-surface-50">
                                                        <td className={tdClass}><p className="font-semibold text-surface-900 font-mono">{c.code}</p><p className="text-[11px] text-surface-400 capitalize">{c.discount_type}</p></td>
                                                        <td className={tdClass}><p className="font-medium text-primary-600">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</p>{c.max_discount && <p className="text-[11px] text-surface-400">Max ₹{c.max_discount}</p>}</td>
                                                        <td className={`${tdClass} text-surface-500`}>Min ₹{c.min_order_value || 0}</td>
                                                        <td className={tdClass}><p className="text-surface-900 text-xs">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</p><p className="text-[11px] text-surface-400">{c.valid_to ? `Exp: ${new Date(c.valid_to).toLocaleDateString()}` : 'No expiry'}</p></td>
                                                        <td className={`${tdClass} text-right`}><button onClick={() => handleDeleteCoupon(c.id)} className="text-xs font-medium text-danger-500 hover:text-danger-700">Delete</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(coupons, ['code']).length === 0 && <div className="text-center py-12 text-sm text-surface-400">No coupons found.</div>}
                                    </div>
                                )}

                                {/* COUPON FORM */}
                                {activeTab === 'coupons' && showCouponForm && (
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-base font-semibold text-surface-900">Create Coupon</h3>
                                            <button onClick={resetCouponForm} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X className="h-4 w-4" /></button>
                                        </div>
                                        <form onSubmit={handleCouponSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Code *</label><input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="input-field uppercase font-mono" required /></div>
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Type *</label><select value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })} className="input-field"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option></select></div>
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Value *</label><input type="number" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} className="input-field" required /></div>
                                            {couponForm.discount_type === 'percentage' && (
                                                <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Max Discount (₹)</label><input type="number" value={couponForm.max_discount} onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })} className="input-field" /></div>
                                            )}
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Min Order (₹)</label><input type="number" value={couponForm.min_order_value} onChange={(e) => setCouponForm({ ...couponForm, min_order_value: e.target.value })} className="input-field" /></div>
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Usage Limit</label><input type="number" value={couponForm.usage_limit} onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })} className="input-field" /></div>
                                            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Valid Until</label><input type="date" value={couponForm.valid_to} onChange={(e) => setCouponForm({ ...couponForm, valid_to: e.target.value })} className="input-field" /></div>
                                            <div className="md:col-span-2 flex gap-3 pt-2">
                                                <button type="submit" disabled={formLoading} className="btn-primary">{formLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : 'Create Coupon'}</button>
                                                <button type="button" onClick={resetCouponForm} className="btn-ghost">Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
