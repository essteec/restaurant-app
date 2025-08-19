import useAuth from '../../contexts/use-auth.js';
import CustomerDashboard from './CustomerDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import StaffDashboard from './StaffDashboard.jsx';
import { LoadingSpinner } from '../../components/index.js';

const Dashboard = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    // Route to the appropriate dashboard based on the user role
    switch (user?.role) {
        case 'CUSTOMER':
            return <CustomerDashboard />;
        case 'ADMIN':
            return <AdminDashboard />;
        case 'CHEF':
        case 'WAITER':
            return <StaffDashboard />;
        default:
            return <CustomerDashboard />;
    }
};

export default Dashboard;
