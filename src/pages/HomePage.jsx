import useAuth from '../contexts/use-auth.js';
import LandingPage from './public/LandingPage.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import { LoadingSpinner } from '../components/index.js';

const HomePage = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return isAuthenticated ? <Dashboard /> : <LandingPage />;
};

export default HomePage;