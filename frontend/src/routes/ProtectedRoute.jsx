import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, roles = [] }) {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles.length > 0 && !roles.includes(user?.role)) {
        // Redirect to their role-based dashboard
        const dashboardMap = {
            admin: '/admin-dashboard',
            agent: '/agent-dashboard',
            user: '/dashboard',
        };
        return <Navigate to={dashboardMap[user?.role] || '/'} replace />;
    }

    return children;
}
