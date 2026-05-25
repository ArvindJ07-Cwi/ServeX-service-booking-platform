import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { User, Mail, Phone, Shield, Loader2, CheckCircle2, AlertCircle, Pencil, X, MapPin, Tag } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', phone: '', city: '', area: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await usersAPI.getProfile();
            setProfile(data);
            setForm({ name: data.name || '', phone: data.phone || '', city: data.city || data.location || '', area: data.area || '' });
        } catch {
            setError('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('Name is required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const { data } = await usersAPI.updateProfile(form);
            setProfile(data);
            // Update sessionStorage so AuthContext stays in sync
            const storedUser = JSON.parse(sessionStorage.getItem('servx_user') || '{}');
            sessionStorage.setItem('servx_user', JSON.stringify({
                ...storedUser,
                name: data.name,
                phone: data.phone,
                city: data.city,
                area: data.area,
                location: data.city || data.location
            }));
            setSuccess('Profile updated successfully!');
            setEditing(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const roleLabels = { user: 'Customer', agent: 'Service Agent', admin: 'Administrator' };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 pt-20">
            <div className="section-container py-8 max-w-2xl">
                <h1 className="page-header mb-8">My Profile</h1>

                {success && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 animate-scale-in">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-sm text-green-600 font-medium">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 animate-scale-in">
                        <AlertCircle className="h-4 w-4 text-danger-500" />
                        <p className="text-sm text-danger-500">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4 text-danger-400" /></button>
                    </div>
                )}

                <div className="card">
                    {/* Avatar + Header */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-100">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 text-2xl font-bold">
                            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-surface-900">{profile?.name}</h2>
                            <span className="badge-primary mt-1 inline-block">
                                <Shield className="h-3 w-3 inline mr-1" />
                                {roleLabels[profile?.role] || profile?.role}
                            </span>
                        </div>
                        {!editing && (
                            <button
                                onClick={() => { setEditing(true); setForm({ name: profile?.name || '', phone: profile?.phone || '', city: profile?.city || profile?.location || '', area: profile?.area || '' }); }}
                                className="btn-secondary text-xs px-3 py-2"
                            >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="input-field pl-10"
                                        placeholder="Your name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className="input-field pl-10"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">City</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                    <select
                                        value={form.city}
                                        onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                                        className="input-field pl-10"
                                    >
                                        <option value="">Select city</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Thane">Thane</option>
                                        <option value="Navi Mumbai">Navi Mumbai</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Kolkata">Kolkata</option>
                                        <option value="Ahmedabad">Ahmedabad</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Area / Locality <span className="text-surface-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                                    <input
                                        value={form.area}
                                        onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))}
                                        className="input-field pl-10"
                                        placeholder="e.g. Andheri West"
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving} className="btn-primary">
                                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                                </button>
                                <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-surface-600">
                                <Mail className="h-4 w-4 text-surface-400" />
                                <div>
                                    <p className="text-xs text-surface-400">Email</p>
                                    <p className="text-sm font-medium text-surface-900">{profile?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-surface-600">
                                <Phone className="h-4 w-4 text-surface-400" />
                                <div>
                                    <p className="text-xs text-surface-400">Phone</p>
                                    <p className="text-sm font-medium text-surface-900">{profile?.phone || 'Not set'}</p>
                                </div>
                            </div>
                            {(profile?.city || profile?.location) && (
                                <div className="flex items-center gap-3 text-surface-600">
                                    <MapPin className="h-4 w-4 text-surface-400" />
                                    <div>
                                        <p className="text-xs text-surface-400">City / Area</p>
                                        <p className="text-sm font-medium text-surface-900">
                                            {profile.city || profile.location}{profile?.area ? ` — ${profile.area}` : ''}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {profile?.service_category && (
                                <div className="flex items-center gap-3 text-surface-600">
                                    <Tag className="h-4 w-4 text-surface-400" />
                                    <div>
                                        <p className="text-xs text-surface-400">Service Category</p>
                                        <p className="text-sm font-medium text-surface-900">{profile.service_category}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-surface-600">
                                <User className="h-4 w-4 text-surface-400" />
                                <div>
                                    <p className="text-xs text-surface-400">Member Since</p>
                                    <p className="text-sm font-medium text-surface-900">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <div className="mt-6">
                    <button onClick={logout} className="btn-ghost text-danger-500 hover:bg-red-50 text-sm w-full py-3">
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
