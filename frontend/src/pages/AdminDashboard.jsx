import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { servicesAPI, bookingsAPI, adminAPI, couponAPI, uploadAPI } from '../services/api';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    CalendarDays,
    CreditCard,
    LayoutGrid,
    PlusCircle,
    Pencil,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Search,
    DollarSign,
    ShieldBan,
    CheckCircle,
    Ban,
    Ticket
} from 'lucide-react';

const adminTabs = [
    { value: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'agents', label: 'Agents', icon: Briefcase },
    { value: 'bookings', label: 'Bookings', icon: CalendarDays },
    { value: 'payments', label: 'Payments', icon: CreditCard },
    { value: 'services', label: 'Services', icon: LayoutGrid },
    { value: 'coupons', label: 'Coupons', icon: Ticket },
];

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

    // Service form state
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        name: '', description: '', price: '', category: '', duration: '', image: '', imageFile: null,
    });
    const [formLoading, setFormLoading] = useState(false);

    // Coupon form state
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [couponForm, setCouponForm] = useState({
        code: '', discount_type: 'percentage', discount_value: '', max_discount: '', min_order_value: '', usage_limit: '', valid_to: ''
    });

    useEffect(() => {
        fetchAllData();
    }, []);

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
            // Support both paginated and direct array formats
            setBookingsList(bRes.data.bookings || bRes.data || []);
            setPaymentsList(pRes.data || []);
            setServices(sRes.data.services || sRes.data || []);
            setCoupons(cRes.data || []);
            
        } catch (err) {
            setError('Failed to load some dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg, isError = false) => {
        if (isError) {
            setError(msg);
            setTimeout(() => setError(''), 4000);
        } else {
            setSuccess(msg);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    // --- User & Agent Actions ---
    const toggleUserStatus = async (id, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await adminAPI.updateUserStatus(id, newStatus);
            showMessage(`User access ${newStatus ? 'restored' : 'revoked'}.`);
            // Update local state to avoid refetching everything
            setUsersList(prev => prev.map(u => u._id === id ? { ...u, availability_status: newStatus } : u));
            setAgentsList(prev => prev.map(a => a._id === id ? { ...a, availability_status: newStatus } : a));
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to update user status.', true);
        }
    };

    // --- Booking Actions ---
    const updateBookingStatus = async (id, newStatus) => {
        if (!window.confirm(`Update booking status to ${newStatus}?`)) return;
        try {
            await adminAPI.updateBookingStatus(id, newStatus);
            showMessage('Booking status updated.');
            fetchAllData(); 
        } catch (err) {
            showMessage('Failed to update booking status.', true);
        }
    };

    const cancelBooking = async (id) => {
        if (!window.confirm('Cancel this booking permanently?')) return;
        try {
            await bookingsAPI.cancel(id);
            showMessage('Booking cancelled successfully.');
            fetchAllData();
        } catch (err) {
            showMessage('Failed to cancel booking.', true);
        }
    };

    // --- Service Actions ---
    const resetForm = () => {
        setShowServiceForm(false);
        setEditingService(null);
        setServiceForm({ name: '', description: '', price: '', category: '', duration: '', image: '', imageFile: null });
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        if (!serviceForm.name || !serviceForm.price) return showMessage('Name and price are required.', true);
        
        setFormLoading(true);
        try {
            let finalImage = serviceForm.image;
            if (serviceForm.imageFile) {
                const formData = new FormData();
                formData.append('image', serviceForm.imageFile);
                const { data } = await uploadAPI.uploadImage(formData);
                finalImage = data.imageUrl;
            }
            const payload = { 
                name: serviceForm.name, 
                description: serviceForm.description, 
                price: Number(serviceForm.price), 
                category: serviceForm.category, 
                duration: serviceForm.duration, 
                image: finalImage,
                image_url: finalImage
            };
            if (editingService) {
                await servicesAPI.update(editingService._id, payload);
                showMessage('Service updated successfully!');
            } else {
                await servicesAPI.create(payload);
                showMessage('Service created successfully!');
            }
            resetForm();
            fetchAllData();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to save service.', true);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            await servicesAPI.delete(id);
            showMessage('Service deleted.');
            fetchAllData();
        } catch (err) {
            showMessage('Failed to delete service.', true);
        }
    };

    // --- Coupon Actions ---
    const resetCouponForm = () => {
        setShowCouponForm(false);
        setCouponForm({
            code: '', discount_type: 'percentage', discount_value: '', max_discount: '', min_order_value: '', usage_limit: '', valid_to: ''
        });
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        if (!couponForm.code || !couponForm.discount_value) return showMessage('Code and discount value required', true);
        
        setFormLoading(true);
        try {
            await couponAPI.create(couponForm);
            showMessage('Coupon created successfully!');
            resetCouponForm();
            fetchAllData();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to create coupon', true);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await couponAPI.delete(id);
            showMessage('Coupon deleted.');
            fetchAllData();
        } catch (err) {
            showMessage('Failed to delete coupon.', true);
        }
    };

    // --- Render Helpers ---
    const filteredItems = (items, keys) => {
        if (!searchQuery.trim() || !items) return items || [];
        const q = searchQuery.toLowerCase();
        return items.filter((item) =>
            keys.some((key) => {
                // handle nested objects safely
                const parts = key.split('.');
                let val = item;
                for (let part of parts) {
                    if (val == null) break;
                    val = val[part];
                }
                return (val || '').toString().toLowerCase().includes(q);
            })
        );
    };

    const getStatusBadge = (status) => {
        const smap = {
            pending: 'bg-yellow-100 text-yellow-800',
            assigned: 'bg-blue-100 text-blue-800',
            accepted: 'bg-indigo-100 text-indigo-800',
            in_progress: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            paid: 'bg-green-100 text-green-800',
            captured: 'bg-emerald-100 text-emerald-800',
            created: 'bg-gray-100 text-gray-800',
        };
        return `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${smap[status] || 'bg-gray-100 text-gray-800'}`;
    };

    return (
        <div className="min-h-screen bg-surface-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Admin Control Panel</h1>
                        <p className="mt-1 text-sm text-surface-500">
                            Centralized management for users, agents, bookings, and services.
                        </p>
                    </div>
                </div>

                {/* Notifications */}
                {success && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm animate-fade-in">
                        <CheckCircle2 className="h-5 w-5 text-success-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-success-700">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm animate-fade-in">
                        <AlertCircle className="h-5 w-5 text-danger-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-danger-700 w-full">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto text-danger-400 hover:text-danger-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Sidebar */}
                    <div className="md:w-64 flex-shrink-0">
                        <nav className="flex flex-col space-y-1">
                            {adminTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        onClick={() => { setActiveTab(tab.value); setSearchQuery(''); }}
                                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                                            isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                                        }`}
                                    >
                                        <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-primary-700' : 'text-surface-400'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        
                        {/* Top bar for Tabs needing search/actions */}
                        {activeTab !== 'overview' && (
                            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="relative max-w-sm w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-surface-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-surface-200 rounded-lg leading-5 bg-white placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                </div>
                                {activeTab === 'services' && (
                                    <button onClick={() => { resetForm(); setShowServiceForm(true); }} className="btn-primary py-2">
                                        <PlusCircle className="h-4 w-4 mr-2" /> Add Service
                                    </button>
                                )}
                                {activeTab === 'coupons' && (
                                    <button onClick={() => { resetCouponForm(); setShowCouponForm(true); }} className="btn-primary py-2">
                                        <PlusCircle className="h-4 w-4 mr-2" /> Add Coupon
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="bg-white shadow-sm ring-1 ring-surface-200 sm:rounded-xl overflow-hidden">
                                
                                {/* 1. OVERVIEW TAB */}
                                {activeTab === 'overview' && stats && (
                                    <div className="p-6">
                                        <h2 className="text-lg font-medium text-surface-900 mb-6">Platform Overview</h2>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                            {/* Revenue Card */}
                                            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-sm text-white">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 bg-white/20 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-white" /></div>
                                                    <div className="ml-4 w-0 flex-1">
                                                        <p className="text-sm font-medium text-primary-100 truncate">Total Revenue</p>
                                                        <p className="text-2xl font-bold text-white">₹{Number(stats.totalRevenue).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Bookings */}
                                            <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-sm">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 bg-indigo-50 p-3 rounded-lg"><CalendarDays className="h-6 w-6 text-indigo-600" /></div>
                                                    <div className="ml-4 w-0 flex-1">
                                                        <p className="text-sm font-medium text-surface-500 truncate">Total Bookings</p>
                                                        <p className="text-2xl font-bold text-surface-900">{stats.totalBookings}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex gap-4 text-xs font-medium text-surface-500">
                                                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> {stats.completedBookings} Completed</span>
                                                    <span className="flex items-center gap-1 text-yellow-600"><Loader2 className="h-3 w-3" /> {stats.pendingBookings} Active</span>
                                                </div>
                                            </div>
                                            {/* Users / Agents */}
                                            <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-sm">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 bg-emerald-50 p-3 rounded-lg"><Users className="h-6 w-6 text-emerald-600" /></div>
                                                    <div className="ml-4 w-0 flex-1">
                                                        <p className="text-sm font-medium text-surface-500 truncate">Total Users</p>
                                                        <p className="text-2xl font-bold text-surface-900">{stats.totalUsers}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-xs font-medium text-surface-500">
                                                    <span className="flex items-center gap-1 text-emerald-600"><Briefcase className="h-3 w-3" /> +{stats.totalAgents} Registered Agents</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. USERS TAB */}
                                {activeTab === 'users' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-200">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">User</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Joined</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-surface-200">
                                                {filteredItems(usersList, ['name', 'email']).map((u) => (
                                                    <tr key={u._id} className="hover:bg-surface-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                                    {u.name?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-surface-900">{u.name}</div>
                                                                    <div className="text-sm text-surface-500">{u.role}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-surface-900">{u.email}</div>
                                                            <div className="text-sm text-surface-500">{u.phone || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.availability_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {u.availability_status ? 'Active' : 'Blocked'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                                                            {new Date(u.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button 
                                                                onClick={() => toggleUserStatus(u._id, u.availability_status)}
                                                                className={`inline-flex items-center gap-1 ${u.availability_status ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                            >
                                                                {u.availability_status ? <Ban className="h-4 w-4"/> : <CheckCircle className="h-4 w-4"/>}
                                                                {u.availability_status ? 'Block' : 'Unblock'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(usersList, ['name', 'email']).length === 0 && (
                                            <div className="text-center py-12 text-surface-500">No users found.</div>
                                        )}
                                    </div>
                                )}

                                {/* 3. AGENTS TAB */}
                                {activeTab === 'agents' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-200">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Agent</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Category</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Location</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-surface-200">
                                                {filteredItems(agentsList, ['name', 'email', 'service_category', 'city']).map((a) => (
                                                    <tr key={a._id} className="hover:bg-surface-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                                    {a.name?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-surface-900">{a.name}</div>
                                                                    <div className="text-sm text-surface-500">{a.phone || a.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-surface-900">{a.service_category || '—'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                                                            {a.city || a.location || '—'} {a.area ? `(${a.area})` : ''}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${a.availability_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {a.availability_status ? 'Active' : 'Blocked'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button 
                                                                onClick={() => toggleUserStatus(a._id, a.availability_status)}
                                                                className={`inline-flex items-center gap-1 ${a.availability_status ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                            >
                                                                {a.availability_status ? <Ban className="h-4 w-4"/> : <CheckCircle className="h-4 w-4"/>}
                                                                {a.availability_status ? 'Block' : 'Unblock'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(agentsList, ['name', 'email']).length === 0 && (
                                            <div className="text-center py-12 text-surface-500">No agents found.</div>
                                        )}
                                    </div>
                                )}

                                {/* 4. BOOKINGS TAB */}
                                {activeTab === 'bookings' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-200">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Details</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Roles</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-surface-200">
                                                {filteredItems(bookingsList, ['user.name', 'agent.name', 'service.name', '_id', 'status']).map((b) => (
                                                    <tr key={b._id} className="hover:bg-surface-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 font-mono">
                                                            #{String(b._id).slice(-6).toUpperCase()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-surface-900">{b.service?.name}</div>
                                                            <div className="text-sm text-surface-500">{new Date(b.date).toLocaleDateString()} at {b.time}</div>
                                                            <div className="text-sm font-semibold text-primary-600 mt-1">₹{b.totalAmount}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-surface-900"><span className="text-surface-500">U:</span> {b.user?.name || '—'}</div>
                                                            <div className="text-sm text-surface-900"><span className="text-surface-500">A:</span> {b.agent?.name || 'Unassigned'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={getStatusBadge(b.status)}>{b.status.replace('_',' ').toUpperCase()}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex flex-col gap-2 items-end">
                                                                <Link to={`/bookings/${b._id}`} className="text-primary-600 hover:text-primary-900">View</Link>
                                                                {(b.status === 'pending' || b.status === 'assigned') && (
                                                                    <button onClick={() => cancelBooking(b._id)} className="text-red-500 hover:text-red-700 text-xs">Force Cancel</button>
                                                                )}
                                                                {(b.status === 'in_progress') && (
                                                                    <button onClick={() => updateBookingStatus(b._id, 'completed')} className="text-emerald-500 hover:text-emerald-700 text-xs">Force Complete</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(bookingsList, ['user.name']).length === 0 && (
                                            <div className="text-center py-12 text-surface-500">No bookings found.</div>
                                        )}
                                    </div>
                                )}

                                {/* 5. PAYMENTS TAB */}
                                {activeTab === 'payments' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-200">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Booking ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Payment ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-surface-200">
                                                {filteredItems(paymentsList, ['payment_id', 'order_id', 'booking_id']).map((p) => (
                                                    <tr key={p.booking_id} className="hover:bg-surface-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                                                            {new Date(p.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-surface-700">
                                                            #{String(p.booking_id).slice(-6).toUpperCase()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-surface-500">
                                                            {p.payment_id || <span className="text-surface-400 font-sans italic">{p.order_id || '—'}</span>}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">
                                                            ₹{p.amount}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={getStatusBadge(p.status)}>{p.status?.toUpperCase()}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(paymentsList, ['payment_id']).length === 0 && (
                                            <div className="text-center py-12 text-surface-500">No payments found.</div>
                                        )}
                                    </div>
                                )}

                                {/* 6. SERVICES TAB */}
                                {activeTab === 'services' && !showServiceForm && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-200">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Service</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Category</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Price / Duration</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-surface-200">
                                                {filteredItems(services, ['name', 'category']).map((s) => (
                                                    <tr key={s._id} className="hover:bg-surface-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {s.image && <img src={s.image} alt="" className="h-10 w-10 rounded-lg object-cover mr-3 bg-surface-100" />}
                                                                <div className="text-sm font-medium text-surface-900">{s.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-800">{s.category || '—'}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-surface-900">₹{s.price}</div>
                                                            <div className="text-xs text-surface-500">{s.duration || '—'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button 
                                                                onClick={() => { setEditingService(s); setServiceForm({ name: s.name||'', description: s.description||'', price: s.price||'', category: s.category||'', duration: s.duration||'', image: s.image||'' }); setShowServiceForm(true); }}
                                                                className="text-primary-600 hover:text-primary-900 mr-3"
                                                            >
                                                                <Pencil className="h-4 w-4 inline mr-1" /> Edit
                                                            </button>
                                                            <button onClick={() => handleDeleteService(s._id)} className="text-red-600 hover:text-red-900">
                                                                <Trash2 className="h-4 w-4 inline mr-1" /> Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(services, ['name']).length === 0 && (
                                            <div className="text-center py-12 text-surface-500">No services found.</div>
                                        )}
                                    </div>
                                )}

                                {/* Service Form Modal/Inlay */}
                                {activeTab === 'services' && showServiceForm && (
                                    <div className="p-6 bg-white">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-surface-900">
                                                {editingService ? 'Edit Service' : 'Add New Service'}
                                            </h3>
                                            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500"><X className="h-5 w-5" /></button>
                                        </div>
                                        <form onSubmit={handleServiceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Service Name *</label>
                                                <input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} className="input-field" placeholder="e.g. AC Repair" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Category</label>
                                                <input value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} className="input-field" placeholder="e.g. Electrical" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Price (₹) *</label>
                                                <input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} className="input-field" placeholder="499" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Duration</label>
                                                <input value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} className="input-field" placeholder="e.g. 1-2 Hours" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                                                <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows={3} className="input-field resize-none" placeholder="Service description..." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Image Upload (File)</label>
                                                <input type="file" onChange={(e) => setServiceForm({ ...serviceForm, imageFile: e.target.files[0] })} className="input-field" accept="image/*" />
                                                <div className="mt-2 text-xs text-surface-500">Or provide an Image URL:</div>
                                                <input value={serviceForm.image} onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })} className="input-field mt-1" placeholder="https://..." />
                                            </div>
                                            <div className="md:col-span-2 pt-4 flex gap-3">
                                                <button type="submit" disabled={formLoading} className="btn-primary w-full md:w-auto">
                                                    {formLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> Saving...</> : editingService ? 'Update Service' : 'Create Service'}
                                                </button>
                                                <button type="button" onClick={resetForm} className="btn-secondary w-full md:w-auto">Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* 7. COUPONS TAB */}
                                {activeTab === 'coupons' && !showCouponForm && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-surface-200">
                                            <thead className="bg-surface-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Code / Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Discount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Rules</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Usage & Expiry</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-surface-200">
                                                {filteredItems(coupons, ['code', 'discount_type']).map((c) => (
                                                    <tr key={c.id} className="hover:bg-surface-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-surface-900 font-mono tracking-wide">{c.code}</div>
                                                            <div className="text-xs text-surface-500 capitalize mt-1">{c.discount_type}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-primary-600">
                                                                {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                                                            </div>
                                                            {c.max_discount && <div className="text-xs text-surface-500">Max ₹{c.max_discount}</div>}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                                                            Min Order: ₹{c.min_order_value || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <div className="text-surface-900 border border-surface-200 rounded px-2 py-0.5 inline-block mb-1">
                                                                Used: {c.used_count} {c.usage_limit ? `/ ${c.usage_limit}` : '(No Limit)'}
                                                            </div>
                                                            <div className="text-xs text-surface-500">
                                                                {c.valid_to ? `Exp: ${new Date(c.valid_to).toLocaleDateString()}` : 'Never expires'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-600 hover:text-red-900">
                                                                <Trash2 className="h-4 w-4 inline mr-1" /> Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredItems(coupons, ['code']).length === 0 && (
                                            <div className="text-center py-12 text-surface-500">No coupons found.</div>
                                        )}
                                    </div>
                                )}

                                {/* Coupon Form Modal/Inlay */}
                                {activeTab === 'coupons' && showCouponForm && (
                                    <div className="p-6 bg-white">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-surface-900">Create New Coupon</h3>
                                            <button onClick={resetCouponForm} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500"><X className="h-5 w-5" /></button>
                                        </div>
                                        <form onSubmit={handleCouponSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Coupon Code *</label>
                                                <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="input-field uppercase font-mono" placeholder="e.g. WELCOME50" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Discount Type *</label>
                                                <select value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })} className="input-field">
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount (₹)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Discount Value * {couponForm.discount_type === 'percentage' ? '(%)' : '(₹)'}</label>
                                                <input type="number" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} className="input-field" placeholder={couponForm.discount_type === 'percentage' ? '20' : '500'} required />
                                            </div>
                                            {couponForm.discount_type === 'percentage' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-surface-700 mb-1">Max Discount (₹)</label>
                                                    <input type="number" value={couponForm.max_discount} onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })} className="input-field" placeholder="e.g. 500" />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Min Order Value (₹)</label>
                                                <input type="number" value={couponForm.min_order_value} onChange={(e) => setCouponForm({ ...couponForm, min_order_value: e.target.value })} className="input-field" placeholder="e.g. 999" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Usage Limit (Total)</label>
                                                <input type="number" value={couponForm.usage_limit} onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })} className="input-field" placeholder="e.g. 100 (Leave blank for unlimited)" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-surface-700 mb-1">Valid Until</label>
                                                <input type="date" value={couponForm.valid_to} onChange={(e) => setCouponForm({ ...couponForm, valid_to: e.target.value })} className="input-field" />
                                            </div>
                                            <div className="md:col-span-2 pt-4 flex gap-3">
                                                <button type="submit" disabled={formLoading} className="btn-primary w-full md:w-auto">
                                                    {formLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> Creating...</> : 'Create Coupon'}
                                                </button>
                                                <button type="button" onClick={resetCouponForm} className="btn-secondary w-full md:w-auto">Cancel</button>
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
