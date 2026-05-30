import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { User, Mail, Phone, Shield, Loader2, CheckCircle2, AlertCircle, Pencil, X, MapPin, Tag, Calendar, LogOut } from 'lucide-react';
import { CityOptions } from '../constants/cities.jsx';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', phone: '', city: '', area: '' });

    useEffect(() => { fetchProfile(); }, []);

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
        if (!form.name.trim()) { setError('Name is required.'); return; }
        setSaving(true);
        setError('');
        try {
            const { data } = await usersAPI.updateProfile(form);
            setProfile(data);
            const storedUser = JSON.parse(sessionStorage.getItem('servx_user') || '{}');
            sessionStorage.setItem('servx_user', JSON.stringify({
                ...storedUser, name: data.name, phone: data.phone,
                city: data.city, area: data.area, location: data.city || data.location
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
                <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
            </div>
        );
    }

    return (
        <div className="bg-surface-50 min-h-screen">
            <div className="section-container py-8 max-w-2xl">
                <h1 className="text-2xl font-semibold text-surface-900 mb-6">My Profile</h1>

                {/* Alerts */}
                {success && (
                    <div className="mb-5 flex items-center gap-2 rounded-lg bg-success-50 border border-success-500/20 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
                        <p className="text-sm text-success-700 font-medium">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="mb-5 flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-500/20 px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-danger-500 flex-shrink-0" />
                        <p className="text-sm text-danger-600">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto p-0.5"><X className="h-3.5 w-3.5 text-danger-400" /></button>
                    </div>
                )}

                <div className="card p-5">
                    {/* Avatar + Header */}
                    <div className="flex items-center gap-4 mb-6 pb-5 border-b border-surface-100">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700 text-xl font-semibold border border-primary-100">
                            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-surface-900 truncate">{profile?.name}</h2>
                            <span className="badge-primary mt-1 inline-flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {roleLabels[profile?.role] || profile?.role}
                            </span>
                        </div>
                        {!editing && (
                            <button
                                onClick={() => { setEditing(true); setForm({ name: profile?.name || '', phone: profile?.phone || '', city: profile?.city || profile?.location || '', area: profile?.area || '' }); }}
                                className="btn-secondary text-xs px-3 py-1.5"
                            >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name</label>
                                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Your name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label>
                                <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="9876543210" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1.5">City</label>
                                    <select value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="input-field">
                                        <CityOptions />
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Area <span className="text-surface-400 font-normal text-xs">(Optional)</span></label>
                                    <input value={form.area} onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))} className="input-field" placeholder="e.g. Andheri West" maxLength={100} />
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
                            {[
                                { icon: Mail, label: 'Email', value: profile?.email },
                                { icon: Phone, label: 'Phone', value: profile?.phone || 'Not set' },
                                ...(profile?.city || profile?.location ? [{ icon: MapPin, label: 'Location', value: `${profile.city || profile.location}${profile?.area ? ` · ${profile.area}` : ''}` }] : []),
                                ...(profile?.service_category ? [{ icon: Tag, label: 'Service Category', value: profile.service_category }] : []),
                                { icon: Calendar, label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-50 text-surface-400 flex-shrink-0">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-surface-400 uppercase tracking-wider">{label}</p>
                                        <p className="text-sm font-medium text-surface-900">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sign Out */}
                <button onClick={logout} className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-danger-500 hover:bg-danger-50 rounded-lg transition-colors">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
